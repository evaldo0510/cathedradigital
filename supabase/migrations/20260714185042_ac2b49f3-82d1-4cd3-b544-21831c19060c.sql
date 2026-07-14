
CREATE OR REPLACE FUNCTION public.admin_notif_channel_gates_overview()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb := '[]'::jsonb;
  v_row record;
  v_succ int;
  v_fail int;
  v_total int;
  v_rate numeric;
  v_earliest_fail timestamptz;
  v_last_fail timestamptz;
  v_blocked boolean;
  v_eta timestamptz;
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  FOR v_row IN
    SELECT * FROM public.pg_stat_notif_channel_limits ORDER BY channel
  LOOP
    SELECT
      count(*) FILTER (WHERE a.event = 'succeeded'),
      count(*) FILTER (WHERE a.event = 'failed'),
      min(a.at) FILTER (WHERE a.event = 'failed'),
      max(a.at) FILTER (WHERE a.event = 'failed')
      INTO v_succ, v_fail, v_earliest_fail, v_last_fail
      FROM public.pg_stat_notif_attempts a
      JOIN public.pg_stat_pending_notifications n ON n.id = a.notification_id
     WHERE n.channel = v_row.channel
       AND a.at >= now() - make_interval(mins => v_row.window_minutes);

    v_succ := COALESCE(v_succ, 0);
    v_fail := COALESCE(v_fail, 0);
    v_total := v_succ + v_fail;
    v_rate := CASE WHEN v_total > 0 THEN v_fail::numeric / v_total::numeric ELSE 0 END;

    v_blocked := public.pg_stat_notif_channel_gate_blocked(v_row.channel);

    -- ETA: quando a falha mais antiga da janela expira, fail_rate cai
    v_eta := CASE
      WHEN v_blocked AND v_earliest_fail IS NOT NULL
        THEN v_earliest_fail + make_interval(mins => v_row.window_minutes)
      ELSE NULL
    END;

    v_result := v_result || jsonb_build_object(
      'channel', v_row.channel,
      'enabled', v_row.enabled,
      'blocked', v_blocked,
      'max_fail_rate', v_row.max_fail_rate,
      'window_minutes', v_row.window_minutes,
      'min_samples', v_row.min_samples,
      'max_attempts_default', v_row.max_attempts_default,
      'metrics', jsonb_build_object(
        'succeeded', v_succ,
        'failed', v_fail,
        'total', v_total,
        'fail_rate', v_rate,
        'earliest_failed_at', v_earliest_fail,
        'last_failed_at', v_last_fail
      ),
      'eta_unblock_at', v_eta,
      'reason', CASE
        WHEN NOT v_blocked THEN NULL
        WHEN NOT v_row.enabled THEN 'canal desabilitado manualmente'
        WHEN v_total < v_row.min_samples THEN NULL
        ELSE format('fail_rate %.1f%% > limite %.1f%% em %s min (%s falhas / %s total)',
                    v_rate*100, v_row.max_fail_rate*100, v_row.window_minutes, v_fail, v_total)
      END
    );
  END LOOP;

  RETURN jsonb_build_object(
    'generated_at', now(),
    'channels', v_result
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_notif_channel_gates_overview() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_notif_channel_gates_overview() TO authenticated, service_role;

COMMENT ON FUNCTION public.admin_notif_channel_gates_overview()
  IS 'Overview admin: canais + estado do gate + métricas que motivaram + ETA de liberação.';
