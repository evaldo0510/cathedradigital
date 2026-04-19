-- Add trigram extension for fuzzy/full-text search on saints
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN index for fast ILIKE / similarity search on name
CREATE INDEX IF NOT EXISTS idx_saints_name_trgm
  ON public.saints USING gin (name gin_trgm_ops);

-- GIN index for fast ILIKE / similarity search on title
CREATE INDEX IF NOT EXISTS idx_saints_title_trgm
  ON public.saints USING gin (title gin_trgm_ops);

-- Composite index for daily saint lookups (already common query)
CREATE INDEX IF NOT EXISTS idx_saints_feast
  ON public.saints (feast_month, feast_day_num);

-- Index for category filtering (writers, popes, etc.)
CREATE INDEX IF NOT EXISTS idx_saints_category
  ON public.saints (category);