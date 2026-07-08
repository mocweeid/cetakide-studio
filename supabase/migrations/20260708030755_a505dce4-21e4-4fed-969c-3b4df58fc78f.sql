DROP POLICY IF EXISTS "Projects owner update" ON public.projects;
CREATE POLICY "Projects owner update" ON public.projects
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);