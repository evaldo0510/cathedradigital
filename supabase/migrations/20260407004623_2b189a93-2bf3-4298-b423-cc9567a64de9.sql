-- Ensure notifications table is in the Realtime publication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
END $$;

-- Enable RLS on the realtime.messages table if not already enabled
-- Note: the 'realtime' schema and its tables are managed by the Supabase Realtime extension
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- Add policy to restrict channel (topic) subscription to the user's own channel
-- This prevents any authenticated user from joining another user's notification channel
CREATE POLICY "Users can only subscribe to their own notification channel"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
    topic = 'user-notifications-' || (SELECT auth.uid())::text
);