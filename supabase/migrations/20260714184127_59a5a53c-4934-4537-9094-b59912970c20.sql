
-- =========================================================================
-- Channel limits: max_attempts_default + max_fail_rate circuit breaker
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.pg_stat_notif_channel_limits (
  channel text PRIMARY KEY CHECK (channel IN ('webhook','slack')),
  max_attempts_default integer NOT NULL DEFAULT 6 CHECK (max_attempts_default BETWEEN 1 AND 20),
  max_fail_rate numeric NOT NULL DEFAULT 0.5 CHECK (max_fail_rate >= 0 AND max_fail_rate <= 1),
  window_minutes integer NOT NULL DEFAULT 15 CHECK (window_minutes BETWEEN 1 AND 1440),
  min_samples integer NOT NULL DEFAULT 5 CHECK (min_samples >= 1),
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pg_stat_notif_channel_limits TO authenticated;
GRANT ALL ON public.pg_stat_notif_channel_limits TO service_role;

ALTER TABLE public.pg_stat_notif_channel_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view channel limits"
  ON public.pg_stat_notif_channel_limits;
CREATE POLICY "Admins can view channel limits"
  ON public.pg_stat_notif_channel_limits
  FOR SELECT
  TO authenticated
  USING (public.is_current_user_admin());

CREATE OR REPLACE FUNCTION public.pg_stat_notif_channel_limits_touch()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_pg_stat_notif_channel_limits_touch
  ON public.pg_stat_notif_channel_limits;
CREATE TRIGGER trg_pg_stat_notif_channel_limits_touch
  BEFORE UPDATE ON public.pg_stat_notif_channel_limits
  FOR EACH ROW EXECUTE FUNCTION public.pg_stat_notif_channel_limits_touch();

INSERT INTO public.pg_stat_notif_channel_limits(channel) VALUES ('webhook'),('slack')
  ON CONFLICT (channel) DO NOTHING;

-- =========================================================================
-- Channel health + gate
-- =========================================================================
CREATE OR REPLACE FUNCTION public.pg_stat_notif_channel_health(p_channel text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lim public.pg_stat_notif_channel_limits;
  v_succ int := 0;
  v_fail int := 0;
  v_total int := 0;
  v_rate numeric := 0;
BEGIN
  SELECT * INTO v_lim FROM public.pg_stat_notif_channel_limits WHERE channel = p_channel;
  IF v_lim IS NULL THEN
    RETURN jsonb_build_object('channel', p_channel, 'configured', false);
  END IF;

  SELECT
    count(*) FILTER (WHERE a.event = 'succeeded'),
    count(*) FILTER (WHERE a.event = 'failed')
    INTO v_succ, v_fail
    FROM public.pg_stat_notif_attempts a
    JOIN public.pg_stat_pending_notifications n ON n.id = a.notification_id
   WHERE n.channel = p_channel
     AND a.at >= now() - make_interval(mins => v_lim.window_minutes);

  v_total := v_succ + v_fail;
  IF v_total > 0 THEN
    v_rate := v_fail::numeric / v_total::numeric;
  END IF;

  RETURN jsonb_build_object(
    'channel', p_channel,
    'configured', true,
    'enabled', v_lim.enabled,
    'window_minutes', v_lim.window_minutes,
    'min_samples', v_lim.min_samples,
    'max_fail_rate', v_lim.max_fail_rate,
    'succeeded', v_succ,
    'failed', v_fail,
    'total', v_total,
    'fail_rate', v_rate
  );
END;
$$;

REVOKE ALL ON FUNCTION public.pg_stat_notif_channel_health(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pg_stat_notif_channel_health(text) TO authenticated, service_role;

-- Retorna TRUE quando o disjuntor está ABERTO (canal deve ser pausado).
CREATE OR REPLACE FUNCTION public.pg_stat_notif_channel_gate_blocked(p_channel text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_h jsonb;
BEGIN
  v_h := public.pg_stat_notif_channel_health(p_channel);
  IF NOT COALESCE((v_h->>'configured')::boolean, false) THEN RETURN false; END IF;
  IF NOT COALESCE((v_h->>'enabled')::boolean, true) THEN RETURN true; END IF;
  IF (v_h->>'total')::int < (v_h->>'min_samples')::int THEN RETURN false; END IF;
  RETURN (v_h->>'fail_rate')::numeric > (v_h->>'max_fail_rate')::numeric;
END;
$$;

REVOKE ALL ON FUNCTION public.pg_stat_notif_channel_gate_blocked(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pg_stat_notif_channel_gate_blocked(text) TO authenticated, service_role;

-- =========================================================================
-- Worker: aplicar gate do canal antes do dispatch
-- =========================================================================
CREATE OR REPLACE FUNCTION public.pg_stat_notif_process_queue()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_row record;
  v_response record;
  v_request_id bigint;
  v_processed integer := 0;
  v_retryable boolean;
BEGIN
  -- 1) Checar in_flight (inalterado)
  FOR v_row IN
    SELECT id, attempts, max_attempts, last_request_id
      FROM public.pg_stat_pending_notifications
     WHERE status = 'in_flight'
       AND last_request_id IS NOT NULL
     ORDER BY last_attempt_at ASC NULLS FIRST
     LIMIT 50
       FOR UPDATE SKIP LOCKED
  LOOP
    SELECT status_code, error_msg, status
      INTO v_response
      FROM net._http_response
     WHERE id = v_row.last_request_id
     LIMIT 1;

    IF NOT FOUND THEN CONTINUE; END IF;

    IF v_response.status_code BETWEEN 200 AND 299 THEN
      UPDATE public.pg_stat_pending_notifications
         SET status = 'succeeded',
             succeeded_at = now(),
             last_status_code = v_response.status_code,
             last_error = NULL
       WHERE id = v_row.id;
      v_processed := v_processed + 1;
      CONTINUE;
    END IF;

    v_retryable := public.pg_stat_notif_is_retryable(v_response.status_code);

    IF NOT v_retryable OR v_row.attempts >= v_row.max_attempts THEN
      UPDATE public.pg_stat_pending_notifications
         SET status = 'failed',
             last_status_code = v_response.status_code,
             last_error = left(COALESCE(v_response.error_msg,
                                        'HTTP ' || v_response.status_code::text), 500)
       WHERE id = v_row.id;
    ELSE
      UPDATE public.pg_stat_pending_notifications
         SET status = 'pending',
             last_status_code = v_response.status_code,
             last_error = left(COALESCE(v_response.error_msg,
                                        'HTTP ' || v_response.status_code::text), 500),
             next_attempt_at = now() + public.pg_stat_notif_backoff(v_row.attempts)
       WHERE id = v_row.id;
    END IF;

    v_processed := v_processed + 1;
  END LOOP;

  -- 2) Dispatch pendentes — pulando canais com gate aberto
  FOR v_row IN
    WITH gates AS (
      SELECT cl.channel,
             public.pg_stat_notif_channel_gate_blocked(cl.channel) AS blocked
        FROM public.pg_stat_notif_channel_limits cl
    )
    SELECT n.id, n.channel, n.target_url, n.payload, n.attempts, n.max_attempts,
           COALESCE(g.blocked, false) AS blocked
      FROM public.pg_stat_pending_notifications n
      LEFT JOIN gates g ON g.channel = n.channel
     WHERE n.status = 'pending'
       AND n.next_attempt_at <= now()
       AND n.attempts < n.max_attempts
     ORDER BY n.next_attempt_at ASC
     LIMIT 20
       FOR UPDATE OF n SKIP LOCKED
  LOOP
    IF v_row.blocked THEN
      -- Circuit breaker aberto: adia sem consumir tentativa
      UPDATE public.pg_stat_pending_notifications
         SET next_attempt_at = now() + interval '1 minute',
             last_error = 'channel gate blocked (fail_rate > max_fail_rate)'
       WHERE id = v_row.id;
      CONTINUE;
    END IF;

    BEGIN
      SELECT net.http_post(
        url := v_row.target_url,
        headers := '{"Content-Type":"application/json"}'::jsonb,
        body := v_row.payload,
        timeout_milliseconds := 10000
      ) INTO v_request_id;

      UPDATE public.pg_stat_pending_notifications
         SET status = 'in_flight',
             attempts = attempts + 1,
             last_attempt_at = now(),
             last_request_id = v_request_id
       WHERE id = v_row.id;
    EXCEPTION WHEN OTHERS THEN
      IF v_row.attempts + 1 >= v_row.max_attempts THEN
        UPDATE public.pg_stat_pending_notifications
           SET status = 'failed',
               attempts = attempts + 1,
               last_attempt_at = now(),
               last_error = left(COALESCE(SQLERRM, 'dispatch failed'), 500)
         WHERE id = v_row.id;
      ELSE
        UPDATE public.pg_stat_pending_notifications
           SET attempts = attempts + 1,
               last_attempt_at = now(),
               last_error = left(COALESCE(SQLERRM, 'dispatch failed'), 500),
               next_attempt_at = now() + public.pg_stat_notif_backoff(v_row.attempts + 1)
         WHERE id = v_row.id;
      END IF;
    END;

    v_processed := v_processed + 1;
  END LOOP;

  RETURN v_processed;
END;
$$;

REVOKE ALL ON FUNCTION public.pg_stat_notif_process_queue() FROM PUBLIC, anon, authenticated;

-- =========================================================================
-- Enqueue: aplica default do canal quando p_max_attempts <= 0
-- =========================================================================
CREATE OR REPLACE FUNCTION public.pg_stat_notif_enqueue(
  p_channel text,
  p_target_url text,
  p_payload jsonb,
  p_max_attempts integer DEFAULT 0
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_effective int;
  v_default int;
BEGIN
  IF p_target_url IS NULL OR TRIM(p_target_url) = '' THEN RETURN NULL; END IF;

  SELECT max_attempts_default INTO v_default
    FROM public.pg_stat_notif_channel_limits WHERE channel = p_channel;
  v_default := COALESCE(v_default, 6);

  v_effective := CASE WHEN p_max_attempts IS NULL OR p_max_attempts <= 0
                      THEN v_default ELSE p_max_attempts END;
  v_effective := GREATEST(1, LEAST(20, v_effective));

  INSERT INTO public.pg_stat_pending_notifications
    (channel, target_url, payload, max_attempts, next_attempt_at)
  VALUES
    (p_channel, p_target_url, p_payload, v_effective, now())
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.pg_stat_notif_enqueue(text, text, jsonb, integer) FROM PUBLIC, anon, authenticated;

-- =========================================================================
-- Helpers de teste do circuit breaker + max_attempts dinâmico
-- =========================================================================
CREATE OR REPLACE FUNCTION public._test_notif_limits_seed(
  p_channel text,
  p_prefix text,
  p_count int,
  p_fail_ratio numeric,
  p_max_attempts int
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  i int; v_url text; v_status int;
BEGIN
  DELETE FROM public.pg_stat_notif_attempts
    WHERE notification_id IN (
      SELECT id FROM public.pg_stat_pending_notifications WHERE target_url LIKE p_prefix || '%'
    );
  DELETE FROM public.pg_stat_pending_notifications WHERE target_url LIKE p_prefix || '%';
  DELETE FROM public._test_http_responses WHERE url LIKE p_prefix || '%';

  FOR i IN 1..p_count LOOP
    v_url := p_prefix || i::text;
    v_status := CASE WHEN (i::numeric / p_count) < p_fail_ratio THEN 500 ELSE 200 END;
    INSERT INTO public.pg_stat_pending_notifications
      (channel, target_url, payload, status, attempts, max_attempts, next_attempt_at)
    VALUES
      (p_channel, v_url, jsonb_build_object('n', i), 'pending', 0, p_max_attempts, now());
    INSERT INTO public._test_http_responses(url, status_code, response_body)
      VALUES (v_url, v_status, CASE WHEN v_status = 200 THEN 'ok' ELSE 'boom' END);
  END LOOP;
  RETURN p_count;
END;
$$;

REVOKE ALL ON FUNCTION public._test_notif_limits_seed(text,text,int,numeric,int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public._test_notif_limits_seed(text,text,int,numeric,int) TO service_role;

CREATE OR REPLACE FUNCTION public._test_notif_limits_verify(p_prefix text, p_max_attempts int)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total int; v_by_status jsonb; v_overflow int; v_double int; v_dup_disp int; v_pending_null int;
BEGIN
  SELECT count(*) INTO v_total
    FROM public.pg_stat_pending_notifications WHERE target_url LIKE p_prefix || '%';

  SELECT coalesce(jsonb_object_agg(status,c),'{}'::jsonb) INTO v_by_status FROM (
    SELECT status, count(*) c FROM public.pg_stat_pending_notifications
     WHERE target_url LIKE p_prefix || '%' GROUP BY status
  ) t;

  SELECT count(*) INTO v_overflow FROM public.pg_stat_pending_notifications
   WHERE target_url LIKE p_prefix || '%' AND attempts > p_max_attempts;

  SELECT count(*) INTO v_dup_disp FROM (
    SELECT a.notification_id, a.attempt_no
      FROM public.pg_stat_notif_attempts a
      JOIN public.pg_stat_pending_notifications n ON n.id = a.notification_id
     WHERE n.target_url LIKE p_prefix || '%' AND a.event = 'dispatched'
     GROUP BY 1,2 HAVING count(*) > 1
  ) x;

  SELECT count(*) INTO v_double FROM (
    SELECT a.notification_id
      FROM public.pg_stat_notif_attempts a
      JOIN public.pg_stat_pending_notifications n ON n.id = a.notification_id
     WHERE n.target_url LIKE p_prefix || '%' AND a.event IN ('succeeded','failed')
     GROUP BY 1 HAVING count(DISTINCT a.event) > 1
  ) x;

  SELECT count(*) INTO v_pending_null FROM public.pg_stat_pending_notifications
   WHERE target_url LIKE p_prefix || '%' AND status = 'pending' AND next_attempt_at IS NULL;

  RETURN jsonb_build_object(
    'total', v_total,
    'by_status', v_by_status,
    'violations', jsonb_build_object(
      'attempts_overflow', v_overflow,
      'duplicate_dispatched', v_dup_disp,
      'terminal_double', v_double,
      'pending_null_next', v_pending_null
    ),
    'all_passed', (v_overflow = 0 AND v_dup_disp = 0 AND v_double = 0 AND v_pending_null = 0)
  );
END;
$$;

REVOKE ALL ON FUNCTION public._test_notif_limits_verify(text,int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public._test_notif_limits_verify(text,int) TO service_role;

CREATE OR REPLACE FUNCTION public._test_notif_limits_cleanup(p_prefix text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.pg_stat_notif_attempts
    WHERE notification_id IN (
      SELECT id FROM public.pg_stat_pending_notifications WHERE target_url LIKE p_prefix || '%'
    );
  DELETE FROM public.pg_stat_pending_notifications WHERE target_url LIKE p_prefix || '%';
  DELETE FROM public._test_http_responses WHERE url LIKE p_prefix || '%';
END;
$$;

REVOKE ALL ON FUNCTION public._test_notif_limits_cleanup(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public._test_notif_limits_cleanup(text) TO service_role;

COMMENT ON TABLE public.pg_stat_notif_channel_limits
  IS 'Limites dinâmicos por canal: max_attempts padrão + circuit breaker (max_fail_rate em janela).';
COMMENT ON FUNCTION public.pg_stat_notif_channel_health(text)
  IS 'Retorna JSON com fail_rate na janela configurada para o canal.';
COMMENT ON FUNCTION public.pg_stat_notif_channel_gate_blocked(text)
  IS 'TRUE quando o canal está temporariamente pausado por excesso de falhas na janela.';
