CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth_internal
AS $$
  SELECT COALESCE(auth_internal.is_admin(), false);
$$;

GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_current_user_admin() FROM anon;