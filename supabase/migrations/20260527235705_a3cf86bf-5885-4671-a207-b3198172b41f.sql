
-- Switch view back to security_invoker
ALTER VIEW public.public_seo_settings SET (security_invoker = true);

-- Add SELECT policy to base table for anon/auth, but revoke column access on sensitive columns
CREATE POLICY "Public can read non-sensitive seo settings"
ON public.seo_settings
FOR SELECT
TO anon, authenticated
USING (true);

-- Revoke all SELECT first, then grant only safe columns to anon/auth
REVOKE SELECT ON public.seo_settings FROM anon, authenticated;

GRANT SELECT (
  id,
  site_title,
  site_description,
  site_keywords,
  og_image_url,
  twitter_handle,
  json_ld_schema,
  business_name,
  business_address,
  business_phone,
  business_email,
  business_whatsapp,
  opening_hours,
  latitude,
  longitude,
  google_maps_url,
  created_at,
  updated_at
) ON public.seo_settings TO anon, authenticated;

-- Admins keep full access via existing admin policies and service_role
GRANT ALL ON public.seo_settings TO service_role;
