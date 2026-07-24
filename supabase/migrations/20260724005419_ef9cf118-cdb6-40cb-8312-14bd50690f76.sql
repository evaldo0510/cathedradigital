
ALTER TABLE public.catechism_import_queue
  ADD COLUMN IF NOT EXISTS next_attempt_at timestamptz,
  ADD COLUMN IF NOT EXISTS attempts_log jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS catechism_import_queue_status_next_idx
  ON public.catechism_import_queue (status, next_attempt_at NULLS FIRST, requested_at);
