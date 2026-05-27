
ALTER VIEW public.public_seo_settings SET (security_invoker = true);

-- Since view uses invoker security, base table needs a SELECT policy allowing reads.
-- Add a permissive SELECT policy on base table - the view only exposes safe columns to anon/auth.
CREATE POLICY "Public can read seo settings via view"
ON public.seo_settings
FOR SELECT
TO anon, authenticated
USING (true);
