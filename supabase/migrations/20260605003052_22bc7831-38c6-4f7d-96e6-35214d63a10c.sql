CREATE TABLE public.bible_favorites (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    book_abbr TEXT NOT NULL,
    chapter INTEGER NOT NULL,
    verse_number INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, book_abbr, chapter, verse_number)
);

GRANT SELECT, INSERT, DELETE ON public.bible_favorites TO authenticated;
GRANT ALL ON public.bible_favorites TO service_role;

ALTER TABLE public.bible_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own favorites" 
ON public.bible_favorites 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_bible_favorites_user_id ON public.bible_favorites(user_id);
CREATE INDEX idx_bible_favorites_location ON public.bible_favorites(book_abbr, chapter, verse_number);