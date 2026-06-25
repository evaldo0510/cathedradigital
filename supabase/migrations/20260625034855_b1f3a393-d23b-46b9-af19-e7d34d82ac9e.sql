
CREATE OR REPLACE FUNCTION public.bible_cache_timeseries(
  p_window_minutes INTEGER DEFAULT 5,
  p_since_hours INTEGER DEFAULT 24,
  p_abbrev TEXT DEFAULT NULL
)
RETURNS TABLE (
  bucket_start TIMESTAMPTZ,
  abbrev TEXT,
  total BIGINT,
  hits BIGINT,
  misses BIGINT,
  stale BIGINT,
  cache_hit_rate NUMERIC,
  invalidation_rate NUMERIC,
  l1_fresh BIGINT,
  l1_stale BIGINT,
  l1_miss BIGINT,
  l1_bypass BIGINT,
  edge_avg_ms NUMERIC,
  edge_p50_ms INTEGER,
  edge_p95_ms INTEGER,
  edge_max_ms INTEGER,
  total_avg_ms NUMERIC,
  total_p50_ms INTEGER,
  total_p95_ms INTEGER,
  total_max_ms INTEGER,
  sql_avg_ms NUMERIC,
  sql_p95_ms INTEGER,
  worst_correlation_ids TEXT[]
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_window_s INTEGER;
BEGIN
  IF p_window_minutes < 1 OR p_window_minutes > 1440 THEN
    RAISE EXCEPTION 'p_window_minutes must be between 1 and 1440';
  END IF;
  IF p_since_hours < 1 OR p_since_hours > 720 THEN
    RAISE EXCEPTION 'p_since_hours must be between 1 and 720';
  END IF;

  v_window_s := p_window_minutes * 60;

  RETURN QUERY
  WITH base AS (
    SELECT
      to_timestamp(floor(extract(epoch FROM e.created_at) / v_window_s) * v_window_s) AS bkt,
      e.abbrev      AS abbr,
      e.cache       AS cache,
      e.l1_phase    AS l1_phase,
      e.total_ms    AS total_ms,
      e.sql_ms      AS sql_ms,
      e.edge_ms     AS edge_ms,
      e.correlation_id AS correlation_id
    FROM public.bible_cache_metric_events e
    WHERE e.created_at >= now() - make_interval(hours => p_since_hours)
      AND (p_abbrev IS NULL OR e.abbrev = p_abbrev)
  ),
  ranked AS (
    SELECT
      bkt, abbr, correlation_id, total_ms,
      row_number() OVER (PARTITION BY bkt, abbr ORDER BY total_ms DESC NULLS LAST) AS rn
    FROM base
  ),
  worst AS (
    SELECT
      r.bkt, r.abbr,
      array_agg(r.correlation_id ORDER BY r.total_ms DESC NULLS LAST)
        FILTER (WHERE r.correlation_id IS NOT NULL) AS ids
    FROM ranked r
    WHERE r.rn <= 5
    GROUP BY r.bkt, r.abbr
  )
  SELECT
    b.bkt                                                                               AS bucket_start,
    b.abbr                                                                              AS abbrev,
    COUNT(*)::BIGINT                                                                    AS total,
    COUNT(*) FILTER (WHERE b.cache = 'HIT')::BIGINT                                     AS hits,
    COUNT(*) FILTER (WHERE b.cache = 'MISS')::BIGINT                                    AS misses,
    COUNT(*) FILTER (WHERE b.cache IN ('STALE','STALE_LAST_RESORT'))::BIGINT            AS stale,
    ROUND(
      COUNT(*) FILTER (WHERE b.cache = 'HIT')::NUMERIC / NULLIF(COUNT(*), 0), 4
    )                                                                                   AS cache_hit_rate,
    ROUND(
      COUNT(*) FILTER (WHERE b.cache = 'MISS')::NUMERIC / NULLIF(COUNT(*), 0), 4
    )                                                                                   AS invalidation_rate,
    COUNT(*) FILTER (WHERE b.l1_phase = 'fresh')::BIGINT                                AS l1_fresh,
    COUNT(*) FILTER (WHERE b.l1_phase = 'stale')::BIGINT                                AS l1_stale,
    COUNT(*) FILTER (WHERE b.l1_phase = 'miss')::BIGINT                                 AS l1_miss,
    COUNT(*) FILTER (WHERE b.l1_phase = 'bypass')::BIGINT                               AS l1_bypass,
    ROUND(AVG(b.edge_ms)::NUMERIC, 1)                                                   AS edge_avg_ms,
    COALESCE(percentile_cont(0.50) WITHIN GROUP (ORDER BY b.edge_ms), 0)::INT           AS edge_p50_ms,
    COALESCE(percentile_cont(0.95) WITHIN GROUP (ORDER BY b.edge_ms), 0)::INT           AS edge_p95_ms,
    COALESCE(MAX(b.edge_ms), 0)::INT                                                    AS edge_max_ms,
    ROUND(AVG(b.total_ms)::NUMERIC, 1)                                                  AS total_avg_ms,
    COALESCE(percentile_cont(0.50) WITHIN GROUP (ORDER BY b.total_ms), 0)::INT          AS total_p50_ms,
    COALESCE(percentile_cont(0.95) WITHIN GROUP (ORDER BY b.total_ms), 0)::INT          AS total_p95_ms,
    COALESCE(MAX(b.total_ms), 0)::INT                                                   AS total_max_ms,
    ROUND(AVG(b.sql_ms)::NUMERIC, 1)                                                    AS sql_avg_ms,
    COALESCE(percentile_cont(0.95) WITHIN GROUP (ORDER BY b.sql_ms), 0)::INT            AS sql_p95_ms,
    COALESCE(w.ids, ARRAY[]::TEXT[])                                                    AS worst_correlation_ids
  FROM base b
  LEFT JOIN worst w ON w.bkt = b.bkt AND w.abbr = b.abbr
  GROUP BY b.bkt, b.abbr, w.ids
  ORDER BY b.bkt ASC, b.abbr ASC;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.bible_cache_timeseries(INTEGER, INTEGER, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bible_cache_timeseries(INTEGER, INTEGER, TEXT) TO service_role;
