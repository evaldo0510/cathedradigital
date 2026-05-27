
-- Harden admin checks: replace profiles.role='admin' with auth_internal.has_role()

-- analytics_events
DROP POLICY IF EXISTS "Admins can view all analytics" ON public.analytics_events;
CREATE POLICY "Admins can view all analytics" ON public.analytics_events
FOR SELECT TO authenticated
USING (auth_internal.has_role(auth.uid(), 'admin'::app_role));

-- audit_logs
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
FOR SELECT TO authenticated
USING (auth_internal.has_role(auth.uid(), 'admin'::app_role));

-- coming_soon_leads
DROP POLICY IF EXISTS "Admins can view leads" ON public.coming_soon_leads;
CREATE POLICY "Admins can view leads" ON public.coming_soon_leads
FOR SELECT TO authenticated
USING (auth_internal.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Anyone can register interest" ON public.coming_soon_leads;
CREATE POLICY "Anyone can register interest" ON public.coming_soon_leads
FOR INSERT TO anon, authenticated
WITH CHECK (
  email IS NOT NULL
  AND length(trim(email)) > 3
  AND length(email) <= 255
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
);

-- seo_audits
DROP POLICY IF EXISTS "Admins can manage seo_audits" ON public.seo_audits;
CREATE POLICY "Admins can manage seo_audits" ON public.seo_audits
FOR ALL TO authenticated
USING (auth_internal.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (auth_internal.has_role(auth.uid(), 'admin'::app_role));

-- seo_corrections
DROP POLICY IF EXISTS "Admins can manage seo_corrections" ON public.seo_corrections;
CREATE POLICY "Admins can manage seo_corrections" ON public.seo_corrections
FOR ALL TO authenticated
USING (auth_internal.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (auth_internal.has_role(auth.uid(), 'admin'::app_role));

-- seo_settings (drop redundant duplicate policy)
DROP POLICY IF EXISTS "Admins can manage seo_settings" ON public.seo_settings;
DROP POLICY IF EXISTS "Public can view seo_settings" ON public.seo_settings;

-- construction_data
DROP POLICY IF EXISTS "Admins can do everything on construction_data" ON public.construction_data;
CREATE POLICY "Admins can do everything on construction_data" ON public.construction_data
FOR ALL TO authenticated
USING (auth_internal.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (auth_internal.has_role(auth.uid(), 'admin'::app_role));

-- construction_projects
DROP POLICY IF EXISTS "Admins can do everything on construction_projects" ON public.construction_projects;
CREATE POLICY "Admins can do everything on construction_projects" ON public.construction_projects
FOR ALL TO authenticated
USING (auth_internal.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (auth_internal.has_role(auth.uid(), 'admin'::app_role));

-- themes / theme_contents / visual_regression_* (if exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='themes') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage themes" ON public.themes';
    EXECUTE 'CREATE POLICY "Admins can manage themes" ON public.themes FOR ALL TO authenticated USING (auth_internal.has_role(auth.uid(), ''admin''::app_role)) WITH CHECK (auth_internal.has_role(auth.uid(), ''admin''::app_role))';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='theme_contents') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage theme_contents" ON public.theme_contents';
    EXECUTE 'CREATE POLICY "Admins can manage theme_contents" ON public.theme_contents FOR ALL TO authenticated USING (auth_internal.has_role(auth.uid(), ''admin''::app_role)) WITH CHECK (auth_internal.has_role(auth.uid(), ''admin''::app_role))';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='visual_regression_runs') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage visual_regression_runs" ON public.visual_regression_runs';
    EXECUTE 'CREATE POLICY "Admins can manage visual_regression_runs" ON public.visual_regression_runs FOR ALL TO authenticated USING (auth_internal.has_role(auth.uid(), ''admin''::app_role)) WITH CHECK (auth_internal.has_role(auth.uid(), ''admin''::app_role))';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='visual_regression_snapshots') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage visual_regression_snapshots" ON public.visual_regression_snapshots';
    EXECUTE 'CREATE POLICY "Admins can manage visual_regression_snapshots" ON public.visual_regression_snapshots FOR ALL TO authenticated USING (auth_internal.has_role(auth.uid(), ''admin''::app_role)) WITH CHECK (auth_internal.has_role(auth.uid(), ''admin''::app_role))';
  END IF;
END $$;
