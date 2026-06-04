-- 1. Add retry columns to webhook_logs
ALTER TABLE public.webhook_logs 
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_retry_at TIMESTAMP WITH TIME ZONE;

-- 2. Create webhook_settings table
CREATE TABLE IF NOT EXISTS public.webhook_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_threshold_timeout NUMERIC DEFAULT 0.1, -- 10%
    alert_threshold_invalid_sig NUMERIC DEFAULT 0.05, -- 5%
    alert_window_minutes INTEGER DEFAULT 60,
    max_retries INTEGER DEFAULT 5,
    retry_backoff_factor NUMERIC DEFAULT 2.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default settings if not exists
INSERT INTO public.webhook_settings (id)
SELECT gen_random_uuid()
WHERE NOT EXISTS (SELECT 1 FROM public.webhook_settings);

-- 3. Update track_webhook_alert to handle settings-based alerting (advanced)
CREATE OR REPLACE FUNCTION public.track_webhook_alert(p_type TEXT, p_message TEXT)
RETURNS VOID AS $$
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
    INSERT INTO public.webhook_alerts (alert_type, message, count, last_occurrence)
    VALUES (p_type, p_message, 1, now())
    ON CONFLICT (alert_type) DO UPDATE SET
        count = webhook_alerts.count + 1,
        message = p_message,
        last_occurrence = now();

    -- Check rates to see if we should elevate severity or notify
    SELECT count(*) INTO v_total_logs 
    FROM public.webhook_logs 
    WHERE created_at > now() - (v_window_mins || ' minutes')::interval;

    IF v_total_logs > 10 THEN
        IF p_type = 'timeout' THEN
            SELECT alert_threshold_timeout INTO v_threshold FROM public.webhook_settings LIMIT 1;
            SELECT count(*) INTO v_error_logs 
            FROM public.webhook_logs 
            WHERE status = 'failed' AND error_message ILIKE '%timeout%'
            AND created_at > now() - (v_window_mins || ' minutes')::interval;
        ELSIF p_type = 'invalid_signature' THEN
            SELECT alert_threshold_invalid_sig INTO v_threshold FROM public.webhook_settings LIMIT 1;
            SELECT count(*) INTO v_error_logs 
            FROM public.webhook_logs 
            WHERE status = 'failed' AND error_message ILIKE '%signature%'
            AND created_at > now() - (v_window_mins || ' minutes')::interval;
        END IF;

        IF v_threshold IS NOT NULL AND v_total_logs > 0 THEN
            v_error_rate := v_error_logs::NUMERIC / v_total_logs::NUMERIC;
            IF v_error_rate >= v_threshold THEN
                UPDATE public.webhook_alerts 
                SET message = 'CRITICAL RATE EXCEEDED: ' || message
                WHERE alert_type = p_type;
            END IF;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RPC to fetch pending retries
CREATE OR REPLACE FUNCTION public.get_pending_webhook_retries()
RETURNS SETOF public.webhook_logs AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM public.webhook_logs
    WHERE status IN ('failed', 'pending')
    AND retry_count < (SELECT max_retries FROM public.webhook_settings LIMIT 1)
    AND (next_retry_at IS NULL OR next_retry_at <= now())
    ORDER BY created_at ASC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Permissions
GRANT ALL ON public.webhook_settings TO service_role;
GRANT SELECT, UPDATE ON public.webhook_settings TO authenticated;
GRANT ALL ON public.webhook_logs TO service_role;
GRANT SELECT, UPDATE ON public.webhook_logs TO authenticated;
GRANT ALL ON public.webhook_alerts TO service_role;
GRANT SELECT ON public.webhook_alerts TO authenticated;

ALTER TABLE public.webhook_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage settings" 
ON public.webhook_settings 
FOR ALL 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
