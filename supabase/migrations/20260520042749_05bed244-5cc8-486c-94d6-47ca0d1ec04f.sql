-- Add context columns to user_notes
ALTER TABLE public.user_notes 
ADD COLUMN IF NOT EXISTS book_abbr TEXT,
ADD COLUMN IF NOT EXISTS chapter INTEGER,
ADD COLUMN IF NOT EXISTS paragraph INTEGER,
ADD COLUMN IF NOT EXISTS verse INTEGER;

-- Create an index for faster context-based lookups
CREATE INDEX IF NOT EXISTS idx_user_notes_context ON public.user_notes (book_abbr, chapter, paragraph);