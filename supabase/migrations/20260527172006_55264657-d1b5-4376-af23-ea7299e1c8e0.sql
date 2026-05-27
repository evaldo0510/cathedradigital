
-- 1. seo_settings: remove public SELECT, expose safe fields via view
DROP POLICY IF EXISTS "Public can view seo_settings" ON public.seo_settings;
DROP POLICY IF EXISTS "Anyone can view seo settings" ON public.seo_settings;
DROP POLICY IF EXISTS "SEO settings are viewable by everyone" ON public.seo_settings;
DROP POLICY IF EXISTS "Public can read seo_settings" ON public.seo_settings;

CREATE OR REPLACE VIEW public.public_seo_settings
WITH (security_invoker = true) AS
SELECT
  id,
  site_title,
  site_description,
  site_keywords,
  og_image_url,
  ga4_measurement_id,
  gsc_verification_code,
  json_ld_schema,
  twitter_handle,
  business_name,
  opening_hours,
  latitude,
  longitude,
  google_maps_url,
  created_at,
  updated_at
FROM public.seo_settings;

-- Ensure admin-only policy exists on base table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'seo_settings'
      AND policyname = 'Admins can manage seo_settings'
  ) THEN
    CREATE POLICY "Admins can manage seo_settings" ON public.seo_settings
      FOR ALL TO authenticated
      USING (auth_internal.has_role(auth.uid(), 'admin'::app_role))
      WITH CHECK (auth_internal.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- A permissive policy required so view (security_invoker) can read for anon/authenticated
-- We need to allow read on the base table for the view; but we want to hide contact PII.
-- Solution: use SECURITY DEFINER view instead to bypass RLS, and grant select on view only.
DROP VIEW IF EXISTS public.public_seo_settings;
CREATE VIEW public.public_seo_settings AS
SELECT
  id,
  site_title,
  site_description,
  site_keywords,
  og_image_url,
  ga4_measurement_id,
  gsc_verification_code,
  json_ld_schema,
  twitter_handle,
  business_name,
  opening_hours,
  latitude,
  longitude,
  google_maps_url,
  created_at,
  updated_at
FROM public.seo_settings;

GRANT SELECT ON public.public_seo_settings TO anon, authenticated;

-- 2. app_metrics: restrict INSERT to admins only
DROP POLICY IF EXISTS "Authenticated users can create app metrics" ON public.app_metrics;
CREATE POLICY "Admins can create app metrics" ON public.app_metrics
  FOR INSERT TO authenticated
  WITH CHECK (auth_internal.is_admin());

-- 3. catechism_cache: drop duplicate policy
DROP POLICY IF EXISTS "Anyone can select cache" ON public.catechism_cache;
