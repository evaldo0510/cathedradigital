DROP FUNCTION IF EXISTS public.get_correlation_trail(text);
DROP FUNCTION IF EXISTS public.get_correlation_trail(text, boolean);

CREATE OR REPLACE FUNCTION public.get_correlation_trail(
  _cid text,
  _include_responses boolean DEFAULT false
)
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
    'governance_audit_log'::text,
    g.occurred_at,
    g.actor_id,
    g.entity_type,
    g.entity_id::text,
    g.operation,
    NULL::integer,
    NULL::integer,
    jsonb_build_object(
      'actor_role', g.actor_role,
      'before',     g.before_state,
      'after',      g.after_state,
      'diff',       g.diff,
      'request_ip', g.request_ip
    )
  FROM public.governance_audit_log g
  WHERE public.is_current_user_admin() AND g.correlation_id = _cid

  UNION ALL
  SELECT
    'bible_cache_metric_events'::text,
    b.created_at,
    NULL::uuid,
    'bible_verse'::text,
    (b.abbrev || ' ' || b.chapter::text),
    coalesce(b.request_source, 'read')::text,
    b.status_code,
    b.total_ms,
    jsonb_build_object(
      'cache',               b.cache,
      'cache_level',         b.cache_level,
      'source',              b.source,
      'bolls_called',        b.bolls_called,
      'bolls_ok',            b.bolls_ok,
      'bolls_ms',            b.bolls_ms,
      'sql_ms',              b.sql_ms,
      'edge_ms',             b.edge_ms,
      'render_ms',           b.render_ms,
      'cold_start',          b.cold_start,
      'l1_phase',            b.l1_phase,
      'instance_id',         b.instance_id,
      'total_wall_clock_ms', b.total_wall_clock_ms
    )
  FROM public.bible_cache_metric_events b
  WHERE public.is_current_user_admin() AND b.correlation_id = _cid

  UNION ALL
  SELECT
    'core_audit_logs'::text,
    c.timestamp,
    NULL::uuid,
    'edge_response'::text,
    coalesce(c.event_name, 'edge')::text,
    c.event_name,
    c.status_code,
    c.duration_ms,
    jsonb_build_object(
      'error_code',      c.error_code,
      'livro',           c.livro,
      'capitulo',        c.capitulo,
      'content_hash',    c.content_hash,
      'db_content_hash', c.db_content_hash,
      'payload',         c.payload,
      'response',        c.response
    )
  FROM public.core_audit_logs c
  WHERE _include_responses
    AND public.is_current_user_admin()
    AND c.correlation_id = _cid

  UNION ALL
  SELECT
    'bible_cache_alerts'::text,
    a.created_at,
    NULL::uuid,
    'bible_cache_alert'::text,
    a.id::text,
    coalesce(a.kind, 'alert')::text,
    NULL::integer,
    NULL::integer,
    jsonb_build_object(
      'severity',        a.severity,
      'kind',            a.kind,
      'message',         a.message,
      'details',         a.details,
      'abbrev',          a.abbrev,
      'metric_kind',     a.metric_kind,
      'observed_p95_ms', a.observed_p95_ms,
      'baseline_p95_ms', a.baseline_p95_ms,
      'l1_phase',        a.l1_phase,
      'resolved_at',     a.resolved_at
    )
  FROM public.bible_cache_alerts a
  WHERE _include_responses
    AND public.is_current_user_admin()
    AND a.correlation_id = _cid

  UNION ALL
  SELECT
    'bible_integrity_reports'::text,
    r.created_at,
    NULL::uuid,
    'bible_integrity_report'::text,
    r.id::text,
    'integrity_check'::text,
    NULL::integer,
    NULL::integer,
    to_jsonb(r) - 'created_at' - 'id'
  FROM public.bible_integrity_reports r
  WHERE _include_responses
    AND public.is_current_user_admin()
    AND r.correlation_id = _cid

  ORDER BY 2 ASC;
$$;

COMMENT ON FUNCTION public.get_correlation_trail(text, boolean) IS
  'Sprint A / CAT-001: trilha unificada de um x-correlation-id. Modo estendido (_include_responses=true) agrega eventos de resposta/erro padronizados (core_audit_logs, bible_cache_alerts, bible_integrity_reports). Admin-only.';

REVOKE ALL ON FUNCTION public.get_correlation_trail(text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_correlation_trail(text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_correlation_trail(text, boolean) TO service_role;