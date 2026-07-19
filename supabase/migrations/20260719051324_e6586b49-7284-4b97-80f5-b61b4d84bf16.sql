
ALTER TABLE public.bible_favorites
  ALTER COLUMN chapter DROP NOT NULL,
  ALTER COLUMN verse_number DROP NOT NULL,
  ALTER COLUMN content DROP NOT NULL;
