CREATE OR REPLACE FUNCTION public.track_webhook_alert(p_type text, p_message text, p_severity text DEFAULT 'warning')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_window_mins INTEGER;
    v_total_logs INTEGER;
    v_error_logs INTEGER;
    v_error_rate NUMERIC;
    v_threshold NUMERIC;
BEGIN
    -- Get window from settings
    SELECT alert_window_minutes INTO v_window_mins FROM public.webhook_settings LIMIT 1;
    v_window_mins := COALESCE(v_window_mins, 60);

    -- Record the alert occurrence
    INSERT INTO public.webhook_alerts (alert_type, message, count, last_occurrence, severity)
    VALUES (p_type, p_message, 1, now(), p_severity)
    ON CONFLICT (alert_type) DO UPDATE SET
        count = webhook_alerts.count + 1,
        message = p_message,
        last_occurrence = now(),
        severity = COALESCE(p_severity, webhook_alerts.severity);

    -- Check rates to see if we should elevate severity or notify
    SELECT count(*) INTO v_total_logs 
    FROM public.webhook_logs 
    WHERE created_at > now() - (v_window_mins || ' minutes')::interval;

    IF v_total_logs > 10 THEN
        IF p_type = 'timeout' THEN
            SELECT alert_threshold_timeout INTO v_threshold FROM public.webhook_settings LIMIT 1;
            SELECT count(*) INTO v_error_logs 
            FROM public.webhook_logs 
            WHERE status = 'failed' AND (error_message ILIKE '%timeout%' OR error_message ILIKE '%deadline%')
            AND created_at > now() - (v_window_mins || ' minutes')::interval;
        ELSIF p_type = 'invalid_signature' THEN
            SELECT alert_threshold_invalid_sig INTO v_threshold FROM public.webhook_settings LIMIT 1;
            SELECT count(*) INTO v_error_logs 
            FROM public.webhook_logs 
            WHERE status = 'failed' AND (error_message ILIKE '%signature%' OR error_message ILIKE '%unauthorized%')
            AND created_at > now() - (v_window_mins || ' minutes')::interval;
        END IF;

        IF v_threshold IS NOT NULL AND v_total_logs > 0 THEN
            v_error_rate := v_error_logs::NUMERIC / v_total_logs::NUMERIC;
            IF v_error_rate >= v_threshold THEN
                UPDATE public.webhook_alerts 
                SET severity = 'critical',
                    message = 'CRITICAL RATE EXCEEDED: ' || message
                WHERE alert_type = p_type;
            END IF;
        END IF;
    END IF;
END;
$$;
