
-- Revoke the over-broad SELECT we accidentally added
DROP POLICY IF EXISTS "Public can read seo settings via view" ON public.seo_settings;

-- Base table seo_settings now has only admin policies (admins manage SEO settings)
-- Switch view back to security definer so anon/auth can read the safe columns through it
ALTER VIEW public.public_seo_settings SET (security_invoker = false);

-- Ensure grants remain
GRANT SELECT ON public.public_seo_settings TO anon, authenticated;
