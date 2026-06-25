
-- 1) Novos campos para rastrear regressão de performance
ALTER TABLE public.bible_cache_alerts
  ADD COLUMN IF NOT EXISTS metric_kind TEXT,
  ADD COLUMN IF NOT EXISTS observed_p95_ms INTEGER,
  ADD COLUMN IF NOT EXISTS baseline_p95_ms INTEGER,
  ADD COLUMN IF NOT EXISTS correlation_id TEXT,
  ADD COLUMN IF NOT EXISTS l1_phase TEXT;

ALTER TABLE public.bible_cache_alerts
  DROP CONSTRAINT IF EXISTS bible_cache_alerts_metric_kind_chk;
ALTER TABLE public.bible_cache_alerts
  ADD CONSTRAINT bible_cache_alerts_metric_kind_chk
  CHECK (metric_kind IS NULL OR metric_kind IN ('sql_ms','total_ms'));

ALTER TABLE public.bible_cache_alerts
  DROP CONSTRAINT IF EXISTS bible_cache_alerts_l1_phase_chk;
ALTER TABLE public.bible_cache_alerts
  ADD CONSTRAINT bible_cache_alerts_l1_phase_chk
  CHECK (l1_phase IS NULL OR l1_phase IN ('fresh','stale','miss','bypass'));

CREATE INDEX IF NOT EXISTS bible_cache_alerts_kind_metric_idx
  ON public.bible_cache_alerts (kind, metric_kind, created_at DESC);

-- 2) Baseline p95 por livro/métrica (últimos 7 dias, excluindo a última hora)
CREATE OR REPLACE FUNCTION public.bible_cache_baseline_p95(
  p_abbrev TEXT,
  p_metric TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_p95 INTEGER;
BEGIN
  IF p_metric NOT IN ('sql_ms','total_ms') THEN
    RAISE EXCEPTION 'p_metric must be sql_ms or total_ms';
  END IF;

  EXECUTE format(
    'SELECT COALESCE(percentile_cont(0.95) WITHIN GROUP (ORDER BY %I), 0)::INT
       FROM public.bible_cache_metric_events
      WHERE abbrev = $1
        AND %I IS NOT NULL
        AND created_at >= now() - INTERVAL ''7 days''
        AND created_at <  now() - INTERVAL ''1 hour''',
    p_metric, p_metric
  ) INTO v_p95 USING p_abbrev;

  RETURN COALESCE(v_p95, 0);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.bible_cache_baseline_p95(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bible_cache_baseline_p95(TEXT, TEXT) TO service_role;

-- 3) Pior caso por janela (mais lento na métrica avaliada)
CREATE OR REPLACE FUNCTION public.bible_cache_worst_offender(
  p_abbrev TEXT,
  p_bucket_start TIMESTAMPTZ,
  p_metric TEXT
)
RETURNS TABLE (correlation_id TEXT, l1_phase TEXT, value_ms INTEGER, cache TEXT)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF p_metric NOT IN ('sql_ms','total_ms') THEN
    RAISE EXCEPTION 'p_metric must be sql_ms or total_ms';
  END IF;

  RETURN QUERY EXECUTE format(
    'SELECT e.correlation_id, e.l1_phase, e.%I::INT AS value_ms, e.cache
       FROM public.bible_cache_metric_events e
      WHERE e.abbrev = $1
        AND e.created_at >= $2
        AND e.created_at <  $2 + INTERVAL ''1 hour''
        AND e.%I IS NOT NULL
      ORDER BY e.%I DESC NULLS LAST
      LIMIT 1',
    p_metric, p_metric, p_metric
  ) USING p_abbrev, p_bucket_start;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.bible_cache_worst_offender(TEXT, TIMESTAMPTZ, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bible_cache_worst_offender(TEXT, TIMESTAMPTZ, TEXT) TO service_role;
