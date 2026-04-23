-- Hardening RLS: uso_consultas, asaas_checkout_sessions, asaas_processed_events
--
-- Contexto: uso_consultas é escrita exclusivamente pelo Edge Function (service role)
-- e lida pelo frontend apenas para mostrar consumo do próprio usuário.
-- asaas_checkout_sessions mapeia checkout_session_id -> user_id + plano,
-- usado pelo webhook (service role). O cliente nunca deve acessar.

-- 1) uso_consultas
ALTER TABLE public.uso_consultas ENABLE ROW LEVEL SECURITY;

-- Idempotente: DROP + CREATE para permitir rerun da migração em caso de policy órfã.
DROP POLICY IF EXISTS "Users can view their own usage" ON public.uso_consultas;
CREATE POLICY "Users can view their own usage"
  ON public.uso_consultas FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Escrita somente via service_role (Edge Function). Bloqueia manipulação pelo cliente.
REVOKE INSERT, UPDATE, DELETE ON public.uso_consultas FROM anon, authenticated;

-- 2) asaas_checkout_sessions: nunca deve ser acessada pelo cliente
REVOKE ALL ON public.asaas_checkout_sessions FROM anon, authenticated;

-- 3) asaas_processed_events: reforça revoke (já existe, mas garante idempotência).
REVOKE ALL ON public.asaas_processed_events FROM anon, authenticated;
