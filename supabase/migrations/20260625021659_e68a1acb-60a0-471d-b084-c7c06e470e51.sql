
CREATE OR REPLACE FUNCTION public.cleanup_bible_audit_action_logs(
  p_triggered_by TEXT DEFAULT 'cron',
  p_override_days INTEGER DEFAULT NULL
)
RETURNS TABLE(rows_deleted INTEGER, retention_days INTEGER, status TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cfg public.bible_audit_log_retention_config%ROWTYPE;
  v_days INTEGER;
  v_deleted INTEGER := 0;
  v_t0 TIMESTAMPTZ := clock_timestamp();
  v_status TEXT := 'ok';
  v_error TEXT;
  v_user UUID := auth.uid();
  v_role TEXT := current_setting('request.jwt.claim.role', true);
BEGIN
  -- Bloqueia chamadas anônimas e usuários comuns; permite service_role e admins
  IF v_role IS DISTINCT FROM 'service_role' AND NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT * INTO v_cfg FROM public.bible_audit_log_retention_config WHERE id = true;
  v_days := COALESCE(p_override_days, v_cfg.retention_days, 90);

  IF p_triggered_by = 'cron' AND COALESCE(v_cfg.auto_cleanup_enabled, true) = false THEN
    INSERT INTO public.bible_audit_log_cleanup_runs
      (triggered_by, triggered_user, retention_days, rows_deleted, duration_ms, status)
    VALUES ('cron', NULL, v_days, 0,
            EXTRACT(MILLISECOND FROM clock_timestamp() - v_t0)::INT, 'skipped');
    RETURN QUERY SELECT 0, v_days, 'skipped'::TEXT;
    RETURN;
  END IF;

  BEGIN
    WITH del AS (
      DELETE FROM public.bible_audit_action_logs
      WHERE created_at < now() - make_interval(days => v_days)
      RETURNING 1
    )
    SELECT count(*)::INT INTO v_deleted FROM del;
  EXCEPTION WHEN OTHERS THEN
    v_status := 'error';
    v_error := SQLERRM;
  END;

  INSERT INTO public.bible_audit_log_cleanup_runs
    (triggered_by, triggered_user, retention_days, rows_deleted, duration_ms, status, error)
  VALUES (p_triggered_by, v_user, v_days, v_deleted,
          EXTRACT(MILLISECOND FROM clock_timestamp() - v_t0)::INT, v_status, v_error);

  RETURN QUERY SELECT v_deleted, v_days, v_status;
END;
$$;
