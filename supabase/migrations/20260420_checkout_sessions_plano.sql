-- Adiciona coluna `plano` à tabela de checkout sessions para que o webhook
-- saiba qual plano ativar (essential ou platinum) sem depender do valor da cobrança.
ALTER TABLE public.asaas_checkout_sessions
  ADD COLUMN IF NOT EXISTS plano TEXT NOT NULL DEFAULT 'platinum';
