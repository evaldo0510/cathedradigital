-- Drop all versions
DROP FUNCTION IF EXISTS public.track_webhook_alert(text, text);
DROP FUNCTION IF EXISTS public.track_webhook_alert(text, text, text);
DROP FUNCTION IF EXISTS public.get_pending_webhook_retries();

-- Re-create
CREATE OR REPLACE FUNCTION public.track_webhook_alert(p_type TEXT, p_message TEXT, p_severity TEXT)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.webhook_alerts (alert_type, message, severity, count, last_occurrence)
    VALUES (p_type, p_message, p_severity, 1, NOW())
    ON CONFLICT (alert_type) DO UPDATE SET
        count = webhook_alerts.count + 1,
        message = EXCLUDED.message,
        severity = EXCLUDED.severity,
        last_occurrence = EXCLUDED.last_occurrence;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_pending_webhook_retries()
RETURNS TABLE (
    id UUID,
    event_id TEXT,
    payload JSONB,
    retry_count INT,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT wl.id, wl.event_id, wl.payload, wl.retry_count, wl.status
    FROM public.webhook_logs wl
    WHERE wl.status = 'failed'
      AND wl.next_retry_at <= NOW()
      AND wl.retry_count < COALESCE((SELECT max_retries FROM public.webhook_settings LIMIT 1), 5)
    ORDER BY wl.next_retry_at ASC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Settings
INSERT INTO public.webhook_settings (id, max_retries, retry_backoff_factor, alert_threshold_timeout, alert_threshold_invalid_sig, alert_window_minutes)
VALUES (gen_random_uuid(), 5, 2, 0.05, 0.01, 60)
ON CONFLICT DO NOTHING;

-- Policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Admins can manage webhook settings" ON public.webhook_settings;
    DROP POLICY IF EXISTS "Admins can view webhook alerts" ON public.webhook_alerts;
    DROP POLICY IF EXISTS "Users can view their own webhook logs" ON public.webhook_logs;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Admins can manage webhook settings" ON public.webhook_settings
    FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can view webhook alerts" ON public.webhook_alerts
    FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can view their own webhook logs" ON public.webhook_logs
    FOR SELECT TO authenticated USING (
        (payload->>'external_reference' = auth.uid()::text) OR 
        (payload->>'userId' = auth.uid()::text) OR
        (payload->'data'->>'external_reference' = auth.uid()::text) OR
        (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
    );

GRANT ALL ON public.webhook_logs TO service_role;
GRANT ALL ON public.webhook_alerts TO service_role;
GRANT ALL ON public.webhook_settings TO service_role;
GRANT EXECUTE ON FUNCTION public.track_webhook_alert TO service_role;
GRANT EXECUTE ON FUNCTION public.get_pending_webhook_retries TO service_role;
