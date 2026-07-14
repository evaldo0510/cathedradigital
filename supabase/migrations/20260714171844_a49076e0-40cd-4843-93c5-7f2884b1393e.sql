
CREATE TABLE IF NOT EXISTS public.pg_stat_notif_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL
    REFERENCES public.pg_stat_pending_notifications(id) ON DELETE CASCADE,
  attempt_no integer NOT NULL,
  event text NOT NULL
    CHECK (event IN ('dispatched','succeeded','retry_scheduled','failed')),
  status_code integer,
  error_msg text,
  next_attempt_at timestamptz,
  request_id bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pg_stat_notif_attempts_notif
  ON public.pg_stat_notif_attempts (notification_id, created_at DESC);

GRANT SELECT ON public.pg_stat_notif_attempts TO authenticated;
GRANT ALL ON public.pg_stat_notif_attempts TO service_role;

ALTER TABLE public.pg_stat_notif_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view notification attempts"
  ON public.pg_stat_notif_attempts
  FOR SELECT
  TO authenticated
  USING (public.is_current_user_admin());

-- =========================================================================
-- Rewrite process_queue to log every transition into pg_stat_notif_attempts
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
  v_next timestamptz;
  v_final_error text;
BEGIN
  -- 1) Check in_flight requests
  FOR v_row IN
    SELECT id, attempts, max_attempts, last_request_id
    FROM public.pg_stat_pending_notifications
    WHERE status = 'in_flight' AND last_request_id IS NOT NULL
    ORDER BY last_attempt_at ASC NULLS FIRST
    LIMIT 50
    FOR UPDATE SKIP LOCKED
  LOOP
    SELECT status_code, error_msg, status
      INTO v_response
      FROM net._http_response
      WHERE id = v_row.last_request_id
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
                          'HTTP ' || v_response.status_code::text), 500);

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

  -- 2) Dispatch due pending rows
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
$$;

REVOKE ALL ON FUNCTION public.pg_stat_notif_process_queue() FROM PUBLIC, anon, authenticated;

-- RPC to fetch attempt trail for one notification
CREATE OR REPLACE FUNCTION public.admin_list_notification_attempts(p_id uuid)
RETURNS TABLE (
  id uuid,
  attempt_no integer,
  event text,
  status_code integer,
  error_msg text,
  next_attempt_at timestamptz,
  request_id bigint,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  RETURN QUERY
    SELECT a.id, a.attempt_no, a.event, a.status_code, a.error_msg,
           a.next_attempt_at, a.request_id, a.created_at
    FROM public.pg_stat_notif_attempts a
    WHERE a.notification_id = p_id
    ORDER BY a.created_at ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_notification_attempts(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_notification_attempts(uuid) TO authenticated;
