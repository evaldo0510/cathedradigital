
-- 1) Coluna que classifica o resultado do L1 para o request (fresh|stale|miss|bypass)
ALTER TABLE public.bible_cache_metric_events
  ADD COLUMN IF NOT EXISTS l1_phase TEXT;

ALTER TABLE public.bible_cache_metric_events
  DROP CONSTRAINT IF EXISTS bible_cache_metric_events_l1_phase_chk;
ALTER TABLE public.bible_cache_metric_events
  ADD CONSTRAINT bible_cache_metric_events_l1_phase_chk
  CHECK (l1_phase IS NULL OR l1_phase IN ('fresh','stale','miss','bypass'));

CREATE INDEX IF NOT EXISTS bible_cache_metric_events_l1_phase_idx
  ON public.bible_cache_metric_events (l1_phase, created_at DESC);

CREATE INDEX IF NOT EXISTS bible_cache_metric_events_correlation_id_idx
  ON public.bible_cache_metric_events (correlation_id);

-- 2) Contadores agregados de L1 no rollup horário
ALTER TABLE public.bible_cache_metrics
  ADD COLUMN IF NOT EXISTS l1_fresh BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS l1_stale BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS l1_miss BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS l1_invalidate BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS l1_swr_refresh BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS l1_single_flight BIGINT NOT NULL DEFAULT 0;

-- 3) Atualiza a função de agregação para alimentar os novos contadores
CREATE OR REPLACE FUNCTION public.aggregate_bible_cache_metrics(p_since interval DEFAULT '00:20:00'::interval)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_count INTEGER;
BEGIN
  WITH src AS (
    SELECT
      date_trunc('hour', created_at) AS bucket_start,
      abbrev,
      COUNT(*) FILTER (WHERE cache = 'HIT')                              AS hits,
      COUNT(*) FILTER (WHERE cache = 'MISS')                             AS misses,
      COUNT(*) FILTER (WHERE cache IN ('STALE','STALE_LAST_RESORT'))     AS stale,
      COUNT(*) FILTER (WHERE status_code >= 400)                         AS errors,
      COUNT(*)                                                           AS total,
      COALESCE(SUM(total_ms), 0)::BIGINT                                 AS sum_ms,
      COALESCE(MAX(total_ms), 0)::INT                                    AS max_ms,
      COALESCE(percentile_cont(0.95) WITHIN GROUP (ORDER BY total_ms), 0)::INT AS p95_ms,
      COUNT(*) FILTER (WHERE bolls_called)                               AS bolls_calls,
      COUNT(*) FILTER (WHERE bolls_called AND bolls_ok = false)          AS bolls_failures,
      COALESCE(SUM(bolls_ms) FILTER (WHERE bolls_called), 0)::BIGINT     AS bolls_sum_ms,
      COALESCE(SUM(sql_ms), 0)::BIGINT                                   AS sum_sql_ms,
      COALESCE(SUM(edge_ms), 0)::BIGINT                                  AS sum_edge_ms,
      COALESCE(SUM(render_ms) FILTER (WHERE render_ms IS NOT NULL), 0)::BIGINT AS sum_render_ms,
      COUNT(*) FILTER (WHERE render_ms IS NOT NULL)                      AS render_samples,
      COUNT(*) FILTER (WHERE l1_phase = 'fresh')                         AS l1_fresh,
      COUNT(*) FILTER (WHERE l1_phase = 'stale')                         AS l1_stale,
      COUNT(*) FILTER (WHERE l1_phase = 'miss')                          AS l1_miss
    FROM public.bible_cache_metric_events
    WHERE created_at >= now() - p_since
    GROUP BY 1, 2
  )
  INSERT INTO public.bible_cache_metrics AS m (
    bucket_start, abbrev, hits, misses, stale, errors, total,
    sum_ms, max_ms, p95_ms, bolls_calls, bolls_failures, bolls_sum_ms,
    sum_sql_ms, sum_edge_ms, sum_render_ms, render_samples,
    l1_fresh, l1_stale, l1_miss, updated_at
  )
  SELECT bucket_start, abbrev, hits, misses, stale, errors, total,
         sum_ms, max_ms, p95_ms, bolls_calls, bolls_failures, bolls_sum_ms,
         sum_sql_ms, sum_edge_ms, sum_render_ms, render_samples,
         l1_fresh, l1_stale, l1_miss, now()
  FROM src
  ON CONFLICT (bucket_start, abbrev) DO UPDATE SET
    hits           = EXCLUDED.hits,
    misses         = EXCLUDED.misses,
    stale          = EXCLUDED.stale,
    errors         = EXCLUDED.errors,
    total          = EXCLUDED.total,
    sum_ms         = EXCLUDED.sum_ms,
    max_ms         = GREATEST(m.max_ms, EXCLUDED.max_ms),
    p95_ms         = EXCLUDED.p95_ms,
    bolls_calls    = EXCLUDED.bolls_calls,
    bolls_failures = EXCLUDED.bolls_failures,
    bolls_sum_ms   = EXCLUDED.bolls_sum_ms,
    sum_sql_ms     = EXCLUDED.sum_sql_ms,
    sum_edge_ms    = EXCLUDED.sum_edge_ms,
    sum_render_ms  = EXCLUDED.sum_render_ms,
    render_samples = EXCLUDED.render_samples,
    l1_fresh       = EXCLUDED.l1_fresh,
    l1_stale       = EXCLUDED.l1_stale,
    l1_miss        = EXCLUDED.l1_miss,
    updated_at     = now();
  GET DIAGNOSTICS v_count = ROW_COUNT;

  DELETE FROM public.bible_cache_metric_events WHERE created_at < now() - INTERVAL '7 days';

  RETURN v_count;
END;
$function$;
