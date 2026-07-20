
ALTER TABLE public.glossary
  ADD COLUMN IF NOT EXISTS editorial_completeness text NOT NULL DEFAULT 'expanding',
  ADD COLUMN IF NOT EXISTS etymology text;

ALTER TABLE public.glossary
  DROP CONSTRAINT IF EXISTS glossary_editorial_completeness_check;

ALTER TABLE public.glossary
  ADD CONSTRAINT glossary_editorial_completeness_check
  CHECK (editorial_completeness = ANY (ARRAY['complete','expanding','reviewed_theologically']));

CREATE INDEX IF NOT EXISTS idx_glossary_editorial_completeness
  ON public.glossary(editorial_completeness);
