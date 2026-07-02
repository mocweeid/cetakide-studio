
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_code text NOT NULL DEFAULT ('TRX-' || upper(substr(md5(random()::text),1,10))),
  amount integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  method text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tx owner select" ON public.transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "tx owner insert" ON public.transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tx owner update" ON public.transactions FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER trg_tx_updated BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Extend projects for workspace form
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS subtitle text,
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS social_url text,
  ADD COLUMN IF NOT EXISTS body_content text,
  ADD COLUMN IF NOT EXISTS reference_url text;
