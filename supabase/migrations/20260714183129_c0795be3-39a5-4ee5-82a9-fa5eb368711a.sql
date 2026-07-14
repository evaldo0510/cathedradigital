CREATE OR REPLACE FUNCTION public._test_notif_concurrency_seed(
  p_count int DEFAULT 20,
  p_fail_ratio numeric DEFAULT 0.3
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  i int;
  v_url text;
  v_status int;
  v_id uuid;
BEGIN
  PERFORM set_config('app.notif_test_mode', 'on', true);

  DELETE FROM public.pg_stat_notif_attempts
    WHERE notification_id IN (
      SELECT id FROM public.pg_stat_pending_notifications WHERE target_url LIKE 'https://test.local/conc%'
    );
  DELETE FROM public.pg_stat_pending_notifications WHERE target_url LIKE 'https://test.local/conc%';
  DELETE FROM public._test_http_responses WHERE url LIKE 'https://test.local/conc%';
  DELETE FROM public._test_http_response_store WHERE url LIKE 'https://test.local/conc%';

  FOR i IN 1..p_count LOOP
    v_url := 'https://test.local/conc-' || i::text;
    v_status := CASE WHEN (i::numeric / p_count) < p_fail_ratio THEN 500 ELSE 200 END;

    INSERT INTO public.pg_stat_pending_notifications(
      channel, target_url, payload, status, attempts, max_attempts, next_attempt_at
    ) VALUES (
      'webhook', v_url, jsonb_build_object('n', i), 'pending', 0, 3, now()
    ) RETURNING id INTO v_id;

    INSERT INTO public._test_http_responses(url, status_code, response_body)
      VALUES (v_url, v_status, CASE WHEN v_status = 200 THEN 'ok' ELSE 'boom' END);
  END LOOP;

  RETURN p_count;
END;
$$;

REVOKE ALL ON FUNCTION public._test_notif_concurrency_seed(int, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public._test_notif_concurrency_seed(int, numeric) TO service_role;

CREATE OR REPLACE FUNCTION public._test_notif_concurrency_verify()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total int;
  v_by_status jsonb;
  v_dup_dispatched int;
  v_dup_succeeded int;
  v_attempts_overflow int;
  v_missing_succeeded_at int;
  v_stuck_in_flight int;
  v_terminal_double int;
  v_next_attempt_bad int;
  v_invariants jsonb;
BEGIN
  SELECT count(*) INTO v_total
    FROM public.pg_stat_pending_notifications
   WHERE target_url LIKE 'https://test.local/conc%';

  SELECT coalesce(jsonb_object_agg(status, c), '{}'::jsonb) INTO v_by_status
    FROM (
      SELECT status, count(*) AS c
        FROM public.pg_stat_pending_notifications
       WHERE target_url LIKE 'https://test.local/conc%'
       GROUP BY status
    ) t;

  -- I1: nenhum (notification_id, attempt_no) com mais de um 'dispatched'
  SELECT count(*) INTO v_dup_dispatched
    FROM (
      SELECT a.notification_id, a.attempt_no, count(*) AS c
        FROM public.pg_stat_notif_attempts a
        JOIN public.pg_stat_pending_notifications n ON n.id = a.notification_id
       WHERE n.target_url LIKE 'https://test.local/conc%'
         AND a.event = 'dispatched'
       GROUP BY a.notification_id, a.attempt_no
      HAVING count(*) > 1
    ) x;

  -- I2: nenhuma notificação com mais de um evento 'succeeded'
  SELECT count(*) INTO v_dup_succeeded
    FROM (
      SELECT a.notification_id, count(*) AS c
        FROM public.pg_stat_notif_attempts a
        JOIN public.pg_stat_pending_notifications n ON n.id = a.notification_id
       WHERE n.target_url LIKE 'https://test.local/conc%'
         AND a.event = 'succeeded'
       GROUP BY a.notification_id
      HAVING count(*) > 1
    ) x;

  -- I3: attempts nunca ultrapassa max_attempts
  SELECT count(*) INTO v_attempts_overflow
    FROM public.pg_stat_pending_notifications
   WHERE target_url LIKE 'https://test.local/conc%'
     AND attempts > max_attempts;

  -- I4: toda notificação succeeded tem succeeded_at
  SELECT count(*) INTO v_missing_succeeded_at
    FROM public.pg_stat_pending_notifications
   WHERE target_url LIKE 'https://test.local/conc%'
     AND status = 'succeeded'
     AND succeeded_at IS NULL;

  -- I5: nenhuma notificação com terminal duplicado (succeeded + failed simultâneos)
  SELECT count(*) INTO v_terminal_double
    FROM (
      SELECT a.notification_id
        FROM public.pg_stat_notif_attempts a
        JOIN public.pg_stat_pending_notifications n ON n.id = a.notification_id
       WHERE n.target_url LIKE 'https://test.local/conc%'
         AND a.event IN ('succeeded','failed')
       GROUP BY a.notification_id
      HAVING count(DISTINCT a.event) > 1
    ) x;

  -- I6: pending com next_attempt_at nulo (inconsistente)
  SELECT count(*) INTO v_next_attempt_bad
    FROM public.pg_stat_pending_notifications
   WHERE target_url LIKE 'https://test.local/conc%'
     AND status = 'pending'
     AND next_attempt_at IS NULL;

  -- I7: in_flight residual (calculado externamente pelo runner, aqui só reporta)
  SELECT count(*) INTO v_stuck_in_flight
    FROM public.pg_stat_pending_notifications
   WHERE target_url LIKE 'https://test.local/conc%'
     AND status = 'in_flight';

  v_invariants := jsonb_build_object(
    'I1_no_duplicate_dispatched', (v_dup_dispatched = 0),
    'I2_no_duplicate_succeeded',  (v_dup_succeeded  = 0),
    'I3_attempts_within_max',     (v_attempts_overflow = 0),
    'I4_succeeded_has_timestamp', (v_missing_succeeded_at = 0),
    'I5_no_terminal_double',      (v_terminal_double = 0),
    'I6_pending_has_next_attempt',(v_next_attempt_bad = 0)
  );

  RETURN jsonb_build_object(
    'total', v_total,
    'by_status', v_by_status,
    'stuck_in_flight', v_stuck_in_flight,
    'violations', jsonb_build_object(
      'duplicate_dispatched', v_dup_dispatched,
      'duplicate_succeeded',  v_dup_succeeded,
      'attempts_overflow',    v_attempts_overflow,
      'missing_succeeded_at', v_missing_succeeded_at,
      'terminal_double',      v_terminal_double,
      'pending_null_next',    v_next_attempt_bad
    ),
    'invariants', v_invariants,
    'all_passed', NOT (
      v_dup_dispatched > 0 OR v_dup_succeeded > 0 OR v_attempts_overflow > 0 OR
      v_missing_succeeded_at > 0 OR v_terminal_double > 0 OR v_next_attempt_bad > 0
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public._test_notif_concurrency_verify() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public._test_notif_concurrency_verify() TO service_role;

CREATE OR REPLACE FUNCTION public._test_notif_concurrency_cleanup()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.pg_stat_notif_attempts
    WHERE notification_id IN (
      SELECT id FROM public.pg_stat_pending_notifications WHERE target_url LIKE 'https://test.local/conc%'
    );
  DELETE FROM public.pg_stat_pending_notifications WHERE target_url LIKE 'https://test.local/conc%';
  DELETE FROM public._test_http_responses WHERE url LIKE 'https://test.local/conc%';
  DELETE FROM public._test_http_response_store WHERE url LIKE 'https://test.local/conc%';
END;
$$;

REVOKE ALL ON FUNCTION public._test_notif_concurrency_cleanup() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public._test_notif_concurrency_cleanup() TO service_role;

COMMENT ON FUNCTION public._test_notif_concurrency_seed(int, numeric)
  IS 'Semeia N notificações pendentes de teste com respostas HTTP mockadas (sucesso/falha intercalados).';
COMMENT ON FUNCTION public._test_notif_concurrency_verify()
  IS 'Valida invariantes de idempotência do worker após execuções concorrentes. Retorna JSON com violações.';
