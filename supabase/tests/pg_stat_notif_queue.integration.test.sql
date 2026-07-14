-- Testes de integração da fila pg_stat_pending_notifications
-- Roda dentro de transação com ROLLBACK final. Requer service_role.
-- Uso: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/pg_stat_notif_queue.integration.test.sql

BEGIN;
SET LOCAL app.notif_test_mode = 'on';
SELECT public._test_notif_reset();

-- ============================================================
-- Helper local: cria notif pending com URL única por teste
-- ============================================================
CREATE OR REPLACE FUNCTION pg_temp.mk_notif(p_url text, p_max int DEFAULT 5)
RETURNS uuid LANGUAGE sql AS $$
  INSERT INTO public.pg_stat_pending_notifications
    (channel, target_url, payload, status, attempts, max_attempts, next_attempt_at)
  VALUES
    ('webhook', p_url, '{"t":1}'::jsonb, 'pending', 0, p_max, now() - interval '1s')
  RETURNING id;
$$;

CREATE OR REPLACE FUNCTION pg_temp.assert(cond boolean, msg text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF NOT cond THEN
    RAISE EXCEPTION 'ASSERT FAIL: %', msg;
  END IF;
END; $$;

-- ============================================================
-- CASO 1: 200 OK → succeeded, attempts=1, attempt gravado
-- ============================================================
DO $$
DECLARE v_id uuid; v_row record; v_att int;
BEGIN
  v_id := pg_temp.mk_notif('https://test.local/case1');
  PERFORM public._test_enqueue_http('https://test.local/case1', 200, 'ok', NULL);

  PERFORM public.pg_stat_notif_process_queue();  -- dispatch → in_flight
  PERFORM public.pg_stat_notif_process_queue();  -- consome resposta → succeeded

  SELECT * INTO v_row FROM public.pg_stat_pending_notifications WHERE id = v_id;
  PERFORM pg_temp.assert(v_row.status = 'succeeded', '1: status succeeded, got ' || v_row.status);
  PERFORM pg_temp.assert(v_row.attempts = 1, '1: attempts=1');
  PERFORM pg_temp.assert(v_row.last_status_code = 200, '1: last_status_code=200');

  SELECT count(*) INTO v_att FROM public.pg_stat_notif_attempts
    WHERE notification_id = v_id AND event = 'succeeded';
  PERFORM pg_temp.assert(v_att = 1, '1: attempt succeeded gravado');
  RAISE NOTICE 'PASS 1: 200 OK';
END $$;

-- ============================================================
-- CASO 2: 500 retryable → pending, next_attempt_at no range esperado
-- ============================================================
DO $$
DECLARE v_id uuid; v_row record; v_delay_secs numeric;
        v_min_secs numeric; v_max_secs numeric;
BEGIN
  v_id := pg_temp.mk_notif('https://test.local/case2');
  PERFORM public._test_enqueue_http('https://test.local/case2', 500, 'boom', NULL);

  PERFORM public.pg_stat_notif_process_queue();
  PERFORM public.pg_stat_notif_process_queue();

  SELECT * INTO v_row FROM public.pg_stat_pending_notifications WHERE id = v_id;
  PERFORM pg_temp.assert(v_row.status = 'pending', '2: pending, got ' || v_row.status);
  PERFORM pg_temp.assert(v_row.attempts = 1, '2: attempts=1');
  PERFORM pg_temp.assert(v_row.last_status_code = 500, '2: last_status_code=500');
  PERFORM pg_temp.assert(v_row.next_attempt_at IS NOT NULL, '2: next_attempt_at set');

  -- backoff base p/ attempts=1 = 30*2^1 = 60s, jitter [0.75, 1.25] → [45, 75]s
  v_delay_secs := EXTRACT(EPOCH FROM (v_row.next_attempt_at - now()));
  PERFORM pg_temp.assert(v_delay_secs BETWEEN 40 AND 80,
    '2: delay fora do range: ' || v_delay_secs);

  PERFORM pg_temp.assert(EXISTS (
    SELECT 1 FROM public.pg_stat_notif_attempts
    WHERE notification_id = v_id AND event = 'retry_scheduled'
  ), '2: retry_scheduled gravado');
  RAISE NOTICE 'PASS 2: 500 retryable';
END $$;

-- ============================================================
-- CASO 3: 429 rate limit → retryable
-- ============================================================
DO $$
DECLARE v_id uuid; v_row record;
BEGIN
  v_id := pg_temp.mk_notif('https://test.local/case3');
  PERFORM public._test_enqueue_http('https://test.local/case3', 429, 'slow down', NULL);
  PERFORM public.pg_stat_notif_process_queue();
  PERFORM public.pg_stat_notif_process_queue();

  SELECT * INTO v_row FROM public.pg_stat_pending_notifications WHERE id = v_id;
  PERFORM pg_temp.assert(v_row.status = 'pending', '3: 429 deve ser retryable, got ' || v_row.status);
  PERFORM pg_temp.assert(v_row.last_status_code = 429, '3: 429');
  PERFORM pg_temp.assert(v_row.next_attempt_at > now(), '3: next_attempt_at futuro');
  RAISE NOTICE 'PASS 3: 429 rate limit';
END $$;

-- ============================================================
-- CASO 4: 400 não-retryable → failed imediato
-- ============================================================
DO $$
DECLARE v_id uuid; v_row record;
BEGIN
  v_id := pg_temp.mk_notif('https://test.local/case4');
  PERFORM public._test_enqueue_http('https://test.local/case4', 400, 'bad', NULL);
  PERFORM public.pg_stat_notif_process_queue();
  PERFORM public.pg_stat_notif_process_queue();

  SELECT * INTO v_row FROM public.pg_stat_pending_notifications WHERE id = v_id;
  PERFORM pg_temp.assert(v_row.status = 'failed', '4: failed, got ' || v_row.status);
  PERFORM pg_temp.assert(v_row.attempts = 1, '4: 1 tentativa apenas');

  PERFORM pg_temp.assert(EXISTS (
    SELECT 1 FROM public.pg_stat_notif_attempts
    WHERE notification_id = v_id AND event = 'failed' AND status_code = 400
  ), '4: attempt failed gravado');
  RAISE NOTICE 'PASS 4: 400 não-retryable';
END $$;

-- ============================================================
-- CASO 5: erro de rede (status NULL, error='timeout') → retryable
-- ============================================================
DO $$
DECLARE v_id uuid; v_row record;
BEGIN
  v_id := pg_temp.mk_notif('https://test.local/case5');
  PERFORM public._test_enqueue_http('https://test.local/case5', NULL, NULL, 'timeout');
  PERFORM public.pg_stat_notif_process_queue();
  PERFORM public.pg_stat_notif_process_queue();

  SELECT * INTO v_row FROM public.pg_stat_pending_notifications WHERE id = v_id;
  PERFORM pg_temp.assert(v_row.status = 'pending', '5: erro rede retryable, got ' || v_row.status);
  PERFORM pg_temp.assert(v_row.last_error ILIKE '%timeout%', '5: erro preservado');
  PERFORM pg_temp.assert(v_row.next_attempt_at > now(), '5: next_attempt_at futuro');
  RAISE NOTICE 'PASS 5: erro de rede';
END $$;

-- ============================================================
-- CASO 6: limite de tentativas → failed sem next_attempt_at novo
-- ============================================================
DO $$
DECLARE v_id uuid; v_row record; v_before timestamptz;
BEGIN
  v_id := pg_temp.mk_notif('https://test.local/case6', 2);
  -- força attempts próximo do limite (max=2)
  UPDATE public.pg_stat_pending_notifications
    SET attempts = 1, next_attempt_at = now() - interval '1s'
    WHERE id = v_id;
  v_before := (SELECT next_attempt_at FROM public.pg_stat_pending_notifications WHERE id = v_id);

  PERFORM public._test_enqueue_http('https://test.local/case6', 500, 'boom', NULL);
  PERFORM public.pg_stat_notif_process_queue();  -- dispatch → attempts=2 (in_flight)
  PERFORM public.pg_stat_notif_process_queue();  -- resposta 500, atingiu max → failed

  SELECT * INTO v_row FROM public.pg_stat_pending_notifications WHERE id = v_id;
  PERFORM pg_temp.assert(v_row.status = 'failed', '6: failed no limite, got ' || v_row.status);
  PERFORM pg_temp.assert(v_row.attempts = 2, '6: attempts=2');
  -- next_attempt_at não deve avançar após atingir limite
  PERFORM pg_temp.assert(v_row.next_attempt_at = v_before,
    '6: next_attempt_at não deve mudar após limite');
  RAISE NOTICE 'PASS 6: limite de tentativas';
END $$;

-- ============================================================
-- CASO 7: avanço de tempo re-processa item agendado
-- ============================================================
DO $$
DECLARE v_id uuid; v_row record;
BEGIN
  v_id := pg_temp.mk_notif('https://test.local/case7');
  PERFORM public._test_enqueue_http('https://test.local/case7', 500, 'boom', NULL);
  PERFORM public.pg_stat_notif_process_queue();
  PERFORM public.pg_stat_notif_process_queue();

  SELECT * INTO v_row FROM public.pg_stat_pending_notifications WHERE id = v_id;
  PERFORM pg_temp.assert(v_row.attempts = 1, '7: primeira tentativa');
  PERFORM pg_temp.assert(v_row.status = 'pending', '7: pending');

  -- Simula avanço de tempo
  UPDATE public.pg_stat_pending_notifications
    SET next_attempt_at = now() - interval '1s' WHERE id = v_id;

  PERFORM public._test_enqueue_http('https://test.local/case7', 200, 'ok', NULL);
  PERFORM public.pg_stat_notif_process_queue();
  PERFORM public.pg_stat_notif_process_queue();

  SELECT * INTO v_row FROM public.pg_stat_pending_notifications WHERE id = v_id;
  PERFORM pg_temp.assert(v_row.status = 'succeeded', '7: succeeded após retry, got ' || v_row.status);
  PERFORM pg_temp.assert(v_row.attempts = 2, '7: attempts=2 após retry');
  RAISE NOTICE 'PASS 7: avanço de tempo';
END $$;

-- ============================================================
-- CASO 8: idempotência — process_queue duplicado não duplica attempts
-- ============================================================
DO $$
DECLARE v_id uuid; v_att_before int; v_att_after int;
BEGIN
  v_id := pg_temp.mk_notif('https://test.local/case8');
  PERFORM public._test_enqueue_http('https://test.local/case8', 200, 'ok', NULL);
  PERFORM public.pg_stat_notif_process_queue();
  PERFORM public.pg_stat_notif_process_queue();

  SELECT count(*) INTO v_att_before FROM public.pg_stat_notif_attempts WHERE notification_id = v_id;

  PERFORM public.pg_stat_notif_process_queue();
  PERFORM public.pg_stat_notif_process_queue();

  SELECT count(*) INTO v_att_after FROM public.pg_stat_notif_attempts WHERE notification_id = v_id;
  PERFORM pg_temp.assert(v_att_before = v_att_after,
    '8: attempts não devem duplicar (' || v_att_before || ' vs ' || v_att_after || ')');
  RAISE NOTICE 'PASS 8: idempotência';
END $$;

-- Cleanup
SELECT public._test_notif_reset();
ROLLBACK;

\echo '========================================='
\echo 'TODOS OS 8 TESTES DE INTEGRAÇÃO PASSARAM'
\echo '========================================='
