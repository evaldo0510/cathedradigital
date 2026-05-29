CREATE POLICY "Public can read safe seo columns"
ON public.seo_settings
FOR SELECT
TO anon, authenticated
USING (true);