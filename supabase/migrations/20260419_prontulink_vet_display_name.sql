-- ProntuLink: assinatura do veterinário exibida no link público.
-- Coluna separada (não reutiliza campos de perfil) para permitir override por consulta,
-- útil em contas de clínica com múltiplos profissionais.

ALTER TABLE public.consultations
  ADD COLUMN IF NOT EXISTS vet_display_name TEXT;
