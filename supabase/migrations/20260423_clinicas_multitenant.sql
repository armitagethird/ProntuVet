-- Multi-tenant "leve" para o plano Clínica.
--
-- Modelo:
-- - Cada veterinário continua dono dos prontuários (consultations.user_id).
-- - A organização (clínica) é um grupo de veterinários com um plano compartilhado.
-- - Membros da mesma organização podem LER os prontuários dos colegas
--   (útil para continuidade de atendimento e auditoria da clínica).
-- - Edição e exclusão permanecem restritas ao dono individual do prontuário.
-- - Limites do plano Clínica (600/mês, 60/dia) são agregados entre todos os membros.

-- 1) Tabela de organizações
CREATE TABLE IF NOT EXISTS public.organizations (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome                    TEXT NOT NULL,
  plano                   TEXT NOT NULL DEFAULT 'clinica' CHECK (plano IN ('clinica')),
  status                  TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo','bloqueado','cancelado')),
  asaas_subscription_id   TEXT,
  data_vencimento         TIMESTAMPTZ,
  created_by              UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_organizations_asaas_sub
  ON public.organizations (asaas_subscription_id)
  WHERE asaas_subscription_id IS NOT NULL;

-- 2) Membros da organização
CREATE TABLE IF NOT EXISTS public.organization_members (
  organization_id  UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role             TEXT NOT NULL CHECK (role IN ('owner','admin','vet')),
  joined_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, user_id)
);

-- Um usuário só pode pertencer a uma organização por vez (simplicidade de billing).
CREATE UNIQUE INDEX IF NOT EXISTS uq_organization_members_user
  ON public.organization_members (user_id);

-- 3) Convites pendentes
CREATE TABLE IF NOT EXISTS public.organization_invites (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email            TEXT NOT NULL,
  role             TEXT NOT NULL DEFAULT 'vet' CHECK (role IN ('admin','vet')),
  token            UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  expires_at       TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at      TIMESTAMPTZ,
  created_by       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_organization_invites_token
  ON public.organization_invites (token)
  WHERE accepted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_organization_invites_email
  ON public.organization_invites (lower(email))
  WHERE accepted_at IS NULL;

-- 4) FK opcional em profiles apontando para org (ajuda queries rápidas)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_organization_id
  ON public.profiles (organization_id)
  WHERE organization_id IS NOT NULL;

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.organizations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invites ENABLE ROW LEVEL SECURITY;

-- Função helper: retorna a org do usuário atual (evita recursão em policies).
CREATE OR REPLACE FUNCTION public.current_user_org()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.current_user_org() TO authenticated;

-- Organizations: membros podem ler; apenas owner pode atualizar; ninguém deleta via API.
DROP POLICY IF EXISTS "members read own org" ON public.organizations;
CREATE POLICY "members read own org"
  ON public.organizations FOR SELECT TO authenticated
  USING (id = public.current_user_org());

DROP POLICY IF EXISTS "owner updates own org" ON public.organizations;
CREATE POLICY "owner updates own org"
  ON public.organizations FOR UPDATE TO authenticated
  USING (
    id = public.current_user_org()
    AND EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.organization_id = organizations.id
        AND m.user_id = auth.uid()
        AND m.role = 'owner'
    )
  );

-- Organization members: membros veem os colegas; owner/admin removem.
DROP POLICY IF EXISTS "read own org members" ON public.organization_members;
CREATE POLICY "read own org members"
  ON public.organization_members FOR SELECT TO authenticated
  USING (organization_id = public.current_user_org());

DROP POLICY IF EXISTS "admin removes members" ON public.organization_members;
CREATE POLICY "admin removes members"
  ON public.organization_members FOR DELETE TO authenticated
  USING (
    organization_id = public.current_user_org()
    AND EXISTS (
      SELECT 1 FROM public.organization_members me
      WHERE me.organization_id = organization_members.organization_id
        AND me.user_id = auth.uid()
        AND me.role IN ('owner','admin')
    )
    AND user_id <> auth.uid() -- não se auto-remove pela policy; endpoint dedicado cuida disso
  );

-- Invites: membros admin/owner veem convites da sua org.
DROP POLICY IF EXISTS "admin reads invites" ON public.organization_invites;
CREATE POLICY "admin reads invites"
  ON public.organization_invites FOR SELECT TO authenticated
  USING (
    organization_id = public.current_user_org()
    AND EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.organization_id = organization_invites.organization_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','admin')
    )
  );

-- Writes sempre via API server-side (service role). Cliente NUNCA escreve.
REVOKE INSERT, UPDATE, DELETE ON public.organizations        FROM anon, authenticated;
REVOKE INSERT, UPDATE        ON public.organization_members FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.organization_invites FROM anon, authenticated;

-- ============================================================
-- CROSS-ACCESS: membros da mesma org podem LER consultations e animals
-- dos colegas, para continuidade de atendimento.
-- ============================================================

DROP POLICY IF EXISTS "org members read colleagues consultations" ON public.consultations;
CREATE POLICY "org members read colleagues consultations"
  ON public.consultations FOR SELECT TO authenticated
  USING (
    public.current_user_org() IS NOT NULL
    AND user_id IN (
      SELECT user_id FROM public.organization_members
      WHERE organization_id = public.current_user_org()
    )
  );

DROP POLICY IF EXISTS "org members read colleagues animals" ON public.animals;
CREATE POLICY "org members read colleagues animals"
  ON public.animals FOR SELECT TO authenticated
  USING (
    public.current_user_org() IS NOT NULL
    AND user_id IN (
      SELECT user_id FROM public.organization_members
      WHERE organization_id = public.current_user_org()
    )
  );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.handle_organizations_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_organizations_updated_at ON public.organizations;
CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.handle_organizations_updated_at();
