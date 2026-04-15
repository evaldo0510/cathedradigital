
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow service role to insert saints" ON public.saints;
DROP POLICY IF EXISTS "Allow service role to update saints" ON public.saints;
DROP POLICY IF EXISTS "Allow service role to delete saints" ON public.saints;

-- Create more secure policies
CREATE POLICY "Allow service role to insert saints" ON public.saints
FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Allow service role to update saints" ON public.saints
FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role to delete saints" ON public.saints
FOR DELETE USING (auth.role() = 'service_role');
