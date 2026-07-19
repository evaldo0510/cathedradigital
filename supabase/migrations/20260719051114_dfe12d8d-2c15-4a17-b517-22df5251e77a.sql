
-- Estende bible_favorites para suportar favoritos genéricos (orações, trechos devocionais)
ALTER TABLE public.bible_favorites
  ADD COLUMN IF NOT EXISTS content_type text NOT NULL DEFAULT 'bible_verse',
  ADD COLUMN IF NOT EXISTS content_id text,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS url text,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Torna book_abbr opcional (só faz sentido para versículos)
ALTER TABLE public.bible_favorites
  ALTER COLUMN book_abbr DROP NOT NULL;

-- Índice para lookups por tipo/conteúdo (evita duplicados na mesma referência)
CREATE UNIQUE INDEX IF NOT EXISTS bible_favorites_user_content_unique
  ON public.bible_favorites (user_id, content_type, coalesce(content_id, ''), coalesce(book_abbr, ''), coalesce(chapter, 0), coalesce(verse_number, 0));

CREATE INDEX IF NOT EXISTS bible_favorites_user_type_idx
  ON public.bible_favorites (user_id, content_type, created_at DESC);
