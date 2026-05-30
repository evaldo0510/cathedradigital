-- 1) Remove the permissive public SELECT policy on seo_settings to stop leaking GA4 / GSC credentials.
DROP POLICY IF EXISTS "Public can read safe seo columns" ON public.seo_settings;

-- 2) Tighten partners ALL policy to the authenticated role to remove ambiguity
--    around the implicit `public` role (which includes anon).
DROP POLICY IF EXISTS "Admins can manage partners" ON public.partners;
CREATE POLICY "Admins can manage partners"
ON public.partners
AS PERMISSIVE
FOR ALL
TO authenticated
USING (auth_internal.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (auth_internal.has_role(auth.uid(), 'admin'::app_role));