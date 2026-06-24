
-- ============================================================================
-- 1) bible_cache_metric_events — eventos crus emitidos pela edge bible-text
--    (retenção curta: 7 dias; usado só para alimentar a agregação horária)
-- ============================================================================
CREATE TABLE public.bible_cache_metric_events (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  abbrev TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  cache TEXT NOT NULL,                -- HIT | MISS | STALE | STALE_LAST_RESORT
  source TEXT,                        -- L2, BollsLife (Fallback), Cathedra (Local), ...
  status_code INTEGER NOT NULL DEFAULT 200,
  total_ms INTEGER NOT NULL,
  bolls_called BOOLEAN NOT NULL DEFAULT false,
  bolls_ok BOOLEAN,
  bolls_ms INTEGER,
  correlation_id TEXT
);
CREATE INDEX idx_bcme_created_at ON public.bible_cache_metric_events (created_at DESC);
CREATE INDEX idx_bcme_abbrev_created ON public.bible_cache_metric_events (abbrev, created_at DESC);

GRANT SELECT ON public.bible_cache_metric_events TO authenticated;
GRANT ALL ON public.bible_cache_metric_events TO service_role;

ALTER TABLE public.bible_cache_metric_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read metric events"
  ON public.bible_cache_metric_events
  FOR SELECT TO authenticated
  USING (public.is_current_user_admin());

-- ============================================================================
-- 2) bible_cache_metrics — agregados por hora x livro (lidos pelo dashboard)
-- ============================================================================
CREATE TABLE public.bible_cache_metrics (
  bucket_start TIMESTAMPTZ NOT NULL,
  abbrev TEXT NOT NULL,
  hits INTEGER NOT NULL DEFAULT 0,
  misses INTEGER NOT NULL DEFAULT 0,
  stale INTEGER NOT NULL DEFAULT 0,
  errors INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  sum_ms BIGINT NOT NULL DEFAULT 0,
  max_ms INTEGER NOT NULL DEFAULT 0,
  p95_ms INTEGER NOT NULL DEFAULT 0,
  bolls_calls INTEGER NOT NULL DEFAULT 0,
  bolls_failures INTEGER NOT NULL DEFAULT 0,
  bolls_sum_ms BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (bucket_start, abbrev)
);
CREATE INDEX idx_bcm_bucket ON public.bible_cache_metrics (bucket_start DESC);

GRANT SELECT ON public.bible_cache_metrics TO authenticated;
GRANT ALL ON public.bible_cache_metrics TO service_role;

ALTER TABLE public.bible_cache_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read metrics"
  ON public.bible_cache_metrics
  FOR SELECT TO authenticated
  USING (public.is_current_user_admin());

-- ============================================================================
-- 3) bible_cache_alerts — alertas levantados pelo agregador
-- ============================================================================
CREATE TABLE public.bible_cache_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  severity TEXT NOT NULL CHECK (severity IN ('info','warning','critical')),
  kind TEXT NOT NULL,                 -- 'bolls_fallback_rate' | 'p95_high' | 'error_spike'
  message TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  bucket_start TIMESTAMPTZ,
  abbrev TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id)
);
CREATE INDEX idx_bca_created_at ON public.bible_cache_alerts (created_at DESC);
CREATE INDEX idx_bca_open ON public.bible_cache_alerts (created_at DESC) WHERE resolved_at IS NULL;

GRANT SELECT, UPDATE ON public.bible_cache_alerts TO authenticated;
GRANT ALL ON public.bible_cache_alerts TO service_role;

ALTER TABLE public.bible_cache_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read alerts"
  ON public.bible_cache_alerts
  FOR SELECT TO authenticated
  USING (public.is_current_user_admin());

CREATE POLICY "Admins resolve alerts"
  ON public.bible_cache_alerts
  FOR UPDATE TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

-- ============================================================================
-- 4) Função de agregação (chamada pelo edge agendado a cada 10 min)
--    - rola eventos da última p_since em buckets horários
--    - calcula p95 nativo do Postgres
--    - faz cleanup de eventos > 7 dias
-- ============================================================================
CREATE OR REPLACE FUNCTION public.aggregate_bible_cache_metrics(p_since INTERVAL DEFAULT INTERVAL '20 minutes')
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
      COUNT(*)                                                            AS total,
      COALESCE(SUM(total_ms), 0)::BIGINT                                 AS sum_ms,
      COALESCE(MAX(total_ms), 0)::INT                                    AS max_ms,
      COALESCE(percentile_cont(0.95) WITHIN GROUP (ORDER BY total_ms), 0)::INT AS p95_ms,
      COUNT(*) FILTER (WHERE bolls_called)                               AS bolls_calls,
      COUNT(*) FILTER (WHERE bolls_called AND bolls_ok = false)          AS bolls_failures,
      COALESCE(SUM(bolls_ms) FILTER (WHERE bolls_called), 0)::BIGINT     AS bolls_sum_ms
    FROM public.bible_cache_metric_events
    WHERE created_at >= now() - p_since
    GROUP BY 1, 2
  )
  INSERT INTO public.bible_cache_metrics AS m (
    bucket_start, abbrev, hits, misses, stale, errors, total,
    sum_ms, max_ms, p95_ms, bolls_calls, bolls_failures, bolls_sum_ms, updated_at
  )
  SELECT bucket_start, abbrev, hits, misses, stale, errors, total,
         sum_ms, max_ms, p95_ms, bolls_calls, bolls_failures, bolls_sum_ms, now()
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
    updated_at     = now();
  GET DIAGNOSTICS v_count = ROW_COUNT;

  DELETE FROM public.bible_cache_metric_events WHERE created_at < now() - INTERVAL '7 days';

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.aggregate_bible_cache_metrics(INTERVAL) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.aggregate_bible_cache_metrics(INTERVAL) TO service_role;
