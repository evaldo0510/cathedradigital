CREATE OR REPLACE FUNCTION public._test_notif_admin_retry_run_all()
RETURNS TABLE(case_name text, result text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  v_id uuid;
  v_row record;
  v_att_success int;
  v_att_failed int;
  v_att_scheduled int;
  v_before timestamptz;
  v_ret record;
BEGIN
  PERFORM set_config('app.notif_test_mode', 'on', true);
  DELETE FROM public._test_http_response_store;
  DELETE FROM public._test_http_responses;
  DELETE FROM public.pg_stat_notif_attempts
    WHERE notification_id IN (SELECT id FROM public.pg_stat_pending_notifications WHERE target_url LIKE 'https://test.local/retry%');
  DELETE FROM public.pg_stat_pending_notifications WHERE target_url LIKE 'https://test.local/retry%';

  ---------- CASO R1: reset a partir de 'failed' zera attempts e limpa erro ----------
  BEGIN
    INSERT INTO public.pg_stat_pending_notifications(
      channel, target_url, payload, status, attempts, max_attempts,
      next_attempt_at, last_error, last_status_code, last_request_id
    ) VALUES (
      'webhook','https://test.local/retry1','{}'::jsonb,'failed',3,5,
      now() + interval '1 hour','boom',500, 999
    ) RETURNING id INTO v_id;

    -- resposta preparada mas NÃO processamos ainda: primeiro só validamos o reset
    v_before := clock_timestamp();

    -- Replica a mecânica pós-guard da RPC admin_retry_pending_notification.
    UPDATE public.pg_stat_pending_notifications
      SET status = 'pending',
          next_attempt_at = now(),
          attempts = CASE WHEN status = 'failed' THEN 0 ELSE attempts END,
          last_request_id = NULL,
          last_error = NULL,
          last_status_code = NULL
      WHERE id = v_id
      RETURNING * INTO v_row;

    IF v_row.status <> 'pending' THEN RAISE EXCEPTION 'status=%',v_row.status; END IF;
    IF v_row.attempts <> 0 THEN RAISE EXCEPTION 'attempts=%',v_row.attempts; END IF;
    IF v_row.last_error IS NOT NULL THEN RAISE EXCEPTION 'last_error não limpo: %', v_row.last_error; END IF;
    IF v_row.last_status_code IS NOT NULL THEN RAISE EXCEPTION 'last_status_code não limpo: %', v_row.last_status_code; END IF;
    IF v_row.last_request_id IS NOT NULL THEN RAISE EXCEPTION 'last_request_id não limpo'; END IF;
    IF v_row.next_attempt_at < v_before - interval '1 second' OR v_row.next_attempt_at > now() + interval '1 second' THEN
      RAISE EXCEPTION 'next_attempt_at fora de now(): %', v_row.next_attempt_at;
    END IF;
    case_name := 'R1_reset_failed'; result := 'PASS'; RETURN NEXT;
  EXCEPTION WHEN OTHERS THEN
    case_name := 'R1_reset_failed'; result := 'FAIL: '||SQLERRM; RETURN NEXT;
  END;

  ---------- CASO R2: reset + worker → succeeded, trilha registrada ----------
  BEGIN
    INSERT INTO public.pg_stat_pending_notifications(
      channel, target_url, payload, status, attempts, max_attempts,
      next_attempt_at, last_error, last_status_code
    ) VALUES (
      'webhook','https://test.local/retry2','{}'::jsonb,'failed',3,5,
      now() + interval '1 hour','boom',500
    ) RETURNING id INTO v_id;
    INSERT INTO public._test_http_responses(url,status_code,response_body)
      VALUES ('https://test.local/retry2',200,'ok');

    UPDATE public.pg_stat_pending_notifications
      SET status = 'pending', next_attempt_at = now(),
          attempts = 0, last_request_id = NULL,
          last_error = NULL, last_status_code = NULL
      WHERE id = v_id;

    PERFORM public.pg_stat_notif_process_queue();
    PERFORM public.pg_stat_notif_process_queue();

    SELECT * INTO v_row FROM public.pg_stat_pending_notifications WHERE id = v_id;
    IF v_row.status <> 'succeeded' THEN RAISE EXCEPTION 'status=%',v_row.status; END IF;
    IF v_row.attempts <> 1 THEN RAISE EXCEPTION 'attempts=%',v_row.attempts; END IF;
    IF v_row.last_status_code <> 200 THEN RAISE EXCEPTION 'code=%',v_row.last_status_code; END IF;

    SELECT count(*) INTO v_att_success FROM public.pg_stat_notif_attempts
      WHERE notification_id = v_id AND event = 'succeeded';
    IF v_att_success <> 1 THEN RAISE EXCEPTION 'trilha succeeded=%', v_att_success; END IF;
    case_name := 'R2_reset_then_success'; result := 'PASS'; RETURN NEXT;
  EXCEPTION WHEN OTHERS THEN
    case_name := 'R2_reset_then_success'; result := 'FAIL: '||SQLERRM; RETURN NEXT;
  END;

  ---------- CASO R3: reset + worker falha novamente → retry_scheduled com backoff ----------
  BEGIN
    INSERT INTO public.pg_stat_pending_notifications(
      channel, target_url, payload, status, attempts, max_attempts, next_attempt_at
    ) VALUES (
      'webhook','https://test.local/retry3','{}'::jsonb,'failed',3,5,
      now() + interval '1 hour'
    ) RETURNING id INTO v_id;
    INSERT INTO public._test_http_responses(url,status_code,response_body)
      VALUES ('https://test.local/retry3',500,'boom');

    UPDATE public.pg_stat_pending_notifications
      SET status = 'pending', next_attempt_at = now(),
          attempts = 0, last_request_id = NULL,
          last_error = NULL, last_status_code = NULL
      WHERE id = v_id;

    PERFORM public.pg_stat_notif_process_queue();
    PERFORM public.pg_stat_notif_process_queue();

    SELECT * INTO v_row FROM public.pg_stat_pending_notifications WHERE id = v_id;
    IF v_row.status <> 'pending' THEN RAISE EXCEPTION 'esperado pending (aguardando retry), veio %', v_row.status; END IF;
    IF v_row.attempts <> 1 THEN RAISE EXCEPTION 'attempts=%',v_row.attempts; END IF;
    IF v_row.next_attempt_at <= now() THEN
      RAISE EXCEPTION 'next_attempt_at deveria ser no futuro (backoff), veio %', v_row.next_attempt_at;
    END IF;

    SELECT count(*) INTO v_att_failed FROM public.pg_stat_notif_attempts
      WHERE notification_id = v_id AND event = 'failed';
    SELECT count(*) INTO v_att_scheduled FROM public.pg_stat_notif_attempts
      WHERE notification_id = v_id AND event = 'retry_scheduled';
    IF v_att_failed < 1 THEN RAISE EXCEPTION 'trilha failed ausente'; END IF;
    IF v_att_scheduled < 1 THEN RAISE EXCEPTION 'trilha retry_scheduled ausente'; END IF;
    case_name := 'R3_reset_then_retry'; result := 'PASS'; RETURN NEXT;
  EXCEPTION WHEN OTHERS THEN
    case_name := 'R3_reset_then_retry'; result := 'FAIL: '||SQLERRM; RETURN NEXT;
  END;

  ---------- CASO R4: reset a partir de 'in_flight' preserva attempts ----------
  BEGIN
    INSERT INTO public.pg_stat_pending_notifications(
      channel, target_url, payload, status, attempts, max_attempts, next_attempt_at
    ) VALUES (
      'webhook','https://test.local/retry4','{}'::jsonb,'in_flight',2,5,
      now() + interval '1 hour'
    ) RETURNING id INTO v_id;

    UPDATE public.pg_stat_pending_notifications
      SET status = 'pending', next_attempt_at = now(),
          attempts = CASE WHEN status = 'failed' THEN 0 ELSE attempts END,
          last_request_id = NULL, last_error = NULL, last_status_code = NULL
      WHERE id = v_id
      RETURNING * INTO v_row;

    IF v_row.status <> 'pending' THEN RAISE EXCEPTION 'status=%',v_row.status; END IF;
    IF v_row.attempts <> 2 THEN RAISE EXCEPTION 'attempts deveria preservar 2, veio %', v_row.attempts; END IF;
    case_name := 'R4_reset_in_flight'; result := 'PASS'; RETURN NEXT;
  EXCEPTION WHEN OTHERS THEN
    case_name := 'R4_reset_in_flight'; result := 'FAIL: '||SQLERRM; RETURN NEXT;
  END;

  -- Cleanup
  DELETE FROM public._test_http_response_store;
  DELETE FROM public._test_http_responses;
  DELETE FROM public.pg_stat_notif_attempts
    WHERE notification_id IN (SELECT id FROM public.pg_stat_pending_notifications WHERE target_url LIKE 'https://test.local/retry%');
  DELETE FROM public.pg_stat_pending_notifications WHERE target_url LIKE 'https://test.local/retry%';
END;
$fn$;

REVOKE ALL ON FUNCTION public._test_notif_admin_retry_run_all() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._test_notif_admin_retry_run_all() TO postgres;