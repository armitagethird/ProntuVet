-- Registro de aceite LGPD + Termos de Uso.
-- Guarda também a versão aceita para auditoria futura quando os documentos mudarem.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS lgpd_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS lgpd_version     TEXT;
