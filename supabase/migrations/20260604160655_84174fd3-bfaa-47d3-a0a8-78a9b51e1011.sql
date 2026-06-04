-- Add retry_count to webhook_logs
ALTER TABLE public.webhook_logs ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- Create table for webhook alerts
CREATE TABLE IF NOT EXISTS public.webhook_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type TEXT NOT NULL, -- 'timeout', 'invalid_signature', 'db_error'
    message TEXT NOT NULL,
    count INTEGER DEFAULT 1,
    last_occurrence TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Grant access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.webhook_alerts TO authenticated;
GRANT ALL ON public.webhook_alerts TO service_role;

ALTER TABLE public.webhook_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view alerts" ON public.webhook_alerts
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    ));

-- Add function to increment alert count
CREATE OR REPLACE FUNCTION public.track_webhook_alert(p_type TEXT, p_message TEXT)
RETURNS VOID AS $$
DECLARE
    v_alert_id UUID;
BEGIN
    -- Try to find an existing alert of the same type in the last hour to increment
    SELECT id INTO v_alert_id 
    FROM public.webhook_alerts 
    WHERE alert_type = p_type 
    AND last_occurrence > (now() - interval '1 hour')
    LIMIT 1;

    IF v_alert_id IS NOT NULL THEN
        UPDATE public.webhook_alerts 
        SET count = count + 1,
            last_occurrence = now(),
            message = p_message
        WHERE id = v_alert_id;
    ELSE
        INSERT INTO public.webhook_alerts (alert_type, message, last_occurrence, count)
        VALUES (p_type, p_message, now(), 1);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
