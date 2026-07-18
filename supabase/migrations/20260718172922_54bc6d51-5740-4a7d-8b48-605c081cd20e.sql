REVOKE EXECUTE ON FUNCTION public.is_current_user_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION auth_internal.is_admin() FROM anon;
REVOKE USAGE ON SCHEMA auth_internal FROM anon;