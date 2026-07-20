
-- Sanctorum 2.0 — expansão editorial aditiva
DO $$ BEGIN
  CREATE TYPE public.saint_content_status AS ENUM ('stub','partial','complete');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.saints
  ADD COLUMN IF NOT EXISTS biography_full jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS historical_context text,
  ADD COLUMN IF NOT EXISTS century integer,
  ADD COLUMN IF NOT EXISTS timeline jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS miracles jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS iconography jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS patronages text[] NOT NULL DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS curiosities text[] NOT NULL DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS spiritual_practice jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS quotes_rich jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS content_status public.saint_content_status NOT NULL DEFAULT 'stub';

CREATE INDEX IF NOT EXISTS saints_content_status_idx ON public.saints(content_status);
CREATE INDEX IF NOT EXISTS saints_feast_month_day_idx ON public.saints(feast_month, feast_day_num);
CREATE INDEX IF NOT EXISTS saints_century_idx ON public.saints(century);
