CREATE OR REPLACE FUNCTION public.get_correlation_trail(_cid text)
RETURNS TABLE (
  source          text,
  occurred_at     timestamptz,
  actor_id        uuid,
  entity_type     text,
  entity_id       text,
  operation       text,
  status_code     integer,
  duration_ms     integer,
  details         jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    'governance_audit_log'::text                   AS source,
    g.occurred_at                                  AS occurred_at,
    g.actor_id                                     AS actor_id,
    g.entity_type                                  AS entity_type,
    g.entity_id::text                              AS entity_id,
    g.operation                                    AS operation,
    NULL::integer                                  AS status_code,
    NULL::integer                                  AS duration_ms,
    jsonb_build_object(
      'actor_role', g.actor_role,
      'before',     g.before_state,
      'after',      g.after_state,
      'diff',       g.diff,
      'request_ip', g.request_ip
    )                                              AS details
  FROM public.governance_audit_log g
  WHERE public.is_current_user_admin()
    AND g.correlation_id = _cid

  UNION ALL

  SELECT
    'bible_cache_metric_events'::text              AS source,
    b.created_at                                   AS occurred_at,
    NULL::uuid                                     AS actor_id,
    'bible_verse'::text                            AS entity_type,
    (b.abbrev || ' ' || b.chapter::text)           AS entity_id,
    coalesce(b.request_source, 'read')::text       AS operation,
    b.status_code                                  AS status_code,
    b.total_ms                                     AS duration_ms,
    jsonb_build_object(
      'cache',              b.cache,
      'cache_level',        b.cache_level,
      'source',             b.source,
      'bolls_called',       b.bolls_called,
      'bolls_ok',           b.bolls_ok,
      'bolls_ms',           b.bolls_ms,
      'sql_ms',             b.sql_ms,
      'edge_ms',            b.edge_ms,
      'render_ms',          b.render_ms,
      'cold_start',         b.cold_start,
      'l1_phase',           b.l1_phase,
      'instance_id',        b.instance_id,
      'total_wall_clock_ms', b.total_wall_clock_ms
    )                                              AS details
  FROM public.bible_cache_metric_events b
  WHERE public.is_current_user_admin()
    AND b.correlation_id = _cid

  ORDER BY 2 ASC;
$$;

COMMENT ON FUNCTION public.get_correlation_trail(text) IS
  'Sprint A / CAT-001: trilha unificada de um x-correlation-id a partir de governance_audit_log e bible_cache_metric_events. Restrito a admins (is_current_user_admin) verificado no corpo.';

REVOKE ALL ON FUNCTION public.get_correlation_trail(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_correlation_trail(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_correlation_trail(text) TO service_role;