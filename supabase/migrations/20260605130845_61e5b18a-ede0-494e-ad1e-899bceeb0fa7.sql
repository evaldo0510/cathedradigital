-- Create action log table
CREATE TABLE IF NOT EXISTS public.bible_audit_action_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Update notifications table with security and retry fields
ALTER TABLE public.bible_audit_notifications 
ADD COLUMN IF NOT EXISTS secret_key TEXT DEFAULT encode(gen_random_bytes(32), 'hex'),
ADD COLUMN IF NOT EXISTS retry_config JSONB DEFAULT '{"max_retries": 3, "backoff": "exponential"}'::jsonb,
ADD COLUMN IF NOT EXISTS headers JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create detailed delivery history table
CREATE TABLE IF NOT EXISTS public.bible_audit_webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID REFERENCES public.bible_audit_notifications(id) ON DELETE CASCADE,
    alert_id UUID REFERENCES public.bible_audit_alerts(id) ON DELETE CASCADE,
    status_code INTEGER,
    request_payload JSONB,
    response_payload TEXT,
    duration_ms INTEGER,
    attempt_number INTEGER DEFAULT 1,
    error_message TEXT,
    delivered_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Update alerts to track notification status
ALTER TABLE public.bible_audit_alerts
ADD COLUMN IF NOT EXISTS notification_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- RLS Policies
ALTER TABLE public.bible_audit_action_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bible_audit_webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT, INSERT ON public.bible_audit_action_logs TO authenticated;
GRANT SELECT, INSERT ON public.bible_audit_webhook_deliveries TO authenticated;
GRANT ALL ON public.bible_audit_action_logs TO service_role;
GRANT ALL ON public.bible_audit_webhook_deliveries TO service_role;

-- Policies for Action Logs
CREATE POLICY "Users can view action logs" ON public.bible_audit_action_logs
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policies for Webhook Deliveries
CREATE POLICY "Users can view delivery history" ON public.bible_audit_webhook_deliveries
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create function to log actions automatically if needed, or just insert from frontend
CREATE OR REPLACE FUNCTION public.log_bible_audit_action(
    p_action TEXT,
    p_entity_type TEXT DEFAULT NULL,
    p_entity_id TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.bible_audit_action_logs (user_id, action, entity_type, entity_id, metadata)
    VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_metadata)
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
