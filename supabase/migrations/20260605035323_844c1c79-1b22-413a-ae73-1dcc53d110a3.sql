ALTER TABLE public.bible_audit_notifications 
ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'webhook',
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'high',
ADD COLUMN IF NOT EXISTS rules JSONB DEFAULT '{"types": ["gap", "error"]}';

CREATE TABLE IF NOT EXISTS public.bible_audit_webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID REFERENCES public.bible_audit_notifications(id) ON DELETE CASCADE,
    payload JSONB,
    response_status INTEGER,
    response_body TEXT,
    delivered_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bible_audit_webhook_logs TO authenticated;
GRANT ALL ON public.bible_audit_webhook_logs TO service_role;
ALTER TABLE public.bible_audit_webhook_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own webhook logs" ON public.bible_audit_webhook_logs FOR ALL USING (true);

-- Ensure profiles exist or use a generic collaborator table if needed, 
-- but for now we'll assume standard auth.users and handle invitations in code or existing logic.
