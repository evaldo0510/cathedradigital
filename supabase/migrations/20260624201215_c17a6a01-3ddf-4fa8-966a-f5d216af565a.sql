
-- ============================================================================
-- 1) Trilha de auditoria das ações do painel /bible-cache
-- ============================================================================
CREATE TABLE public.bible_cache_admin_audit (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor_id UUID,
  actor_email TEXT,
  action TEXT NOT NULL,           -- purge | warm | bulk_range | resolve_alert | run_aggregator
  target TEXT,                    -- cache_key, prefix, alert_id, etc.
  abbrev TEXT,
  chapter_from INTEGER,
  chapter_to INTEGER,
  count INTEGER,                  -- nº de itens afetados / pedidos
  succeeded INTEGER,
  failed INTEGER,
  details JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX idx_bcaa_created_at ON public.bible_cache_admin_audit (created_at DESC);
CREATE INDEX idx_bcaa_action_created ON public.bible_cache_admin_audit (action, created_at DESC);

GRANT SELECT ON public.bible_cache_admin_audit TO authenticated;
GRANT ALL ON public.bible_cache_admin_audit TO service_role;

ALTER TABLE public.bible_cache_admin_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read audit log"
  ON public.bible_cache_admin_audit
  FOR SELECT TO authenticated
  USING (public.is_current_user_admin());

-- ============================================================================
-- 2) Drilldown por capítulo (agrega eventos crus em janela móvel)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.bible_chapter_drilldown(p_abbrev TEXT, p_hours INTEGER DEFAULT 24)
RETURNS TABLE (
  chapter INTEGER,
  total BIGINT,
  hits BIGINT,
  misses BIGINT,
  stale BIGINT,
  avg_ms NUMERIC,
  p95_ms INTEGER,
  max_ms INTEGER,
  bolls_calls BIGINT,
  bolls_failures BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    e.chapter,
    COUNT(*)::BIGINT                                                            AS total,
    COUNT(*) FILTER (WHERE e.cache = 'HIT')::BIGINT                             AS hits,
    COUNT(*) FILTER (WHERE e.cache = 'MISS')::BIGINT                            AS misses,
    COUNT(*) FILTER (WHERE e.cache IN ('STALE','STALE_LAST_RESORT'))::BIGINT    AS stale,
    ROUND(AVG(e.total_ms)::NUMERIC, 0)                                          AS avg_ms,
    COALESCE(percentile_cont(0.95) WITHIN GROUP (ORDER BY e.total_ms), 0)::INT  AS p95_ms,
    COALESCE(MAX(e.total_ms), 0)::INT                                           AS max_ms,
    COUNT(*) FILTER (WHERE e.bolls_called)::BIGINT                              AS bolls_calls,
    COUNT(*) FILTER (WHERE e.bolls_called AND e.bolls_ok = false)::BIGINT       AS bolls_failures
  FROM public.bible_cache_metric_events e
  WHERE e.abbrev = p_abbrev
    AND e.created_at >= now() - make_interval(hours => GREATEST(p_hours, 1))
  GROUP BY e.chapter
  ORDER BY e.chapter;
$$;

REVOKE EXECUTE ON FUNCTION public.bible_chapter_drilldown(TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bible_chapter_drilldown(TEXT, INTEGER) TO service_role;

-- ============================================================================
-- 3) Realtime para alertas (UI recebe alertas novos sem polling)
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.bible_cache_alerts;
