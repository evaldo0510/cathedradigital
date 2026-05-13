-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can insert analytics events" ON public.analytics_events;

-- Create a more secure policy that requires authentication
CREATE POLICY "Authenticated users can insert analytics events" 
ON public.analytics_events 
FOR INSERT 
TO authenticated
WITH CHECK (true);
