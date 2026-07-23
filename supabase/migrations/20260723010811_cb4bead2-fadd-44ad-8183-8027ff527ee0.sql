
CREATE TABLE public.editorial_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module TEXT NOT NULL DEFAULT 'glossary',
  bucket TEXT NOT NULL,
  operator UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  duration_ms INTEGER,
  tasks_total INTEGER NOT NULL DEFAULT 0,
  tasks_ok INTEGER NOT NULL DEFAULT 0,
  tasks_fail INTEGER NOT NULL DEFAULT 0,
  ice_before NUMERIC(5,2),
  ice_after NUMERIC(5,2),
  ice_delta NUMERIC(5,2),
  ice_weighted_before NUMERIC(5,2),
  ice_weighted_after NUMERIC(5,2),
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running','completed','cancelled','failed')),
  results JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.editorial_jobs TO authenticated;
GRANT ALL ON public.editorial_jobs TO service_role;

ALTER TABLE public.editorial_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view editorial jobs"
  ON public.editorial_jobs FOR SELECT
  TO authenticated
  USING (auth_internal.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can create editorial jobs"
  ON public.editorial_jobs FOR INSERT
  TO authenticated
  WITH CHECK (auth_internal.has_role(auth.uid(), 'admin'::public.app_role) AND operator = auth.uid());

CREATE POLICY "Admins can update own editorial jobs"
  ON public.editorial_jobs FOR UPDATE
  TO authenticated
  USING (auth_internal.has_role(auth.uid(), 'admin'::public.app_role) AND operator = auth.uid())
  WITH CHECK (auth_internal.has_role(auth.uid(), 'admin'::public.app_role) AND operator = auth.uid());

CREATE INDEX idx_editorial_jobs_started ON public.editorial_jobs (started_at DESC);
CREATE INDEX idx_editorial_jobs_module ON public.editorial_jobs (module, started_at DESC);
