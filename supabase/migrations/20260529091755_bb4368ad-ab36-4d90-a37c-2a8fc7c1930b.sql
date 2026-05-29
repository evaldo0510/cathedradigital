-- Stop exposing GA4 measurement ID and GSC verification code via direct table read
DROP POLICY IF EXISTS "Public can read non-sensitive seo settings" ON public.seo_settings;
REVOKE SELECT ON public.seo_settings FROM anon, authenticated;

-- Re-grant SELECT to authenticated only on the safe columns covered by the public view
-- (admins still have full access via the ALL policies and service_role)
GRANT SELECT (
  id, site_title, site_description, site_keywords,
  og_image_url, twitter_handle, json_ld_schema,
  business_name, business_address, business_phone, business_email,
  business_whatsapp, opening_hours, latitude, longitude, google_maps_url,
  created_at, updated_at
) ON public.seo_settings TO anon, authenticated;

-- Ensure the public view bypasses RLS via security definer semantics so safe columns
-- remain reachable for unauthenticated visitors
ALTER VIEW public.public_seo_settings SET (security_invoker = false);
GRANT SELECT ON public.public_seo_settings TO anon, authenticated;