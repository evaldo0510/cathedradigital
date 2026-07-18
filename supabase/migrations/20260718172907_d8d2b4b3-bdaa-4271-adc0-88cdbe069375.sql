GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated, anon;
GRANT USAGE ON SCHEMA auth_internal TO authenticated, anon;
GRANT EXECUTE ON FUNCTION auth_internal.is_admin() TO authenticated, anon;