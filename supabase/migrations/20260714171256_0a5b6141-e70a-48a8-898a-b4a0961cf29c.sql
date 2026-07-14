
-- List pending/failed notifications for admin panel
CREATE OR REPLACE FUNCTION public.admin_list_pending_notifications(
  p_limit integer DEFAULT 100,
  p_status text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  channel text,
  target_url text,
  payload jsonb,
  status text,
  attempts integer,
  max_attempts integer,
  next_attempt_at timestamptz,
  last_attempt_at timestamptz,
  last_error text,
  last_status_code integer,
  last_request_id bigint,
  created_at timestamptz,
  succeeded_at timestamptz
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
    SELECT n.id, n.channel, n.target_url, n.payload, n.status, n.attempts,
           n.max_attempts, n.next_attempt_at, n.last_attempt_at, n.last_error,
           n.last_status_code, n.last_request_id, n.created_at, n.succeeded_at
    FROM public.pg_stat_pending_notifications n
    WHERE (p_status IS NULL OR n.status = p_status)
    ORDER BY
      CASE n.status WHEN 'failed' THEN 0 WHEN 'pending' THEN 1
                    WHEN 'in_flight' THEN 2 ELSE 3 END,
      n.created_at DESC
    LIMIT GREATEST(1, LEAST(500, p_limit));
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_pending_notifications(integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_pending_notifications(integer, text) TO authenticated;

-- Manually re-queue a notification (works for failed/in_flight/pending)
CREATE OR REPLACE FUNCTION public.admin_retry_pending_notification(p_id uuid)
RETURNS public.pg_stat_pending_notifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.pg_stat_pending_notifications;
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  UPDATE public.pg_stat_pending_notifications
    SET status = 'pending',
        next_attempt_at = now(),
        attempts = CASE WHEN status = 'failed' THEN 0 ELSE attempts END,
        last_request_id = NULL,
        last_error = NULL,
        last_status_code = NULL
    WHERE id = p_id
    RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'notification not found';
  END IF;

  -- immediately kick the worker so admin sees fast feedback
  PERFORM public.pg_stat_notif_process_queue();

  SELECT * INTO v_row FROM public.pg_stat_pending_notifications WHERE id = p_id;
  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_retry_pending_notification(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_retry_pending_notification(uuid) TO authenticated;

-- Aggregate counts for header badges
CREATE OR REPLACE FUNCTION public.admin_notif_queue_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v jsonb;
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  SELECT jsonb_build_object(
    'pending',   COUNT(*) FILTER (WHERE status = 'pending'),
    'in_flight', COUNT(*) FILTER (WHERE status = 'in_flight'),
    'succeeded', COUNT(*) FILTER (WHERE status = 'succeeded'),
    'failed',    COUNT(*) FILTER (WHERE status = 'failed'),
    'total',     COUNT(*)
  ) INTO v
  FROM public.pg_stat_pending_notifications;
  RETURN COALESCE(v, '{}'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_notif_queue_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_notif_queue_stats() TO authenticated;
