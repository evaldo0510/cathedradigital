ALTER TABLE public.vatican_cache
  ADD COLUMN IF NOT EXISTS content_length integer,
  ADD COLUMN IF NOT EXISTS fetched_status text,
  ADD COLUMN IF NOT EXISTS last_attempt_at timestamptz;

-- Backfill content_length para linhas existentes
UPDATE public.vatican_cache
   SET content_length = char_length(content)
 WHERE content_length IS NULL;

CREATE INDEX IF NOT EXISTS vatican_cache_status_idx ON public.vatican_cache (fetched_status);
CREATE INDEX IF NOT EXISTS vatican_cache_last_attempt_idx ON public.vatican_cache (last_attempt_at);
