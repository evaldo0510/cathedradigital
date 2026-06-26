CREATE OR REPLACE FUNCTION public.bible_read_gate_status()
RETURNS TABLE(blocked boolean, status text, last_run_at timestamptz, run_id uuid, blocking_findings integer, reason text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_run public.bible_diagnostic_runs%ROWTYPE;
  v_blocking INTEGER := 0;
BEGIN
  SELECT * INTO v_run
    FROM public.bible_diagnostic_runs
    WHERE status IN ('ok','warning','error')
    ORDER BY started_at DESC
    LIMIT 1;

  IF v_run.id IS NULL THEN
    RETURN QUERY SELECT false, 'unknown'::text, NULL::timestamptz, NULL::uuid, 0, 'Nenhuma diagnose registrada — leitura liberada.'::text;
    RETURN;
  END IF;

  SELECT count(*)::INT INTO v_blocking
    FROM public.bible_diagnostic_findings
    WHERE run_id = v_run.id
      AND finding_type IN ('missing_book','missing_chapter','empty_chapter');

  IF v_run.status = 'error' OR v_blocking > 0 THEN
    RETURN QUERY SELECT
      true,
      v_run.status,
      COALESCE(v_run.completed_at, v_run.started_at),
      v_run.id,
      v_blocking,
      CASE
        WHEN v_run.status = 'error' THEN 'Diagnose falhou: ' || COALESCE(v_run.error, 'erro desconhecido')
        ELSE v_blocking::text || ' achado(s) bloqueante(s) (missing/empty)'
      END::text;
    RETURN;
  END IF;

  RETURN QUERY SELECT false, v_run.status, COALESCE(v_run.completed_at, v_run.started_at), v_run.id, 0, 'Cobertura validada.'::text;
END;
$$;

REVOKE ALL ON FUNCTION public.bible_read_gate_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bible_read_gate_status() TO authenticated, anon, service_role;