-- 1. Create private schema for security functions
CREATE SCHEMA IF NOT EXISTS auth_internal;

-- 2. Create Security Definer functions in the private schema
CREATE OR REPLACE FUNCTION auth_internal.has_role(_user_id uuid, _role app_role)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND role = _role::text
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION auth_internal.is_admin()
RETURNS boolean AS $$
  SELECT auth_internal.has_role(auth.uid(), 'admin');
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION auth_internal.can_update_own_profile(_profile_id uuid, _role text, _is_premium boolean, _email text)
RETURNS boolean AS $$
  SELECT
    _profile_id = auth.uid()
    AND (
      auth_internal.has_role(auth.uid(), 'admin'::app_role) OR
      (
        _role IS NOT DISTINCT FROM (SELECT role FROM public.profiles WHERE id = _profile_id)
        AND _is_premium IS NOT DISTINCT FROM (SELECT is_premium FROM public.profiles WHERE id = _profile_id)
      )
    );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- 3. Update all RLS policies that used the public functions
-- We need to drop and recreate them to point to auth_internal

-- Profiles
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles" ON public.profiles
  TO authenticated USING (auth_internal.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated 
  USING (auth.uid() = id)
  WITH CHECK (auth_internal.can_update_own_profile(id, role, is_premium, NULL::text));

-- App Metrics
DROP POLICY IF EXISTS "Admins can view all metrics" ON public.app_metrics;
CREATE POLICY "Admins can view all metrics" ON public.app_metrics
  FOR SELECT TO authenticated USING (auth_internal.is_admin());

-- SEO Settings
DROP POLICY IF EXISTS "Admins can manage SEO settings" ON public.seo_settings;
CREATE POLICY "Admins can manage SEO settings" ON public.seo_settings
  FOR ALL TO authenticated USING (auth_internal.is_admin());

-- Site Keywords
DROP POLICY IF EXISTS "Admins can manage keywords" ON public.site_keywords;
CREATE POLICY "Admins can manage keywords" ON public.site_keywords
  FOR ALL TO authenticated USING (auth_internal.is_admin());

-- Community Posts (Admin manage)
DROP POLICY IF EXISTS "Admins can manage community_posts" ON public.community_posts;
CREATE POLICY "Admins can manage community_posts" ON public.community_posts
  FOR ALL TO authenticated USING (auth_internal.is_admin());

-- 4. Set search_path for ALL public functions to satisfy linter
DO $$
DECLARE
    func_record record;
BEGIN
    FOR func_record IN 
        SELECT p.proname, n.nspname, pg_get_function_identity_arguments(p.oid) as ident_args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
    LOOP
        EXECUTE format('ALTER FUNCTION %I.%I(%s) SET search_path = public', func_record.nspname, func_record.proname, func_record.ident_args);
    END LOOP;
END $$;

-- 5. Revoke execute from public for all SECURITY DEFINER functions in public schema
-- This is a fallback in case some were missed
DO $$
DECLARE
    func_record record;
BEGIN
    FOR func_record IN 
        SELECT p.proname, n.nspname, pg_get_function_identity_arguments(p.oid) as ident_args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.prosecdef = true
    LOOP
        EXECUTE format('REVOKE ALL ON FUNCTION %I.%I(%s) FROM PUBLIC', func_record.nspname, func_record.proname, func_record.ident_args);
    END LOOP;
END $$;

-- 6. Add local SEO fields to initial insert/update if possible
-- (Already added columns in previous step, ensuring they exist)
