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
  -- _test_http_response_store é por request_id (sem coluna url); limpo apenas registros antigos
  DELETE FROM public._test_http_response_store WHERE created_at < now() - interval '1 hour';

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
END;
$$;
