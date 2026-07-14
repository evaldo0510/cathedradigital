
-- =========================================================================
-- PR1: Pending notifications queue + backoff consumer for pg_stat snapshot
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.pg_stat_pending_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel text NOT NULL CHECK (channel IN ('webhook','slack')),
  target_url text NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','in_flight','succeeded','failed')),
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 6,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  last_attempt_at timestamptz,
  last_error text,
  last_status_code integer,
  last_request_id bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  succeeded_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_pg_stat_pending_notif_due
  ON public.pg_stat_pending_notifications (status, next_attempt_at)
  WHERE status IN ('pending','in_flight');

CREATE INDEX IF NOT EXISTS idx_pg_stat_pending_notif_created
  ON public.pg_stat_pending_notifications (created_at DESC);

GRANT SELECT ON public.pg_stat_pending_notifications TO authenticated;
GRANT ALL ON public.pg_stat_pending_notifications TO service_role;

ALTER TABLE public.pg_stat_pending_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view pending notifications"
  ON public.pg_stat_pending_notifications
  FOR SELECT
  TO authenticated
  USING (public.is_current_user_admin());

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.pg_stat_pending_notif_touch()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pg_stat_pending_notif_touch ON public.pg_stat_pending_notifications;
CREATE TRIGGER trg_pg_stat_pending_notif_touch
  BEFORE UPDATE ON public.pg_stat_pending_notifications
  FOR EACH ROW EXECUTE FUNCTION public.pg_stat_pending_notif_touch();

-- =========================================================================
-- Backoff helper: 30s * 2^attempts capped at 1h, with ±25% jitter
-- =========================================================================
CREATE OR REPLACE FUNCTION public.pg_stat_notif_backoff(p_attempts integer)
RETURNS interval
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_base_seconds numeric;
  v_jitter numeric;
BEGIN
  v_base_seconds := LEAST(3600, 30 * power(2, GREATEST(p_attempts, 0)));
  -- jitter factor between 0.75 and 1.25
  v_jitter := 0.75 + (random() * 0.5);
  RETURN make_interval(secs => (v_base_seconds * v_jitter)::double precision);
END;
$$;

-- =========================================================================
-- Retryability classifier
-- NULL status_code = network/timeout error → retry
-- 2xx = success (handled elsewhere)
-- 408 request timeout, 425 too early, 429 rate limit, 5xx = retry
-- other 4xx = permanent failure
-- =========================================================================
CREATE OR REPLACE FUNCTION public.pg_stat_notif_is_retryable(p_status_code integer)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT
    p_status_code IS NULL
    OR p_status_code IN (408, 425, 429)
    OR (p_status_code >= 500 AND p_status_code < 600);
$$;

-- =========================================================================
-- Queue consumer: dispatches pending, checks in_flight responses,
-- reschedules or fails per policy. Idempotent (uses request_id + status).
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
  -- 1) Check outcomes of previously dispatched in_flight requests
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

    IF NOT FOUND THEN
      -- response not ready yet; skip this tick
      CONTINUE;
    END IF;

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

  -- 2) Dispatch pending rows whose next_attempt_at is due
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
    EXCEPTION WHEN OTHERS THEN
      -- pg_net enqueue failed synchronously (rare); treat as retryable
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
-- Enqueue helper (used by auto_run)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.pg_stat_notif_enqueue(
  p_channel text,
  p_target_url text,
  p_payload jsonb,
  p_max_attempts integer DEFAULT 6
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_target_url IS NULL OR TRIM(p_target_url) = '' THEN
    RETURN NULL;
  END IF;
  INSERT INTO public.pg_stat_pending_notifications
    (channel, target_url, payload, max_attempts, next_attempt_at)
  VALUES
    (p_channel, p_target_url, p_payload,
     GREATEST(1, LEAST(20, p_max_attempts)), now())
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.pg_stat_notif_enqueue(text, text, jsonb, integer) FROM PUBLIC, anon, authenticated;

-- =========================================================================
-- Refactor auto_run to enqueue instead of direct POST
-- =========================================================================
CREATE OR REPLACE FUNCTION public.pg_stat_snapshot_auto_run()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_cfg public.pg_stat_snapshot_config;
  v_id uuid;
  v_rows jsonb;
  v_total_calls bigint;
  v_total_ms numeric;
  v_row_count integer;
  v_window_start timestamptz;
  v_err text;
  v_payload jsonb;
  v_slack jsonb;
BEGIN
  SELECT * INTO v_cfg FROM public.pg_stat_snapshot_config WHERE id = 1;
  IF v_cfg IS NULL OR NOT v_cfg.enabled THEN
    RETURN;
  END IF;

  IF v_cfg.last_run_at IS NOT NULL
     AND now() - v_cfg.last_run_at < make_interval(mins => v_cfg.interval_minutes) THEN
    RETURN;
  END IF;

  BEGIN
    SELECT stats_reset INTO v_window_start
    FROM extensions.pg_stat_statements_info
    LIMIT 1;

    SELECT
      jsonb_agg(row_to_json(t) ORDER BY t.total_exec_time DESC),
      COALESCE(SUM(t.calls), 0),
      COALESCE(SUM(t.total_exec_time), 0),
      COUNT(*)
    INTO v_rows, v_total_calls, v_total_ms, v_row_count
    FROM (
      SELECT
        s.query,
        s.calls,
        s.total_exec_time,
        s.mean_exec_time,
        s.max_exec_time,
        s.min_exec_time,
        s.stddev_exec_time,
        s.rows AS rows_returned,
        s.shared_blks_hit,
        s.shared_blks_read
      FROM extensions.pg_stat_statements s
      JOIN pg_database d ON d.oid = s.dbid
      WHERE d.datname = current_database()
        AND s.query !~* '^(BEGIN|COMMIT|ROLLBACK|SET |SHOW |DEALLOCATE|DISCARD|COPY |VACUUM|ANALYZE)'
        AND s.query !~* 'pg_stat_statements|pg_catalog|information_schema'
      ORDER BY s.total_exec_time DESC
      LIMIT 200
    ) t;

    INSERT INTO public.pg_stat_snapshots
      (taken_by, label, note, window_started_at, window_seconds,
       total_calls, total_exec_ms, row_count, rows)
    VALUES
      (NULL, 'auto', 'captura automática', v_window_start,
       CASE WHEN v_window_start IS NULL THEN NULL
            ELSE EXTRACT(EPOCH FROM (now() - v_window_start)) END,
       v_total_calls, v_total_ms, v_row_count, COALESCE(v_rows, '[]'::jsonb))
    RETURNING id INTO v_id;

    UPDATE public.pg_stat_snapshot_config
      SET last_run_at = now(),
          last_success_at = now(),
          last_snapshot_id = v_id,
          last_error_at = NULL,
          last_error_message = NULL,
          consecutive_failures = 0
      WHERE id = 1;

    DELETE FROM public.pg_stat_snapshots
      WHERE taken_at < now() - make_interval(days => v_cfg.retention_days);

  EXCEPTION WHEN OTHERS THEN
    v_err := left(COALESCE(SQLERRM, 'unknown error'), 500);
    UPDATE public.pg_stat_snapshot_config
      SET last_run_at = now(),
          last_error_at = now(),
          last_error_message = v_err,
          consecutive_failures = COALESCE(consecutive_failures, 0) + 1
      WHERE id = 1;
    RAISE WARNING 'pg_stat_snapshot_auto_run failed: %', v_err;

    v_payload := jsonb_build_object(
      'event', 'pg_stat_snapshot_auto_run_failed',
      'occurred_at', now(),
      'error', v_err,
      'consecutive_failures', COALESCE(v_cfg.consecutive_failures, 0) + 1,
      'last_success_at', v_cfg.last_success_at
    );
    v_slack := jsonb_build_object(
      'text',
      format(':warning: *pg_stat_statements auto-snapshot falhou* (%s× consecutivas)%s%s',
        COALESCE(v_cfg.consecutive_failures, 0) + 1,
        E'\n> ' || v_err,
        CASE WHEN v_cfg.last_success_at IS NOT NULL
             THEN E'\nÚltimo sucesso: ' || v_cfg.last_success_at::text
             ELSE '' END
      )
    );

    IF v_cfg.notify_webhook_url IS NOT NULL THEN
      PERFORM public.pg_stat_notif_enqueue('webhook', v_cfg.notify_webhook_url, v_payload, 6);
    END IF;
    IF v_cfg.notify_slack_webhook_url IS NOT NULL THEN
      PERFORM public.pg_stat_notif_enqueue('slack', v_cfg.notify_slack_webhook_url, v_slack, 6);
    END IF;
  END;
END;
$$;

REVOKE ALL ON FUNCTION public.pg_stat_snapshot_auto_run() FROM PUBLIC, anon, authenticated;

-- =========================================================================
-- pg_cron: consume queue every minute
-- =========================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'pg_stat_notif_queue_worker') THEN
    PERFORM cron.unschedule('pg_stat_notif_queue_worker');
  END IF;
  PERFORM cron.schedule(
    'pg_stat_notif_queue_worker',
    '* * * * *',
    $cron$ SELECT public.pg_stat_notif_process_queue(); $cron$
  );
END $$;
