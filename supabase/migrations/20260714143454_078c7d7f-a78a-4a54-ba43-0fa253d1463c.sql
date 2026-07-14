
-- Colunas de atribuição de fonte e controle de reimport incremental
ALTER TABLE public.saints
  ADD COLUMN IF NOT EXISTS source_name text,
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS bio_source_url text,
  ADD COLUMN IF NOT EXISTS prayer_source_url text,
  ADD COLUMN IF NOT EXISTS content_hash text,
  ADD COLUMN IF NOT EXISTS last_scraped_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_saints_last_scraped_at ON public.saints(last_scraped_at);
CREATE INDEX IF NOT EXISTS idx_saints_content_hash ON public.saints(content_hash);
