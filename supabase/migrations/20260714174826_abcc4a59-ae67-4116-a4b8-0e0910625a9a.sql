CREATE OR REPLACE FUNCTION public._test_notif_run_all()
RETURNS TABLE(case_name text, result text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  v_id uuid;
  v_row record;
  v_att int;
  v_att_before int;
  v_att_after int;
  v_delay_secs numeric;
  v_before timestamptz;
BEGIN
  PERFORM set_config('app.notif_test_mode', 'on', true);
  DELETE FROM public._test_http_response_store;
  DELETE FROM public._test_http_responses;

  -- Helper inline via savepoints; cada caso captura exceção e reporta.

  ---------- CASO 1: 200 OK ----------
  BEGIN
    INSERT INTO public.pg_stat_pending_notifications(channel, target_url, payload, status, attempts, max_attempts, next_attempt_at)
      VALUES ('webhook','https://test.local/c1','{"t":1}'::jsonb,'pending',0,5,now() - interval '1s')
      RETURNING id INTO v_id;
    INSERT INTO public._test_http_responses(url,status_code,response_body) VALUES ('https://test.local/c1',200,'ok');

    PERFORM public.pg_stat_notif_process_queue();
    PERFORM public.pg_stat_notif_process_queue();

    SELECT * INTO v_row FROM public.pg_stat_pending_notifications WHERE id = v_id;
    IF v_row.status <> 'succeeded' THEN RAISE EXCEPTION 'status=%',v_row.status; END IF;
    IF v_row.attempts <> 1 THEN RAISE EXCEPTION 'attempts=%',v_row.attempts; END IF;
    IF v_row.last_status_code <> 200 THEN RAISE EXCEPTION 'code=%',v_row.last_status_code; END IF;
    SELECT count(*) INTO v_att FROM public.pg_stat_notif_attempts WHERE notification_id=v_id AND event='succeeded';
    IF v_att <> 1 THEN RAISE EXCEPTION 'attempts row=%',v_att; END IF;
    case_name := '1_200_ok'; result := 'PASS'; RETURN NEXT;
  EXCEPTION WHEN OTHERS THEN
    case_name := '1_200_ok'; result := 'FAIL: '||SQLERRM; RETURN NEXT;
  END;

  ---------- CASO 2: 500 retryable + range de backoff ----------
  BEGIN
    INSERT INTO public.pg_stat_pending_notifications(channel, target_url, payload, status, attempts, max_attempts, next_attempt_at)
      VALUES ('webhook','https://test.local/c2','{}'::jsonb,'pending',0,5,now() - interval '1s')
      RETURNING id INTO v_id;
    INSERT INTO public._test_http_responses(url,status_code,response_body) VALUES ('https://test.local/c2',500,'boom');

    PERFORM public.pg_stat_notif_process_queue();
    PERFORM public.pg_stat_notif_process_queue();

    SELECT * INTO v_row FROM public.pg_stat_pending_notifications WHERE id = v_id;
    IF v_row.status <> 'pending' THEN RAISE EXCEPTION 'status=%',v_row.status; END IF;
    IF v_row.last_status_code <> 500 THEN RAISE EXCEPTION 'code=%',v_row.last_status_code; END IF;
    IF v_row.next_attempt_at IS NULL THEN RAISE EXCEPTION 'next_attempt_at null'; END IF;
    -- attempts=1 → base 60s, jitter [0.75,1.25] → [45,75]s
    v_delay_secs := EXTRACT(EPOCH FROM (v_row.next_attempt_at - now()));
    IF v_delay_secs NOT BETWEEN 40 AND 80 THEN RAISE EXCEPTION 'delay fora do range: %',v_delay_secs; END IF;
    IF NOT EXISTS(SELECT 1 FROM public.pg_stat_notif_attempts WHERE notification_id=v_id AND event='retry_scheduled') THEN
      RAISE EXCEPTION 'sem retry_scheduled';
    END IF;
    case_name := '2_500_retryable'; result := 'PASS (delay='||round(v_delay_secs,1)||'s)'; RETURN NEXT;
  EXCEPTION WHEN OTHERS THEN
    case_name := '2_500_retryable'; result := 'FAIL: '||SQLERRM; RETURN NEXT;
  END;

  ---------- CASO 3: 429 retryable ----------
  BEGIN
    INSERT INTO public.pg_stat_pending_notifications(channel, target_url, payload, status, attempts, max_attempts, next_attempt_at)
      VALUES ('webhook','https://test.local/c3','{}'::jsonb,'pending',0,5,now() - interval '1s')
      RETURNING id INTO v_id;
    INSERT INTO public._test_http_responses(url,status_code,response_body) VALUES ('https://test.local/c3',429,'slow');
    PERFORM public.pg_stat_notif_process_queue();
    PERFORM public.pg_stat_notif_process_queue();

    SELECT * INTO v_row FROM public.pg_stat_pending_notifications WHERE id = v_id;
    IF v_row.status <> 'pending' THEN RAISE EXCEPTION 'status=%',v_row.status; END IF;
    IF v_row.last_status_code <> 429 THEN RAISE EXCEPTION 'code=%',v_row.last_status_code; END IF;
    IF v_row.next_attempt_at <= now() THEN RAISE EXCEPTION 'next_attempt_at não futuro'; END IF;
    case_name := '3_429_ratelimit'; result := 'PASS'; RETURN NEXT;
  EXCEPTION WHEN OTHERS THEN
    case_name := '3_429_ratelimit'; result := 'FAIL: '||SQLERRM; RETURN NEXT;
  END;

  ---------- CASO 4: 400 não-retryable → failed ----------
  BEGIN
    INSERT INTO public.pg_stat_pending_notifications(channel, target_url, payload, status, attempts, max_attempts, next_attempt_at)
      VALUES ('webhook','https://test.local/c4','{}'::jsonb,'pending',0,5,now() - interval '1s')
      RETURNING id INTO v_id;
    INSERT INTO public._test_http_responses(url,status_code,response_body) VALUES ('https://test.local/c4',400,'bad');
    PERFORM public.pg_stat_notif_process_queue();
    PERFORM public.pg_stat_notif_process_queue();

    SELECT * INTO v_row FROM public.pg_stat_pending_notifications WHERE id = v_id;
    IF v_row.status <> 'failed' THEN RAISE EXCEPTION 'status=%',v_row.status; END IF;
    IF v_row.attempts <> 1 THEN RAISE EXCEPTION 'attempts=%',v_row.attempts; END IF;
    IF NOT EXISTS(SELECT 1 FROM public.pg_stat_notif_attempts WHERE notification_id=v_id AND event='failed' AND status_code=400) THEN
      RAISE EXCEPTION 'sem failed attempt';
    END IF;
    case_name := '4_400_non_retryable'; result := 'PASS'; RETURN NEXT;
  EXCEPTION WHEN OTHERS THEN
    case_name := '4_400_non_retryable'; result := 'FAIL: '||SQLERRM; RETURN NEXT;
  END;

  ---------- CASO 5: erro de rede (status NULL) ----------
  BEGIN
    INSERT INTO public.pg_stat_pending_notifications(channel, target_url, payload, status, attempts, max_attempts, next_attempt_at)
      VALUES ('webhook','https://test.local/c5','{}'::jsonb,'pending',0,5,now() - interval '1s')
      RETURNING id INTO v_id;
    INSERT INTO public._test_http_responses(url,status_code,error_msg) VALUES ('https://test.local/c5',NULL,'timeout');
    PERFORM public.pg_stat_notif_process_queue();
    PERFORM public.pg_stat_notif_process_queue();

    SELECT * INTO v_row FROM public.pg_stat_pending_notifications WHERE id = v_id;
    IF v_row.status <> 'pending' THEN RAISE EXCEPTION 'status=%',v_row.status; END IF;
    IF v_row.last_error NOT ILIKE '%timeout%' THEN RAISE EXCEPTION 'erro=%',v_row.last_error; END IF;
    IF v_row.next_attempt_at <= now() THEN RAISE EXCEPTION 'next_attempt_at não futuro'; END IF;
    case_name := '5_network_error'; result := 'PASS'; RETURN NEXT;
  EXCEPTION WHEN OTHERS THEN
    case_name := '5_network_error'; result := 'FAIL: '||SQLERRM; RETURN NEXT;
  END;

  ---------- CASO 6: limite de tentativas → failed ----------
  BEGIN
    INSERT INTO public.pg_stat_pending_notifications(channel, target_url, payload, status, attempts, max_attempts, next_attempt_at)
      VALUES ('webhook','https://test.local/c6','{}'::jsonb,'pending',1,2,now() - interval '1s')
      RETURNING id INTO v_id;
    SELECT next_attempt_at INTO v_before FROM public.pg_stat_pending_notifications WHERE id=v_id;
    INSERT INTO public._test_http_responses(url,status_code,response_body) VALUES ('https://test.local/c6',500,'boom');
    PERFORM public.pg_stat_notif_process_queue();
    PERFORM public.pg_stat_notif_process_queue();

    SELECT * INTO v_row FROM public.pg_stat_pending_notifications WHERE id = v_id;
    IF v_row.status <> 'failed' THEN RAISE EXCEPTION 'status=%',v_row.status; END IF;
    IF v_row.attempts <> 2 THEN RAISE EXCEPTION 'attempts=%',v_row.attempts; END IF;
    IF v_row.next_attempt_at <> v_before THEN RAISE EXCEPTION 'next_attempt_at mudou após limite'; END IF;
    case_name := '6_max_attempts'; result := 'PASS'; RETURN NEXT;
  EXCEPTION WHEN OTHERS THEN
    case_name := '6_max_attempts'; result := 'FAIL: '||SQLERRM; RETURN NEXT;
  END;

  ---------- CASO 7: avanço de tempo re-processa ----------
  BEGIN
    INSERT INTO public.pg_stat_pending_notifications(channel, target_url, payload, status, attempts, max_attempts, next_attempt_at)
      VALUES ('webhook','https://test.local/c7','{}'::jsonb,'pending',0,5,now() - interval '1s')
      RETURNING id INTO v_id;
    INSERT INTO public._test_http_responses(url,status_code,response_body) VALUES ('https://test.local/c7',500,'boom');
    PERFORM public.pg_stat_notif_process_queue();
    PERFORM public.pg_stat_notif_process_queue();

    SELECT * INTO v_row FROM public.pg_stat_pending_notifications WHERE id = v_id;
    IF v_row.attempts <> 1 THEN RAISE EXCEPTION 'attempts pos 1a=%',v_row.attempts; END IF;

    UPDATE public.pg_stat_pending_notifications SET next_attempt_at = now() - interval '1s' WHERE id = v_id;
    INSERT INTO public._test_http_responses(url,status_code,response_body) VALUES ('https://test.local/c7',200,'ok');
    PERFORM public.pg_stat_notif_process_queue();
    PERFORM public.pg_stat_notif_process_queue();

    SELECT * INTO v_row FROM public.pg_stat_pending_notifications WHERE id = v_id;
    IF v_row.status <> 'succeeded' THEN RAISE EXCEPTION 'status pos retry=%',v_row.status; END IF;
    IF v_row.attempts <> 2 THEN RAISE EXCEPTION 'attempts pos retry=%',v_row.attempts; END IF;
    case_name := '7_time_advance'; result := 'PASS'; RETURN NEXT;
  EXCEPTION WHEN OTHERS THEN
    case_name := '7_time_advance'; result := 'FAIL: '||SQLERRM; RETURN NEXT;
  END;

  ---------- CASO 8: idempotência do worker ----------
  BEGIN
    INSERT INTO public.pg_stat_pending_notifications(channel, target_url, payload, status, attempts, max_attempts, next_attempt_at)
      VALUES ('webhook','https://test.local/c8','{}'::jsonb,'pending',0,5,now() - interval '1s')
      RETURNING id INTO v_id;
    INSERT INTO public._test_http_responses(url,status_code,response_body) VALUES ('https://test.local/c8',200,'ok');
    PERFORM public.pg_stat_notif_process_queue();
    PERFORM public.pg_stat_notif_process_queue();

    SELECT count(*) INTO v_att_before FROM public.pg_stat_notif_attempts WHERE notification_id=v_id;
    PERFORM public.pg_stat_notif_process_queue();
    PERFORM public.pg_stat_notif_process_queue();
    SELECT count(*) INTO v_att_after FROM public.pg_stat_notif_attempts WHERE notification_id=v_id;

    IF v_att_before <> v_att_after THEN
      RAISE EXCEPTION 'attempts duplicaram (% vs %)',v_att_before,v_att_after;
    END IF;
    case_name := '8_idempotency'; result := 'PASS'; RETURN NEXT;
  EXCEPTION WHEN OTHERS THEN
    case_name := '8_idempotency'; result := 'FAIL: '||SQLERRM; RETURN NEXT;
  END;

  -- Cleanup
  DELETE FROM public._test_http_response_store;
  DELETE FROM public._test_http_responses;
  DELETE FROM public.pg_stat_notif_attempts
    WHERE notification_id IN (SELECT id FROM public.pg_stat_pending_notifications WHERE target_url LIKE 'https://test.local/%');
  DELETE FROM public.pg_stat_pending_notifications WHERE target_url LIKE 'https://test.local/%';
END;
$fn$;

REVOKE ALL ON FUNCTION public._test_notif_run_all() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._test_notif_run_all() TO postgres;