CREATE OR REPLACE FUNCTION public._test_notif_retry_snapshot_row(p_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'notification', (
      SELECT jsonb_build_object(
        'channel', n.channel,
        'target_url', n.target_url,
        'status', n.status,
        'attempts', n.attempts,
        'max_attempts', n.max_attempts,
        'has_last_error', (n.last_error IS NOT NULL),
        'last_status_code', n.last_status_code,
        'has_last_request_id', (n.last_request_id IS NOT NULL),
        'next_attempt_in_future', (n.next_attempt_at > now()),
        'succeeded_at_set', (n.succeeded_at IS NOT NULL)
      )
      FROM public.pg_stat_pending_notifications n WHERE n.id = p_id
    ),
    'attempts_count', (
      SELECT count(*) FROM public.pg_stat_notif_attempts WHERE notification_id = p_id
    ),
    'attempts_by_event', (
      SELECT coalesce(jsonb_object_agg(event, c), '{}'::jsonb)
      FROM (
        SELECT event, count(*) AS c
        FROM public.pg_stat_notif_attempts
        WHERE notification_id = p_id
        GROUP BY event
      ) t
    )
  );
$$;

REVOKE ALL ON FUNCTION public._test_notif_retry_snapshot_row(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public._test_notif_retry_snapshot_row(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public._test_notif_retry_snapshots()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_out jsonb := '[]'::jsonb;
  v_before jsonb;
  v_after_reset jsonb;
  v_after_worker jsonb;

  FUNCTION_local_scenario text;
BEGIN
  PERFORM set_config('app.notif_test_mode', 'on', true);
  DELETE FROM public._test_http_response_store;
  DELETE FROM public._test_http_responses;
  DELETE FROM public.pg_stat_notif_attempts
    WHERE notification_id IN (SELECT id FROM public.pg_stat_pending_notifications WHERE target_url LIKE 'https://test.local/snap%');
  DELETE FROM public.pg_stat_pending_notifications WHERE target_url LIKE 'https://test.local/snap%';

  -- S1: failed → reset (zera attempts, limpa erro)
  INSERT INTO public.pg_stat_pending_notifications(
    channel, target_url, payload, status, attempts, max_attempts,
    next_attempt_at, last_error, last_status_code, last_request_id
  ) VALUES (
    'webhook','https://test.local/snap1','{}'::jsonb,'failed',4,5,
    now() + interval '2 hours','boom',500, 42
  ) RETURNING id INTO v_id;
  v_before := public._test_notif_retry_snapshot_row(v_id);
  UPDATE public.pg_stat_pending_notifications
    SET status = 'pending', next_attempt_at = now(),
        attempts = CASE WHEN status = 'failed' THEN 0 ELSE attempts END,
        last_request_id = NULL, last_error = NULL, last_status_code = NULL
    WHERE id = v_id;
  v_after_reset := public._test_notif_retry_snapshot_row(v_id);
  v_out := v_out || jsonb_build_array(jsonb_build_object(
    'scenario', 'S1_failed_reset',
    'before', v_before, 'after_reset', v_after_reset
  ));

  -- S2: failed → reset → worker sucede
  INSERT INTO public.pg_stat_pending_notifications(
    channel, target_url, payload, status, attempts, max_attempts,
    next_attempt_at, last_error, last_status_code
  ) VALUES (
    'webhook','https://test.local/snap2','{}'::jsonb,'failed',3,5,
    now() + interval '2 hours','boom',500
  ) RETURNING id INTO v_id;
  INSERT INTO public._test_http_responses(url,status_code,response_body) VALUES ('https://test.local/snap2',200,'ok');
  v_before := public._test_notif_retry_snapshot_row(v_id);
  UPDATE public.pg_stat_pending_notifications
    SET status = 'pending', next_attempt_at = now(), attempts = 0,
        last_request_id = NULL, last_error = NULL, last_status_code = NULL
    WHERE id = v_id;
  v_after_reset := public._test_notif_retry_snapshot_row(v_id);
  PERFORM public.pg_stat_notif_process_queue();
  PERFORM public.pg_stat_notif_process_queue();
  v_after_worker := public._test_notif_retry_snapshot_row(v_id);
  v_out := v_out || jsonb_build_array(jsonb_build_object(
    'scenario', 'S2_failed_reset_success',
    'before', v_before, 'after_reset', v_after_reset, 'after_worker', v_after_worker
  ));

  -- S3: failed → reset → worker falha (retry agendado)
  INSERT INTO public.pg_stat_pending_notifications(
    channel, target_url, payload, status, attempts, max_attempts, next_attempt_at
  ) VALUES (
    'webhook','https://test.local/snap3','{}'::jsonb,'failed',3,5,
    now() + interval '2 hours'
  ) RETURNING id INTO v_id;
  INSERT INTO public._test_http_responses(url,status_code,response_body) VALUES ('https://test.local/snap3',500,'boom');
  v_before := public._test_notif_retry_snapshot_row(v_id);
  UPDATE public.pg_stat_pending_notifications
    SET status = 'pending', next_attempt_at = now(), attempts = 0,
        last_request_id = NULL, last_error = NULL, last_status_code = NULL
    WHERE id = v_id;
  v_after_reset := public._test_notif_retry_snapshot_row(v_id);
  PERFORM public.pg_stat_notif_process_queue();
  PERFORM public.pg_stat_notif_process_queue();
  v_after_worker := public._test_notif_retry_snapshot_row(v_id);
  v_out := v_out || jsonb_build_array(jsonb_build_object(
    'scenario', 'S3_failed_reset_retry',
    'before', v_before, 'after_reset', v_after_reset, 'after_worker', v_after_worker
  ));

  -- S4: in_flight → reset preserva attempts
  INSERT INTO public.pg_stat_pending_notifications(
    channel, target_url, payload, status, attempts, max_attempts, next_attempt_at
  ) VALUES (
    'webhook','https://test.local/snap4','{}'::jsonb,'in_flight',2,5,
    now() + interval '2 hours'
  ) RETURNING id INTO v_id;
  v_before := public._test_notif_retry_snapshot_row(v_id);
  UPDATE public.pg_stat_pending_notifications
    SET status = 'pending', next_attempt_at = now(),
        attempts = CASE WHEN status = 'failed' THEN 0 ELSE attempts END,
        last_request_id = NULL, last_error = NULL, last_status_code = NULL
    WHERE id = v_id;
  v_after_reset := public._test_notif_retry_snapshot_row(v_id);
  v_out := v_out || jsonb_build_array(jsonb_build_object(
    'scenario', 'S4_in_flight_reset_preserves_attempts',
    'before', v_before, 'after_reset', v_after_reset
  ));

  -- S5: succeeded → reset (attempts preservados; próxima execução do worker é no-op)
  INSERT INTO public.pg_stat_pending_notifications(
    channel, target_url, payload, status, attempts, max_attempts, next_attempt_at, succeeded_at
  ) VALUES (
    'webhook','https://test.local/snap5','{}'::jsonb,'succeeded',1,5,
    now(), now()
  ) RETURNING id INTO v_id;
  v_before := public._test_notif_retry_snapshot_row(v_id);
  UPDATE public.pg_stat_pending_notifications
    SET status = 'pending', next_attempt_at = now(),
        attempts = CASE WHEN status = 'failed' THEN 0 ELSE attempts END,
        last_request_id = NULL, last_error = NULL, last_status_code = NULL
    WHERE id = v_id;
  v_after_reset := public._test_notif_retry_snapshot_row(v_id);
  v_out := v_out || jsonb_build_array(jsonb_build_object(
    'scenario', 'S5_succeeded_reset',
    'before', v_before, 'after_reset', v_after_reset
  ));

  -- Cleanup
  DELETE FROM public._test_http_response_store;
  DELETE FROM public._test_http_responses;
  DELETE FROM public.pg_stat_notif_attempts
    WHERE notification_id IN (SELECT id FROM public.pg_stat_pending_notifications WHERE target_url LIKE 'https://test.local/snap%');
  DELETE FROM public.pg_stat_pending_notifications WHERE target_url LIKE 'https://test.local/snap%';

  RETURN v_out;
END;
$$;

REVOKE ALL ON FUNCTION public._test_notif_retry_snapshots() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public._test_notif_retry_snapshots() TO service_role;

COMMENT ON FUNCTION public._test_notif_retry_snapshots()
  IS 'Bateria de snapshots: captura estado completo (JSON) da notificação e da trilha antes/depois do reprocessar em 5 cenários. Uso de testes.';
