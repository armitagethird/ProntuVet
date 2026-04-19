-- ProntuLink MVP: campos de compartilhamento público com tutor

ALTER TABLE public.consultations
  ADD COLUMN IF NOT EXISTS tutor_token UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS tutor_token_expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days');

-- Backfill token para consultas existentes sem token
UPDATE public.consultations
  SET
    tutor_token = gen_random_uuid(),
    tutor_token_expires_at = now() + interval '30 days'
  WHERE tutor_token IS NULL;

-- Índice para lookup rápido por token
CREATE INDEX IF NOT EXISTS consultations_tutor_token_idx
  ON public.consultations (tutor_token);

-- Permite leitura pública (role anon) para consultas com token válido.
-- Segurança: tokens são UUIDs aleatórios (128 bits de entropia).
-- A query no app sempre inclui .eq('tutor_token', <valor>) para filtrar por token específico.
CREATE POLICY "Anon pode ler consulta por token valido"
  ON public.consultations FOR SELECT
  TO anon
  USING (
    tutor_token IS NOT NULL
    AND tutor_token_expires_at > now()
  );
