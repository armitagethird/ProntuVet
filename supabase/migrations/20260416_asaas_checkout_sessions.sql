CREATE TABLE IF NOT EXISTS public.asaas_checkout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_session_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asaas_cs ON public.asaas_checkout_sessions(checkout_session_id);

ALTER TABLE public.asaas_checkout_sessions ENABLE ROW LEVEL SECURITY;
