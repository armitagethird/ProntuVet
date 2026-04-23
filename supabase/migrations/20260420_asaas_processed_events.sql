-- Tabela de idempotência para o webhook do Asaas.
-- Garante que o mesmo paymentId nunca seja processado duas vezes,
-- mesmo que o Asaas faça retries após timeouts ou erros transitórios.
CREATE TABLE IF NOT EXISTS public.asaas_processed_events (
  id          BIGSERIAL PRIMARY KEY,
  payment_id  TEXT        NOT NULL UNIQUE,
  evento      TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para lookup rápido na verificação de idempotência
CREATE INDEX IF NOT EXISTS idx_asaas_processed_events_payment_id
  ON public.asaas_processed_events (payment_id);

-- Limpeza automática de registros com mais de 90 dias (evita crescimento ilimitado)
-- Requer pg_cron ou limpeza manual periódica; a tabela é pequena por natureza.

ALTER TABLE public.asaas_processed_events ENABLE ROW LEVEL SECURITY;
-- Apenas a service role (usada pelo webhook) pode inserir/ler
REVOKE ALL ON public.asaas_processed_events FROM anon, authenticated;
