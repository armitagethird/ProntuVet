-- Permite que um checkout seja vinculado a uma organization (plano Clínica).
-- Se organization_id estiver presente, o webhook atualiza a organization.
-- Caso contrário, atualiza o perfil (fluxo individual).

ALTER TABLE public.asaas_checkout_sessions
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- user_id passa a ser opcional (pode ser compra da organização)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'asaas_checkout_sessions'
      AND column_name = 'user_id'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.asaas_checkout_sessions ALTER COLUMN user_id DROP NOT NULL;
  END IF;
END $$;

-- Invariante: exatamente um dos dois deve estar preenchido
ALTER TABLE public.asaas_checkout_sessions
  DROP CONSTRAINT IF EXISTS checkout_sessions_target_check;

ALTER TABLE public.asaas_checkout_sessions
  ADD CONSTRAINT checkout_sessions_target_check
  CHECK (
    (user_id IS NOT NULL AND organization_id IS NULL)
    OR (user_id IS NULL AND organization_id IS NOT NULL)
  );
