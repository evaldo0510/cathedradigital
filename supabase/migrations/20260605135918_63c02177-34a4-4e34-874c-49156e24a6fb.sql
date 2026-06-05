-- Add columns to bible_audit_webhook_deliveries
ALTER TABLE public.bible_audit_webhook_deliveries 
ADD COLUMN IF NOT EXISTS verification_details JSONB,
ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

-- Add versioning to bible_audit_notifications
ALTER TABLE public.bible_audit_notifications 
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_latest BOOLEAN DEFAULT TRUE;

-- Create a table for historical versions of notification configurations
CREATE TABLE IF NOT EXISTS public.bible_audit_notification_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID REFERENCES public.bible_audit_notifications(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    channel TEXT,
    target TEXT,
    priority TEXT,
    rules JSONB,
    retry_config JSONB,
    headers JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bible_audit_notification_versions TO authenticated;
GRANT ALL ON public.bible_audit_notification_versions TO service_role;

ALTER TABLE public.bible_audit_notification_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all notification versions" 
ON public.bible_audit_notification_versions FOR SELECT 
TO authenticated 
USING (true);

-- Trigger to automatically version notifications on update
CREATE OR REPLACE FUNCTION public.version_bible_audit_notification() 
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.target IS DISTINCT FROM NEW.target OR 
        OLD.rules IS DISTINCT FROM NEW.rules OR 
        OLD.retry_config IS DISTINCT FROM NEW.retry_config OR 
        OLD.headers IS DISTINCT FROM NEW.headers) THEN
        
        -- Increment version
        NEW.version = OLD.version + 1;
        
        -- Insert old version into history
        INSERT INTO public.bible_audit_notification_versions (
            notification_id, version, channel, target, priority, rules, retry_config, headers, created_at
        ) VALUES (
            OLD.id, OLD.version, OLD.channel, OLD.target, OLD.priority, OLD.rules, OLD.retry_config, OLD.headers, OLD.updated_at
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER bible_audit_notification_versioning
BEFORE UPDATE ON public.bible_audit_notifications
FOR EACH ROW
EXECUTE FUNCTION public.version_bible_audit_notification();
