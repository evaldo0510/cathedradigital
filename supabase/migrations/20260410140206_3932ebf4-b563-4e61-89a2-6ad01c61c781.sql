-- Add notification settings and tracking to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS push_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_action_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create table for intelligent notification logs
CREATE TABLE IF NOT EXISTS public.intelligent_notification_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'post_reflection', 'inactivity_24h', 'inactivity_48h', 'progress'
    channel TEXT NOT NULL, -- 'push', 'whatsapp'
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'sent', -- 'sent', 'failed', 'ignored'
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    metadata JSONB DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE public.intelligent_notification_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own notification logs" 
ON public.intelligent_notification_logs 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Index for frequency control and inactivity checks
CREATE INDEX idx_notification_logs_user_type_sent ON public.intelligent_notification_logs(user_id, type, sent_at DESC);
CREATE INDEX idx_profiles_last_action ON public.profiles(last_action_at);

-- Trigger to update last_action_at on user history or journal entries
CREATE OR REPLACE FUNCTION public.update_last_action_at()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles 
    SET last_action_at = now() 
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to tables that represent activity
DROP TRIGGER IF EXISTS tr_update_last_action_history ON public.user_history;
CREATE TRIGGER tr_update_last_action_history
AFTER INSERT ON public.user_history
FOR EACH ROW EXECUTE FUNCTION public.update_last_action_at();

DROP TRIGGER IF EXISTS tr_update_last_action_journal ON public.spiritual_journal;
CREATE TRIGGER tr_update_last_action_journal
AFTER INSERT ON public.spiritual_journal
FOR EACH ROW EXECUTE FUNCTION public.update_last_action_at();

DROP TRIGGER IF EXISTS tr_update_last_action_progress ON public.journey_progress;
CREATE TRIGGER tr_update_last_action_progress
AFTER INSERT ON public.journey_progress
FOR EACH ROW EXECUTE FUNCTION public.update_last_action_at();
