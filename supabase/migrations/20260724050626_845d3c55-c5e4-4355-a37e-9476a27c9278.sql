
ALTER TABLE public.saints
  ADD COLUMN IF NOT EXISTS alternate_names    text[]  NOT NULL DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS religious_order    text,
  ADD COLUMN IF NOT EXISTS birthplace         text,
  ADD COLUMN IF NOT EXISTS image_source_url   text,
  ADD COLUMN IF NOT EXISTS image_license      text,
  ADD COLUMN IF NOT EXISTS image_attribution  text,
  ADD COLUMN IF NOT EXISTS source_metadata    jsonb   NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS protected_fields   text[]  NOT NULL DEFAULT ARRAY[
    'ai_reflection','spiritual_practice','conversion_story','mission','legacy',
    'prayer','quotes_rich','biography_full'
  ]::text[],
  ADD COLUMN IF NOT EXISTS editorial_score    integer NOT NULL DEFAULT 0
    CHECK (editorial_score BETWEEN 0 AND 100);

CREATE INDEX IF NOT EXISTS idx_saints_source_provider
  ON public.saints ((source_metadata->>'provider'));

CREATE TABLE IF NOT EXISTS public.saint_import_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  saint_id        text NOT NULL REFERENCES public.saints(id) ON DELETE CASCADE,
  provider        text NOT NULL,
  status          text NOT NULL CHECK (status IN ('success','partial','skipped','error')),
  fields_updated  text[] NOT NULL DEFAULT ARRAY[]::text[],
  fields_skipped  text[] NOT NULL DEFAULT ARRAY[]::text[],
  confidence      integer CHECK (confidence BETWEEN 0 AND 100),
  message         text,
  payload         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saint_import_logs_saint    ON public.saint_import_logs(saint_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saint_import_logs_status   ON public.saint_import_logs(status);
CREATE INDEX IF NOT EXISTS idx_saint_import_logs_provider ON public.saint_import_logs(provider);

GRANT SELECT ON public.saint_import_logs TO authenticated;
GRANT ALL    ON public.saint_import_logs TO service_role;

ALTER TABLE public.saint_import_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read saint import logs"
  ON public.saint_import_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::public.app_role
    )
  );

CREATE POLICY "service role manages saint import logs"
  ON public.saint_import_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
