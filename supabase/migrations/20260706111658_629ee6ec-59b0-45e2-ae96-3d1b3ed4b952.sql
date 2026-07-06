ALTER TABLE public.ai_providers
  ADD COLUMN IF NOT EXISTS priority INT NOT NULL DEFAULT 999,
  ADD COLUMN IF NOT EXISTS last_status TEXT,
  ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failure_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS disabled_until TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS ai_providers_user_priority_idx
  ON public.ai_providers (user_id, is_active, priority);

CREATE TABLE IF NOT EXISTS public.ai_key_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.ai_providers(id) ON DELETE SET NULL,
  event TEXT NOT NULL,
  status_code INT,
  detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.ai_key_events TO authenticated;
GRANT ALL ON public.ai_key_events TO service_role;
ALTER TABLE public.ai_key_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_key_events_select" ON public.ai_key_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own_key_events_insert" ON public.ai_key_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS ai_key_events_user_created_idx
  ON public.ai_key_events (user_id, created_at DESC);