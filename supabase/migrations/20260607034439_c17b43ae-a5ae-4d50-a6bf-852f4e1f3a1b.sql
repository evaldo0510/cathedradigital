CREATE TABLE IF NOT EXISTS public.bible_integrity_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES public.bible_books(id),
  chapter_number INTEGER NOT NULL,
  calculated_hash TEXT NOT NULL,
  expected_hash TEXT,
  status TEXT NOT NULL CHECK (status IN ('match', 'mismatch', 'missing_source')),
  discrepancy_details JSONB,
  correlation_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bible_integrity_reports TO authenticated;
GRANT ALL ON public.bible_integrity_reports TO service_role;

ALTER TABLE public.bible_integrity_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to authenticated users for bible_integrity_reports" 
ON public.bible_integrity_reports FOR SELECT TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_bible_integrity_status ON public.bible_integrity_reports(status);
CREATE INDEX IF NOT EXISTS idx_bible_integrity_book_chapter ON public.bible_integrity_reports(book_id, chapter_number);
