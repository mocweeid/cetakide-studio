ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS job_id TEXT,
  ADD COLUMN IF NOT EXISTS provider TEXT,
  ADD COLUMN IF NOT EXISTS error_message TEXT;
CREATE INDEX IF NOT EXISTS projects_job_id_idx ON public.projects(job_id);
CREATE INDEX IF NOT EXISTS projects_user_created_idx ON public.projects(user_id, created_at DESC);