
CREATE TABLE public.bible_chapters_read (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  book_abbr text NOT NULL,
  chapter integer NOT NULL,
  read_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, book_abbr, chapter)
);

ALTER TABLE public.bible_chapters_read ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chapters read"
ON public.bible_chapters_read FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chapters read"
ON public.bible_chapters_read FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chapters read"
ON public.bible_chapters_read FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX idx_bible_chapters_read_user ON public.bible_chapters_read (user_id);
CREATE INDEX idx_bible_chapters_read_book ON public.bible_chapters_read (user_id, book_abbr);
