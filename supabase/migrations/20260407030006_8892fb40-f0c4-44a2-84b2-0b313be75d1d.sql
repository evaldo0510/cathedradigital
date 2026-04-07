-- Update app_metrics insert policy to allow anyone to track visits/downloads
DROP POLICY IF EXISTS "Authenticated users can create app metrics" ON public.app_metrics;
CREATE POLICY "Anyone can create app metrics" 
ON public.app_metrics 
FOR INSERT 
WITH CHECK (true);

-- Ensure admin access is robust
DROP POLICY IF EXISTS "Admins can view all metrics" ON public.app_metrics;
CREATE POLICY "Admins can view all metrics"
ON public.app_metrics
FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
