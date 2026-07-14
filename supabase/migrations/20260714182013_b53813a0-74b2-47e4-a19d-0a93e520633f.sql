CREATE OR REPLACE FUNCTION public.admin_notif_failures_report(
  p_from timestamptz DEFAULT (now() - interval '7 days'),
  p_to   timestamptz DEFAULT now(),
  p_channel text DEFAULT NULL,
  p_status  text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows jsonb;
  v_totals jsonb;
  v_fail_rate jsonb;
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501';
  END IF;

  IF p_from IS NULL OR p_to IS NULL OR p_from > p_to THEN
    RAISE EXCEPTION 'invalid_date_range' USING ERRCODE = '22023';
  END IF;

  IF p_channel IS NOT NULL AND p_channel NOT IN ('webhook','slack') THEN
    RAISE EXCEPTION 'invalid_channel' USING ERRCODE = '22023';
  END IF;

  IF p_status IS NOT NULL AND p_status NOT IN ('pending','in_flight','succeeded','failed') THEN
    RAISE EXCEPTION 'invalid_status' USING ERRCODE = '22023';
  END IF;

  WITH scoped AS (
    SELECT *
    FROM public.pg_stat_pending_notifications
    WHERE created_at >= p_from
      AND created_at <  p_to
      AND (p_channel IS NULL OR channel = p_channel)
      AND (p_status  IS NULL OR status  = p_status)
  ),
  agg AS (
    SELECT
      channel,
      status,
      count(*)::bigint            AS count,
      round(avg(attempts)::numeric, 2) AS avg_attempts,
      max(attempts)::int          AS max_attempts_seen,
      min(created_at)             AS first_seen,
      max(coalesce(last_attempt_at, created_at)) AS last_seen
    FROM scoped
    GROUP BY channel, status
  ),
  fr AS (
    SELECT
      channel,
      sum(CASE WHEN status = 'failed'    THEN count ELSE 0 END)::bigint AS failed,
      sum(CASE WHEN status = 'succeeded' THEN count ELSE 0 END)::bigint AS succeeded,
      sum(count)::bigint AS total
    FROM agg
    GROUP BY channel
  )
  SELECT
    coalesce(jsonb_agg(
      jsonb_build_object(
        'channel', channel,
        'status', status,
        'count', count,
        'avg_attempts', avg_attempts,
        'max_attempts_seen', max_attempts_seen,
        'first_seen', first_seen,
        'last_seen', last_seen
      )
      ORDER BY channel, status
    ), '[]'::jsonb),
    jsonb_build_object(
      'total',     coalesce(sum(count),0),
      'failed',    coalesce(sum(CASE WHEN status='failed'    THEN count END),0),
      'succeeded', coalesce(sum(CASE WHEN status='succeeded' THEN count END),0),
      'pending',   coalesce(sum(CASE WHEN status='pending'   THEN count END),0),
      'in_flight', coalesce(sum(CASE WHEN status='in_flight' THEN count END),0)
    )
  INTO v_rows, v_totals
  FROM agg;

  SELECT coalesce(jsonb_agg(
    jsonb_build_object(
      'channel', channel,
      'failed', failed,
      'succeeded', succeeded,
      'total', total,
      'fail_rate', CASE WHEN (failed + succeeded) > 0
                        THEN round((failed::numeric / (failed + succeeded)) * 100, 2)
                        ELSE NULL END
    )
    ORDER BY channel
  ), '[]'::jsonb)
  INTO v_fail_rate
  FROM fr;

  RETURN jsonb_build_object(
    'generated_at', now(),
    'filters', jsonb_build_object(
      'from', p_from,
      'to',   p_to,
      'channel', p_channel,
      'status',  p_status
    ),
    'totals', v_totals,
    'fail_rate_by_channel', v_fail_rate,
    'rows', v_rows
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_notif_failures_report(timestamptz, timestamptz, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_notif_failures_report(timestamptz, timestamptz, text, text) TO authenticated, service_role;

COMMENT ON FUNCTION public.admin_notif_failures_report(timestamptz, timestamptz, text, text)
  IS 'Relatório agregado da fila pg_stat_pending_notifications por canal/status, com filtros de período. Admin-only.';
