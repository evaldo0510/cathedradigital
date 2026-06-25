
-- 1) Config (singleton)
CREATE TABLE IF NOT EXISTS public.bible_audit_log_retention_config (
  id BOOLEAN PRIMARY KEY DEFAULT true CHECK (id = true),
  retention_days INTEGER NOT NULL DEFAULT 90 CHECK (retention_days BETWEEN 1 AND 3650),
  auto_cleanup_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

GRANT SELECT, INSERT, UPDATE ON public.bible_audit_log_retention_config TO authenticated;
GRANT ALL ON public.bible_audit_log_retention_config TO service_role;

ALTER TABLE public.bible_audit_log_retention_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage retention config"
  ON public.bible_audit_log_retention_config
  FOR ALL TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

INSERT INTO public.bible_audit_log_retention_config (id, retention_days, auto_cleanup_enabled)
VALUES (true, 90, true)
ON CONFLICT (id) DO NOTHING;

-- 2) Histórico de execuções
CREATE TABLE IF NOT EXISTS public.bible_audit_log_cleanup_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  triggered_by TEXT NOT NULL DEFAULT 'cron', -- 'cron' | 'manual'
  triggered_user UUID,
  retention_days INTEGER NOT NULL,
  rows_deleted INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ok',         -- 'ok' | 'error' | 'skipped'
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.bible_audit_log_cleanup_runs TO authenticated;
GRANT ALL ON public.bible_audit_log_cleanup_runs TO service_role;

ALTER TABLE public.bible_audit_log_cleanup_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read cleanup runs"
  ON public.bible_audit_log_cleanup_runs
  FOR SELECT TO authenticated
  USING (public.is_current_user_admin());

CREATE POLICY "Service role writes cleanup runs"
  ON public.bible_audit_log_cleanup_runs
  FOR INSERT TO service_role
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_bible_audit_log_cleanup_runs_created_at
  ON public.bible_audit_log_cleanup_runs (created_at DESC);

-- 3) Função de limpeza
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
BEGIN
  -- Admin gate when triggered manually from the app
  IF p_triggered_by = 'manual' AND NOT public.is_current_user_admin() THEN
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

REVOKE ALL ON FUNCTION public.cleanup_bible_audit_action_logs(TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_bible_audit_action_logs(TEXT, INTEGER) TO authenticated, service_role;
