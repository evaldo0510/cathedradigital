-- Corrigir search_path e permissões para as novas funções de auditoria

-- audit_security_definer_privileges
ALTER FUNCTION public.audit_security_definer_privileges() SET search_path = public;
REVOKE ALL ON FUNCTION public.audit_security_definer_privileges() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.audit_security_definer_privileges() TO service_role;

-- run_manual_security_scan
ALTER FUNCTION public.run_manual_security_scan() SET search_path = public;
REVOKE ALL ON FUNCTION public.run_manual_security_scan() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.run_manual_security_scan() TO service_role;

-- Garantir que is_current_user_admin está protegido
ALTER FUNCTION public.is_current_user_admin() SET search_path = public;
REVOKE ALL ON FUNCTION public.is_current_user_admin() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated, service_role;
