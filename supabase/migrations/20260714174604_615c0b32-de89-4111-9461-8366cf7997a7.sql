-- Wrappers de rede trocáveis para testes de integração da fila de notificações

-- 1) Store de fixtures (só usado quando app.notif_test_mode='on')
CREATE TABLE IF NOT EXISTS public._test_http_responses (
  id bigserial PRIMARY KEY,
  url text NOT NULL,
  status_code int,
  response_body text,
  error_msg text,
  consumed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public._test_http_responses FROM PUBLIC, anon, authenticated;
GRANT ALL ON public._test_http_responses TO service_role;
ALTER TABLE public._test_http_responses ENABLE ROW LEVEL SECURITY;
-- sem policies: tabela é acessada apenas por SECURITY DEFINER em modo teste

CREATE TABLE IF NOT EXISTS public._test_http_response_store (
  request_id bigint PRIMARY KEY,
  status_code int,
  response_body text,
  error_msg text,
  created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public._test_http_response_store FROM PUBLIC, anon, authenticated;
GRANT ALL ON public._test_http_response_store TO service_role;
ALTER TABLE public._test_http_response_store ENABLE ROW LEVEL SECURITY;

CREATE SEQUENCE IF NOT EXISTS public._test_http_request_id_seq START 1000000;

-- 2) Helpers de fixture (só chamados a partir do teste SQL)
CREATE OR REPLACE FUNCTION public._test_enqueue_http(
  p_url text, p_status int, p_body text DEFAULT NULL, p_error text DEFAULT NULL
) RETURNS bigint
LANGUAGE sql
AS $$
  INSERT INTO public._test_http_responses(url, status_code, response_body, error_msg)
  VALUES (p_url, p_status, p_body, p_error)
  RETURNING id;
$$;

CREATE OR REPLACE FUNCTION public._test_notif_reset() RETURNS void
LANGUAGE sql
AS $$
  TRUNCATE public._test_http_responses;
  TRUNCATE public._test_http_response_store;
$$;

-- 3) Wrapper de dispatch (substitui net.http_post no worker)
CREATE OR REPLACE FUNCTION public._notif_http_post(
  p_url text, p_headers jsonb, p_body jsonb, p_timeout_ms int
) RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_req_id bigint;
  v_fix record;
BEGIN
  IF current_setting('app.notif_test_mode', true) = 'on' THEN
    -- consome próxima fixture FIFO para a URL (ou qualquer, se não houver match)
    SELECT * INTO v_fix
      FROM public._test_http_responses
      WHERE consumed = false AND (url = p_url OR url = '*')
      ORDER BY id ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'no test fixture for url %', p_url;
    END IF;

    UPDATE public._test_http_responses SET consumed = true WHERE id = v_fix.id;

    v_req_id := nextval('public._test_http_request_id_seq');
    INSERT INTO public._test_http_response_store(request_id, status_code, response_body, error_msg)
    VALUES (v_req_id, v_fix.status_code, v_fix.response_body, v_fix.error_msg);
    RETURN v_req_id;
  END IF;

  SELECT net.http_post(
    url := p_url,
    headers := p_headers,
    body := p_body,
    timeout_milliseconds := p_timeout_ms
  ) INTO v_req_id;
  RETURN v_req_id;
END;
$$;

-- 4) Wrapper de leitura de resposta
CREATE OR REPLACE FUNCTION public._notif_http_response(p_request_id bigint)
RETURNS TABLE(status_code int, error_msg text, status text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
BEGIN
  IF current_setting('app.notif_test_mode', true) = 'on' THEN
    RETURN QUERY
      SELECT s.status_code, s.error_msg,
             CASE WHEN s.status_code IS NULL THEN 'ERROR' ELSE 'SUCCESS' END::text
      FROM public._test_http_response_store s
      WHERE s.request_id = p_request_id;
    RETURN;
  END IF;

  RETURN QUERY
    SELECT r.status_code, r.error_msg, r.status::text
    FROM net._http_response r
    WHERE r.id = p_request_id
    LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public._notif_http_post(text, jsonb, jsonb, int) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._notif_http_response(bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._test_enqueue_http(text, int, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._test_notif_reset() FROM PUBLIC, anon, authenticated;

-- 5) Reescrever o worker para usar os wrappers (única mudança de comportamento: net.* -> _notif_*)
CREATE OR REPLACE FUNCTION public.pg_stat_notif_process_queue()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_row record;
  v_response record;
  v_request_id bigint;
  v_processed integer := 0;
  v_retryable boolean;
  v_next timestamptz;
  v_final_error text;
BEGIN
  FOR v_row IN
    SELECT id, attempts, max_attempts, last_request_id
    FROM public.pg_stat_pending_notifications
    WHERE status = 'in_flight' AND last_request_id IS NOT NULL
    ORDER BY last_attempt_at ASC NULLS FIRST
    LIMIT 50
    FOR UPDATE SKIP LOCKED
  LOOP
    SELECT * INTO v_response
      FROM public._notif_http_response(v_row.last_request_id)
      LIMIT 1;

    IF NOT FOUND THEN
      CONTINUE;
    END IF;

    IF v_response.status_code BETWEEN 200 AND 299 THEN
      UPDATE public.pg_stat_pending_notifications
        SET status = 'succeeded',
            succeeded_at = now(),
            last_status_code = v_response.status_code,
            last_error = NULL
        WHERE id = v_row.id;

      INSERT INTO public.pg_stat_notif_attempts
        (notification_id, attempt_no, event, status_code, request_id)
      VALUES
        (v_row.id, v_row.attempts, 'succeeded',
         v_response.status_code, v_row.last_request_id);

      v_processed := v_processed + 1;
      CONTINUE;
    END IF;

    v_retryable := public.pg_stat_notif_is_retryable(v_response.status_code);
    v_final_error := left(COALESCE(v_response.error_msg,
                          'HTTP ' || COALESCE(v_response.status_code::text, 'network')), 500);

    IF NOT v_retryable OR v_row.attempts >= v_row.max_attempts THEN
      UPDATE public.pg_stat_pending_notifications
        SET status = 'failed',
            last_status_code = v_response.status_code,
            last_error = v_final_error
        WHERE id = v_row.id;

      INSERT INTO public.pg_stat_notif_attempts
        (notification_id, attempt_no, event, status_code, error_msg, request_id)
      VALUES
        (v_row.id, v_row.attempts, 'failed',
         v_response.status_code, v_final_error, v_row.last_request_id);
    ELSE
      v_next := now() + public.pg_stat_notif_backoff(v_row.attempts);
      UPDATE public.pg_stat_pending_notifications
        SET status = 'pending',
            last_status_code = v_response.status_code,
            last_error = v_final_error,
            next_attempt_at = v_next
        WHERE id = v_row.id;

      INSERT INTO public.pg_stat_notif_attempts
        (notification_id, attempt_no, event, status_code, error_msg,
         next_attempt_at, request_id)
      VALUES
        (v_row.id, v_row.attempts, 'retry_scheduled',
         v_response.status_code, v_final_error, v_next, v_row.last_request_id);
    END IF;

    v_processed := v_processed + 1;
  END LOOP;

  FOR v_row IN
    SELECT id, channel, target_url, payload, attempts, max_attempts
    FROM public.pg_stat_pending_notifications
    WHERE status = 'pending'
      AND next_attempt_at <= now()
      AND attempts < max_attempts
    ORDER BY next_attempt_at ASC
    LIMIT 20
    FOR UPDATE SKIP LOCKED
  LOOP
    BEGIN
      v_request_id := public._notif_http_post(
        v_row.target_url,
        '{"Content-Type":"application/json"}'::jsonb,
        v_row.payload,
        10000
      );

      UPDATE public.pg_stat_pending_notifications
        SET status = 'in_flight',
            attempts = attempts + 1,
            last_attempt_at = now(),
            last_request_id = v_request_id
        WHERE id = v_row.id;

      INSERT INTO public.pg_stat_notif_attempts
        (notification_id, attempt_no, event, request_id)
      VALUES
        (v_row.id, v_row.attempts + 1, 'dispatched', v_request_id);

    EXCEPTION WHEN OTHERS THEN
      v_final_error := left(COALESCE(SQLERRM, 'dispatch failed'), 500);
      IF v_row.attempts + 1 >= v_row.max_attempts THEN
        UPDATE public.pg_stat_pending_notifications
          SET status = 'failed',
              attempts = attempts + 1,
              last_attempt_at = now(),
              last_error = v_final_error
          WHERE id = v_row.id;

        INSERT INTO public.pg_stat_notif_attempts
          (notification_id, attempt_no, event, error_msg)
        VALUES
          (v_row.id, v_row.attempts + 1, 'failed', v_final_error);
      ELSE
        v_next := now() + public.pg_stat_notif_backoff(v_row.attempts + 1);
        UPDATE public.pg_stat_pending_notifications
          SET attempts = attempts + 1,
              last_attempt_at = now(),
              last_error = v_final_error,
              next_attempt_at = v_next
          WHERE id = v_row.id;

        INSERT INTO public.pg_stat_notif_attempts
          (notification_id, attempt_no, event, error_msg, next_attempt_at)
        VALUES
          (v_row.id, v_row.attempts + 1, 'retry_scheduled', v_final_error, v_next);
      END IF;
    END;

    v_processed := v_processed + 1;
  END LOOP;

  RETURN v_processed;
END;
$function$;