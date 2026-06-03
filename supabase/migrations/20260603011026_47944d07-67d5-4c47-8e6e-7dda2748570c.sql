-- Refinamento de segurança para funções SECURITY DEFINER restantes
REVOKE EXECUTE ON FUNCTION public.is_current_user_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_current_user_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_current_user_admin() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_profile_private() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_profile_private() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_profile_private() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_profile_private() TO service_role;

-- handle_new_profile_private é geralmente um gatilho para auth.users.
-- O papel service_role e o superusuário postgres podem executá-lo.
