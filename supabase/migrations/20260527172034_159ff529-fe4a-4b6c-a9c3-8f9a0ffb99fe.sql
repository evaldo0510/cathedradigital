
-- Recreate view with security_invoker so it uses caller's permissions
DROP VIEW IF EXISTS public.public_seo_settings;
CREATE VIEW public.public_seo_settings
WITH (security_invoker = true) AS
SELECT
  id, site_title, site_description, site_keywords, og_image_url,
  ga4_measurement_id, gsc_verification_code, json_ld_schema, twitter_handle,
  business_name, opening_hours, latitude, longitude, google_maps_url,
  created_at, updated_at
FROM public.seo_settings;

GRANT SELECT ON public.public_seo_settings TO anon, authenticated;

-- Allow row visibility via RLS, but restrict columns via grants
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='seo_settings'
      AND policyname='Public can read safe seo columns'
  ) THEN
    CREATE POLICY "Public can read safe seo columns" ON public.seo_settings
      FOR SELECT TO anon, authenticated
      USING (true);
  END IF;
END $$;

-- Column-level restriction: revoke broad SELECT, grant only safe columns
REVOKE SELECT ON public.seo_settings FROM anon, authenticated;
GRANT SELECT (
  id, site_title, site_description, site_keywords, og_image_url,
  ga4_measurement_id, gsc_verification_code, json_ld_schema, twitter_handle,
  business_name, opening_hours, latitude, longitude, google_maps_url,
  created_at, updated_at
) ON public.seo_settings TO anon, authenticated;
