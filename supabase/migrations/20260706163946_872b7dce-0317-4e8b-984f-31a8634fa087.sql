
-- Add missing grants for ai_providers (RLS policy already restricts to developer role)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_providers TO authenticated;
GRANT ALL ON public.ai_providers TO service_role;

-- Audit log table
CREATE TABLE public.ai_provider_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID,
  actor_id UUID,
  action TEXT NOT NULL,
  provider TEXT,
  model TEXT,
  label TEXT,
  api_key_masked TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.ai_provider_audit_log TO authenticated;
GRANT ALL ON public.ai_provider_audit_log TO service_role;

ALTER TABLE public.ai_provider_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "developers can read audit"
  ON public.ai_provider_audit_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'developer'));

CREATE POLICY "developers can insert audit"
  ON public.ai_provider_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'developer') AND actor_id = auth.uid());

-- Trigger to auto-log changes on ai_providers
CREATE OR REPLACE FUNCTION public.log_ai_provider_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _key TEXT;
  _masked TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    _key := OLD.api_key;
  ELSE
    _key := NEW.api_key;
  END IF;
  IF _key IS NULL OR length(_key) <= 10 THEN
    _masked := repeat('•', COALESCE(length(_key),0));
  ELSE
    _masked := substr(_key,1,6) || repeat('•', GREATEST(4, length(_key)-10)) || substr(_key, length(_key)-3);
  END IF;

  INSERT INTO public.ai_provider_audit_log(provider_id, actor_id, action, provider, model, label, api_key_masked, details)
  VALUES (
    COALESCE(NEW.id, OLD.id),
    auth.uid(),
    lower(TG_OP),
    COALESCE(NEW.provider, OLD.provider),
    COALESCE(NEW.model, OLD.model),
    COALESCE(NEW.label, OLD.label),
    _masked,
    CASE WHEN TG_OP='UPDATE' THEN jsonb_build_object(
      'is_active_old', OLD.is_active, 'is_active_new', NEW.is_active,
      'priority_old', OLD.priority, 'priority_new', NEW.priority,
      'model_old', OLD.model, 'model_new', NEW.model
    ) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_ai_providers_audit ON public.ai_providers;
CREATE TRIGGER trg_ai_providers_audit
AFTER INSERT OR UPDATE OR DELETE ON public.ai_providers
FOR EACH ROW EXECUTE FUNCTION public.log_ai_provider_change();
