-- Revoke execute from anon for core role checks
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.sync_content_tags_to_array() FROM PUBLIC, anon, authenticated;

-- Ensure authenticated users can still check their own roles (needed for some RLS)
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
