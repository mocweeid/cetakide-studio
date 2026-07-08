DROP POLICY IF EXISTS "ai_providers developer all" ON public.ai_providers;
DROP POLICY IF EXISTS "ai_providers owner or developer all" ON public.ai_providers;
CREATE POLICY "ai_providers owner or developer all" ON public.ai_providers
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'developer'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'developer'));