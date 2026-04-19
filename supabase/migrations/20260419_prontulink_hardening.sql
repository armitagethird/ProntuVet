-- ProntuLink hardening: TTL reduzido para 14 dias + coluna de revogação + policy robusta.

-- 1) TTL padrão mais curto (14 dias). Casos de uso: follow-up pós-consulta e dúvidas do tutor.
ALTER TABLE public.consultations
  ALTER COLUMN tutor_token_expires_at SET DEFAULT (now() + interval '14 days');

-- 2) Coluna de revogação manual (vet pode invalidar um link sem deletar o token).
ALTER TABLE public.consultations
  ADD COLUMN IF NOT EXISTS tutor_token_revoked_at TIMESTAMPTZ;

-- 3) Normaliza registros existentes cuja expiração foi setada com o TTL antigo de 30 dias.
UPDATE public.consultations
  SET tutor_token_expires_at = now() + interval '14 days'
  WHERE tutor_token_expires_at > now() + interval '14 days'
    AND tutor_token_revoked_at IS NULL;

-- 4) Recria a policy anon incluindo a checagem de revogação.
DROP POLICY IF EXISTS "Anon pode ler consulta por token valido" ON public.consultations;

CREATE POLICY "Anon pode ler consulta por token valido"
  ON public.consultations FOR SELECT
  TO anon
  USING (
    tutor_token IS NOT NULL
    AND tutor_token_expires_at > now()
    AND tutor_token_revoked_at IS NULL
  );
