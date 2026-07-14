
ALTER TABLE public.pg_stat_snapshot_config
  ADD COLUMN IF NOT EXISTS last_success_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_error_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_error_message text,
  ADD COLUMN IF NOT EXISTS consecutive_failures integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.pg_stat_snapshot_auto_run()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_cfg public.pg_stat_snapshot_config;
  v_id uuid;
  v_rows jsonb;
  v_total_calls bigint;
  v_total_ms numeric;
  v_row_count integer;
  v_window_start timestamptz;
  v_err text;
BEGIN
  SELECT * INTO v_cfg FROM public.pg_stat_snapshot_config WHERE id = 1;
  IF v_cfg IS NULL OR NOT v_cfg.enabled THEN
    RETURN;
  END IF;

  IF v_cfg.last_run_at IS NOT NULL
     AND now() - v_cfg.last_run_at < make_interval(mins => v_cfg.interval_minutes) THEN
    RETURN;
  END IF;

  BEGIN
    SELECT stats_reset INTO v_window_start
    FROM extensions.pg_stat_statements_info
    LIMIT 1;

    SELECT
      jsonb_agg(row_to_json(t) ORDER BY t.total_exec_time DESC),
      COALESCE(SUM(t.calls), 0),
      COALESCE(SUM(t.total_exec_time), 0),
      COUNT(*)
    INTO v_rows, v_total_calls, v_total_ms, v_row_count
    FROM (
      SELECT
        s.query,
        s.calls,
        s.total_exec_time,
        s.mean_exec_time,
        s.max_exec_time,
        s.min_exec_time,
        s.stddev_exec_time,
        s.rows AS rows_returned,
        s.shared_blks_hit,
        s.shared_blks_read
      FROM extensions.pg_stat_statements s
      JOIN pg_database d ON d.oid = s.dbid
      WHERE d.datname = current_database()
        AND s.query !~* '^(BEGIN|COMMIT|ROLLBACK|SET |SHOW |DEALLOCATE|DISCARD|COPY |VACUUM|ANALYZE)'
        AND s.query !~* 'pg_stat_statements|pg_catalog|information_schema'
      ORDER BY s.total_exec_time DESC
      LIMIT 200
    ) t;

    INSERT INTO public.pg_stat_snapshots
      (taken_by, label, note, window_started_at, window_seconds,
       total_calls, total_exec_ms, row_count, rows)
    VALUES
      (NULL, 'auto', 'captura automática', v_window_start,
       CASE WHEN v_window_start IS NULL THEN NULL
            ELSE EXTRACT(EPOCH FROM (now() - v_window_start)) END,
       v_total_calls, v_total_ms, v_row_count, COALESCE(v_rows, '[]'::jsonb))
    RETURNING id INTO v_id;

    UPDATE public.pg_stat_snapshot_config
      SET last_run_at = now(),
          last_success_at = now(),
          last_snapshot_id = v_id,
          last_error_at = NULL,
          last_error_message = NULL,
          consecutive_failures = 0
      WHERE id = 1;

    DELETE FROM public.pg_stat_snapshots
      WHERE taken_at < now() - make_interval(days => v_cfg.retention_days);
  EXCEPTION WHEN OTHERS THEN
    v_err := left(COALESCE(SQLERRM, 'unknown error'), 500);
    UPDATE public.pg_stat_snapshot_config
      SET last_run_at = now(),
          last_error_at = now(),
          last_error_message = v_err,
          consecutive_failures = COALESCE(consecutive_failures, 0) + 1
      WHERE id = 1;
    RAISE WARNING 'pg_stat_snapshot_auto_run failed: %', v_err;
  END;
END;
$$;

REVOKE ALL ON FUNCTION public.pg_stat_snapshot_auto_run() FROM PUBLIC, anon, authenticated;
