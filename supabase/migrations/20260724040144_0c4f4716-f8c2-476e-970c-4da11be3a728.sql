ALTER TABLE public.saints
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS vocation text,
  ADD COLUMN IF NOT EXISTS ai_reflection jsonb;

CREATE INDEX IF NOT EXISTS idx_saints_country ON public.saints (country);
CREATE INDEX IF NOT EXISTS idx_saints_vocation ON public.saints (vocation);
CREATE INDEX IF NOT EXISTS idx_saints_virtues_gin ON public.saints USING gin (virtues);