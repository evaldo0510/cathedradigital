-- Add severity to alerts
ALTER TABLE public.webhook_alerts ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'warning';

-- Add notification email to settings
ALTER TABLE public.webhook_settings ADD COLUMN IF NOT EXISTS alert_notification_email TEXT;

-- Improve get_pending_webhook_retries to handle potentially stuck 'pending' logs
CREATE OR REPLACE FUNCTION public.get_pending_webhook_retries()
RETURNS SETOF public.webhook_logs
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM public.webhook_logs
    WHERE (
        status = 'failed' 
        OR (status = 'pending' AND created_at < now() - interval '10 minutes') -- Consider stuck if pending for too long
    )
    AND retry_count < (SELECT COALESCE(max_retries, 5) FROM public.webhook_settings LIMIT 1)
    AND (next_retry_at IS NULL OR next_retry_at <= now())
    ORDER BY created_at ASC
    LIMIT 20;
END;
$$;

-- Grant permissions (standard procedure)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.webhook_logs TO service_role;
GRANT SELECT ON public.webhook_settings TO authenticated;
GRANT ALL ON public.webhook_settings TO service_role;
GRANT ALL ON public.webhook_alerts TO service_role;
GRANT SELECT ON public.webhook_alerts TO authenticated;
