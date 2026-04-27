ALTER TABLE public.catechism_cache 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'generated',
ADD COLUMN IF NOT EXISTS last_error TEXT;

CREATE INDEX IF NOT EXISTS idx_catechism_cache_status ON public.catechism_cache(status);