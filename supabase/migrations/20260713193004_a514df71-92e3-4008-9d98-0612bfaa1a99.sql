-- ============================================================
-- Sprint 1.13 — M4/4
-- Rotina de arquivamento + hardening das funções internas
-- ============================================================

-- ------------------------------------------------------------
-- 1) Função de arquivamento
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.fn_archive_governance_audit(
  p_triggered_by   TEXT DEFAULT 'cron',
  p_override_days  INTEGER DEFAULT NULL
)
RETURNS TABLE(rows_archived INTEGER, retention_days INTEGER, status TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_cfg      public.governance_audit_retention_config%ROWTYPE;
  v_days     INTEGER;
  v_archived INTEGER := 0;
  v_t0       TIMESTAMPTZ := clock_timestamp();
  v_status   TEXT := 'ok';
  v_error    TEXT;
  v_user     UUID := auth.uid();
  v_role     TEXT := current_setting('request.jwt.claim.role', true);
BEGIN
  -- Access control: apenas service_role ou admin
  IF v_role IS DISTINCT FROM 'service_role' AND NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  IF p_triggered_by NOT IN ('cron','admin') THEN
    RAISE EXCEPTION 'invalid triggered_by: %', p_triggered_by;
  END IF;

  SELECT * INTO v_cfg
    FROM public.governance_audit_retention_config
    WHERE id = true;

  v_days := COALESCE(p_override_days, v_cfg.retention_days, 365);

  -- Cron respeita flag auto_archive_enabled; admin sempre executa
  IF p_triggered_by = 'cron' AND COALESCE(v_cfg.auto_archive_enabled, true) = false THEN
    INSERT INTO public.governance_audit_log_cleanup_runs
      (triggered_by, triggered_user, retention_days, rows_archived, duration_ms, status)
    VALUES ('cron', NULL, v_days, 0,
            EXTRACT(MILLISECOND FROM clock_timestamp() - v_t0)::INT, 'skipped');
    RETURN QUERY SELECT 0, v_days, 'skipped'::TEXT;
    RETURN;
  END IF;

  BEGIN
    WITH moved AS (
      DELETE FROM public.governance_audit_log
      WHERE occurred_at < now() - make_interval(days => v_days)
      RETURNING id, occurred_at, actor_id, actor_role, entity_type, entity_id,
                operation, before_state, after_state, diff, correlation_id,
                request_ip, created_at
    )
    INSERT INTO public.governance_audit_log_archive
      (id, occurred_at, actor_id, actor_role, entity_type, entity_id,
       operation, before_state, after_state, diff, correlation_id,
       request_ip, created_at)
    SELECT id, occurred_at, actor_id, actor_role, entity_type, entity_id,
           operation, before_state, after_state, diff, correlation_id,
           request_ip, created_at
      FROM moved;

    GET DIAGNOSTICS v_archived = ROW_COUNT;
  EXCEPTION WHEN OTHERS THEN
    v_status := 'error';
    v_error  := SQLERRM;
  END;

  INSERT INTO public.governance_audit_log_cleanup_runs
    (triggered_by, triggered_user, retention_days, rows_archived, duration_ms, status, error)
  VALUES (p_triggered_by, v_user, v_days, v_archived,
          EXTRACT(MILLISECOND FROM clock_timestamp() - v_t0)::INT, v_status, v_error);

  RETURN QUERY SELECT v_archived, v_days, v_status;
END;
$$;

-- ------------------------------------------------------------
-- 2) Hardening: revoga EXECUTE de anon e authenticated
--    (REVOKE FROM PUBLIC não remove grants implícitos a roles)
-- ------------------------------------------------------------

REVOKE ALL ON FUNCTION public.jsonb_shallow_diff(JSONB, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.jsonb_shallow_diff(JSONB, JSONB) TO service_role;

REVOKE ALL ON FUNCTION public.capture_governance_audit(TEXT, UUID, TEXT, JSONB, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.capture_governance_audit(TEXT, UUID, TEXT, JSONB, JSONB) TO service_role;

REVOKE ALL ON FUNCTION public.tr_audit_nexus_relations_fn() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tr_audit_translation_pcl_lifecycle_fn() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.fn_archive_governance_audit(TEXT, INTEGER) FROM PUBLIC, anon;
-- Mantém authenticated para permitir admins consumirem via RLS+is_current_user_admin()
GRANT EXECUTE ON FUNCTION public.fn_archive_governance_audit(TEXT, INTEGER) TO authenticated, service_role;