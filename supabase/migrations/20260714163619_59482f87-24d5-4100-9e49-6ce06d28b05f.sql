
-- Config table for auto snapshot schedule
CREATE TABLE IF NOT EXISTS public.pg_stat_snapshot_config (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  enabled boolean NOT NULL DEFAULT false,
  interval_minutes integer NOT NULL DEFAULT 60 CHECK (interval_minutes >= 5 AND interval_minutes <= 1440),
  retention_days integer NOT NULL DEFAULT 30 CHECK (retention_days >= 1 AND retention_days <= 365),
  last_run_at timestamptz,
  last_snapshot_id uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

GRANT SELECT, INSERT, UPDATE ON public.pg_stat_snapshot_config TO authenticated;
GRANT ALL ON public.pg_stat_snapshot_config TO service_role;

ALTER TABLE public.pg_stat_snapshot_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin manage snapshot config" ON public.pg_stat_snapshot_config;
CREATE POLICY "admin manage snapshot config"
  ON public.pg_stat_snapshot_config FOR ALL
  TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

INSERT INTO public.pg_stat_snapshot_config (id) VALUES (1)
  ON CONFLICT (id) DO NOTHING;

-- Read config RPC
CREATE OR REPLACE FUNCTION public.admin_get_pg_stat_snapshot_config()
RETURNS public.pg_stat_snapshot_config
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.pg_stat_snapshot_config;
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  SELECT * INTO v_row FROM public.pg_stat_snapshot_config WHERE id = 1;
  RETURN v_row;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_get_pg_stat_snapshot_config() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_pg_stat_snapshot_config() TO authenticated;

-- Update config RPC
CREATE OR REPLACE FUNCTION public.admin_update_pg_stat_snapshot_config(
  p_enabled boolean,
  p_interval_minutes integer,
  p_retention_days integer
)
RETURNS public.pg_stat_snapshot_config
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.pg_stat_snapshot_config;
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  IF p_interval_minutes < 5 OR p_interval_minutes > 1440 THEN
    RAISE EXCEPTION 'interval_minutes must be between 5 and 1440';
  END IF;
  IF p_retention_days < 1 OR p_retention_days > 365 THEN
    RAISE EXCEPTION 'retention_days must be between 1 and 365';
  END IF;

  UPDATE public.pg_stat_snapshot_config
    SET enabled = p_enabled,
        interval_minutes = p_interval_minutes,
        retention_days = p_retention_days,
        updated_at = now(),
        updated_by = auth.uid()
    WHERE id = 1
    RETURNING * INTO v_row;
  RETURN v_row;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_update_pg_stat_snapshot_config(boolean, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_pg_stat_snapshot_config(boolean, integer, integer) TO authenticated;

-- Auto-run dispatcher: checks interval, captures snapshot, prunes old
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
BEGIN
  SELECT * INTO v_cfg FROM public.pg_stat_snapshot_config WHERE id = 1;
  IF v_cfg IS NULL OR NOT v_cfg.enabled THEN
    RETURN;
  END IF;

  IF v_cfg.last_run_at IS NOT NULL
     AND now() - v_cfg.last_run_at < make_interval(mins => v_cfg.interval_minutes) THEN
    RETURN;
  END IF;

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
    SET last_run_at = now(), last_snapshot_id = v_id
    WHERE id = 1;

  -- retention prune
  DELETE FROM public.pg_stat_snapshots
    WHERE taken_at < now() - make_interval(days => v_cfg.retention_days);
END;
$$;

REVOKE ALL ON FUNCTION public.pg_stat_snapshot_auto_run() FROM PUBLIC, anon, authenticated;

-- Schedule pg_cron job (every 5 minutes) — idempotent
DO $do$
DECLARE
  v_jobid bigint;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    SELECT jobid INTO v_jobid FROM cron.job WHERE jobname = 'pg-stat-snapshot-auto';
    IF v_jobid IS NOT NULL THEN
      PERFORM cron.unschedule(v_jobid);
    END IF;
    PERFORM cron.schedule('pg-stat-snapshot-auto', '*/5 * * * *',
      $sql$SELECT public.pg_stat_snapshot_auto_run();$sql$);
  END IF;
END
$do$;
