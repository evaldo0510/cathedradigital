-- 1. Add Local SEO fields to seo_settings
ALTER TABLE public.seo_settings 
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS business_address TEXT,
ADD COLUMN IF NOT EXISTS business_phone TEXT,
ADD COLUMN IF NOT EXISTS business_whatsapp TEXT,
ADD COLUMN IF NOT EXISTS business_email TEXT,
ADD COLUMN IF NOT EXISTS google_maps_url TEXT,
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS opening_hours TEXT;

-- 2. Fix SECURITY DEFINER functions in public schema
-- Revoke execute from public for all Security Definer functions
REVOKE EXECUTE ON FUNCTION public.update_last_action_at() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_profile_security() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.prevent_role_escalation() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_admin_role_from_profile() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_last_action_at_from_metrics() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_update_own_profile(uuid, text, boolean, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_content_tags_to_array() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;

-- Grant execute to authenticated and postgres roles only
GRANT EXECUTE ON FUNCTION public.update_last_action_at() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.enforce_profile_security() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.prevent_role_escalation() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sync_admin_role_from_profile() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_last_action_at_from_metrics() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_update_own_profile(uuid, text, boolean, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sync_content_tags_to_array() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

-- 3. Ensure search_path is set for all functions
ALTER FUNCTION public.update_last_action_at() SET search_path = public;
ALTER FUNCTION public.enforce_profile_security() SET search_path = public;
ALTER FUNCTION public.prevent_role_escalation() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.sync_admin_role_from_profile() SET search_path = public;
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = public;
ALTER FUNCTION public.update_last_action_at_from_metrics() SET search_path = public;
ALTER FUNCTION public.can_update_own_profile(uuid, text, boolean, text) SET search_path = public;
ALTER FUNCTION public.sync_content_tags_to_array() SET search_path = public;
ALTER FUNCTION public.is_admin() SET search_path = public;
ALTER FUNCTION public.handle_updated_at() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.update_last_updated_column() SET search_path = public;
ALTER FUNCTION public.handle_user_visit() SET search_path = public;
