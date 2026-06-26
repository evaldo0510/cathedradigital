ALTER TABLE public.bible_cache_metric_events
  ADD COLUMN IF NOT EXISTS cold_start BOOLEAN,
  ADD COLUMN IF NOT EXISTS cache_level TEXT,
  ADD COLUMN IF NOT EXISTS total_wall_clock_ms INTEGER,
  ADD COLUMN IF NOT EXISTS instance_id TEXT,
  ADD COLUMN IF NOT EXISTS request_source TEXT;

CREATE INDEX IF NOT EXISTS idx_bible_cache_events_instance_id
  ON public.bible_cache_metric_events (instance_id)
  WHERE instance_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bible_cache_events_cache_level
  ON public.bible_cache_metric_events (cache_level, created_at DESC)
  WHERE cache_level IS NOT NULL;

COMMENT ON COLUMN public.bible_cache_metric_events.cold_start IS 'true apenas na primeira request servida pelo isolate da Edge (PR-B2).';
COMMENT ON COLUMN public.bible_cache_metric_events.cache_level IS 'Nível efetivo do cache que respondeu: L1 (memória), L2 (DB cache), DB (revalidado upstream) ou UNAVAILABLE.';
COMMENT ON COLUMN public.bible_cache_metric_events.total_wall_clock_ms IS 'Wall-clock real do handler (Date.now()-t0), pode diferir do total_ms agregado em SWR backgrounds.';
COMMENT ON COLUMN public.bible_cache_metric_events.instance_id IS 'UUID gerado no boot do isolate da Edge — permite agrupar eventos servidos pelo mesmo runtime.';
COMMENT ON COLUMN public.bible_cache_metric_events.request_source IS 'Origem do request via header x-request-source (web, warm, admin, audit, etc.).';