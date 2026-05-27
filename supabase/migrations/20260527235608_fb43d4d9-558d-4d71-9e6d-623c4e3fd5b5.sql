
-- 1. Fix community_posts UPDATE
DROP POLICY IF EXISTS "Users can update own posts" ON public.community_posts;
CREATE POLICY "Users can update own posts"
ON public.community_posts
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND (status IS NULL OR status = 'pending')
);

-- 2. SEO settings: drop existing public view if any, then recreate with safe columns only
DROP VIEW IF EXISTS public.public_seo_settings CASCADE;
DROP POLICY IF EXISTS "Public can view SEO settings" ON public.seo_settings;
DROP POLICY IF EXISTS "Public can read safe seo columns" ON public.seo_settings;

CREATE VIEW public.public_seo_settings AS
SELECT
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
FROM public.seo_settings;

GRANT SELECT ON public.public_seo_settings TO anon, authenticated;

-- 3. Lock down intelligent_notification_logs INSERT
DROP POLICY IF EXISTS "Service role can insert notification logs" ON public.intelligent_notification_logs;
CREATE POLICY "Service role can insert notification logs"
ON public.intelligent_notification_logs
FOR INSERT
TO public
WITH CHECK (
  auth.role() = 'service_role'
  OR auth_internal.has_role(auth.uid(), 'admin'::app_role)
);
