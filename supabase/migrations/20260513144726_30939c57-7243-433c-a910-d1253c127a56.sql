-- Drop the previous policy
DROP POLICY IF EXISTS "Authenticated users can insert analytics events" ON public.analytics_events;

-- Create a policy that checks ownership
CREATE POLICY "Users can insert their own analytics events" 
ON public.analytics_events 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);
