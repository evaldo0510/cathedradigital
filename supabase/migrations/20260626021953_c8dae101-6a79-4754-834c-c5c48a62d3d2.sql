
CREATE TABLE IF NOT EXISTS public.bible_diagnostic_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running',
  triggered_by TEXT NOT NULL DEFAULT 'manual',
  triggered_user UUID,
  total_books_checked INTEGER NOT NULL DEFAULT 0,
  total_chapters_checked INTEGER NOT NULL DEFAULT 0,
  total_findings INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER,
  error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT bible_diagnostic_runs_status_chk CHECK (status IN ('running','ok','warning','error'))
);

GRANT SELECT ON public.bible_diagnostic_runs TO authenticated;
GRANT ALL ON public.bible_diagnostic_runs TO service_role;

ALTER TABLE public.bible_diagnostic_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view diagnostic runs"
  ON public.bible_diagnostic_runs FOR SELECT
  USING (public.is_current_user_admin());

CREATE TRIGGER trg_bible_diagnostic_runs_updated_at
  BEFORE UPDATE ON public.bible_diagnostic_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_bible_diagnostic_runs_started_at
  ON public.bible_diagnostic_runs (started_at DESC);

CREATE TABLE IF NOT EXISTS public.bible_diagnostic_findings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES public.bible_diagnostic_runs(id) ON DELETE CASCADE,
  abbrev TEXT NOT NULL,
  book_name TEXT NOT NULL,
  chapter INTEGER,
  finding_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'warning',
  message TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT bible_diag_find_sev_chk CHECK (severity IN ('info','warning','error','critical')),
  CONSTRAINT bible_diag_find_type_chk CHECK (finding_type IN ('missing_book','missing_chapter','chapter_count_mismatch','empty_chapter','language_mismatch','metadata_invalid','duplicate_chapter','other'))
);

GRANT SELECT ON public.bible_diagnostic_findings TO authenticated;
GRANT ALL ON public.bible_diagnostic_findings TO service_role;

ALTER TABLE public.bible_diagnostic_findings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view diagnostic findings"
  ON public.bible_diagnostic_findings FOR SELECT
  USING (public.is_current_user_admin());

CREATE INDEX idx_bible_diag_findings_run ON public.bible_diagnostic_findings (run_id);
CREATE INDEX idx_bible_diag_findings_type ON public.bible_diagnostic_findings (finding_type);
CREATE INDEX idx_bible_diag_findings_abbrev ON public.bible_diagnostic_findings (abbrev);
