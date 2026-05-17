-- Fix search path
ALTER FUNCTION public.handle_new_profile_private() SET search_path = public;

-- Revoke execute from public
REVOKE EXECUTE ON FUNCTION public.handle_new_profile_private() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_profile_private() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_profile_private() FROM authenticated;
