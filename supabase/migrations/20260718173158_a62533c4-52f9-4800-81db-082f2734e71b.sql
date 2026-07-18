CREATE TABLE public.integration_test_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id TEXT NOT NULL,
  ok BOOLEAN NOT NULL,
  message TEXT NOT NULL,
  latency_ms INTEGER,
  tested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_integration_test_runs_integration_created
  ON public.integration_test_runs (integration_id, created_at DESC);

GRANT SELECT, INSERT ON public.integration_test_runs TO authenticated;
GRANT ALL ON public.integration_test_runs TO service_role;

ALTER TABLE public.integration_test_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read integration test history"
  ON public.integration_test_runs FOR SELECT
  TO authenticated
  USING (public.is_current_user_admin());

CREATE POLICY "Admins can insert integration test runs"
  ON public.integration_test_runs FOR INSERT
  TO authenticated
  WITH CHECK (public.is_current_user_admin() AND tested_by = auth.uid());