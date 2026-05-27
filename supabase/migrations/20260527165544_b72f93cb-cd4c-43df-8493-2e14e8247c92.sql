
-- 1. Fix legacy profiles.role admin checks → use auth_internal.has_role
-- theme_contents
DROP POLICY IF EXISTS "Admins can manage theme contents" ON public.theme_contents;
CREATE POLICY "Admins can manage theme contents"
ON public.theme_contents
FOR ALL
TO authenticated
USING (auth_internal.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (auth_internal.has_role(auth.uid(), 'admin'::app_role));

-- visual_regression_runs
DROP POLICY IF EXISTS "Admins can view visual regression runs" ON public.visual_regression_runs;
DROP POLICY IF EXISTS "Admins can insert/update visual regression runs" ON public.visual_regression_runs;
CREATE POLICY "Admins can manage visual regression runs"
ON public.visual_regression_runs
FOR ALL
TO authenticated
USING (auth_internal.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (auth_internal.has_role(auth.uid(), 'admin'::app_role));

-- visual_regression_snapshots
DROP POLICY IF EXISTS "Admins can view visual regression snapshots" ON public.visual_regression_snapshots;
DROP POLICY IF EXISTS "Admins can insert/update visual regression snapshots" ON public.visual_regression_snapshots;
CREATE POLICY "Admins can manage visual regression snapshots"
ON public.visual_regression_snapshots
FOR ALL
TO authenticated
USING (auth_internal.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (auth_internal.has_role(auth.uid(), 'admin'::app_role));

-- storage.objects: replace legacy admin policies
DROP POLICY IF EXISTS "Admins can read all avatars" ON storage.objects;
CREATE POLICY "Admins can read all avatars"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'avatars' AND auth_internal.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can read all public-assets" ON storage.objects;
CREATE POLICY "Admins can read all public-assets"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'public-assets' AND auth_internal.has_role(auth.uid(), 'admin'::app_role));

-- 2. public-assets: explicit admin-only write policies
CREATE POLICY "Admins can insert public-assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'public-assets' AND auth_internal.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update public-assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'public-assets' AND auth_internal.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'public-assets' AND auth_internal.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete public-assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'public-assets' AND auth_internal.has_role(auth.uid(), 'admin'::app_role));

-- 3. analytics_events: revoke anon, allow users to read own events
REVOKE INSERT ON public.analytics_events FROM anon;
REVOKE ALL ON public.analytics_events FROM anon;

DROP POLICY IF EXISTS "Users can view their own analytics events" ON public.analytics_events;
CREATE POLICY "Users can view their own analytics events"
ON public.analytics_events
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 4. Validate GA4 measurement ID format on the server side
ALTER TABLE public.seo_settings
DROP CONSTRAINT IF EXISTS seo_settings_ga4_format_chk;

ALTER TABLE public.seo_settings
ADD CONSTRAINT seo_settings_ga4_format_chk
CHECK (ga4_measurement_id IS NULL OR ga4_measurement_id ~ '^G-[A-Z0-9]{4,20}$');
