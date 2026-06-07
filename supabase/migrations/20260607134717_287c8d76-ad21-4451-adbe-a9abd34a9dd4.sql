-- Revogar EXECUTE de authenticated para as funções detectadas pelo linter
REVOKE EXECUTE ON FUNCTION public.verify_security_invariants() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_security_definer_privileges() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.run_manual_security_scan() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_current_user_admin() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.update_user_streak() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.log_access_denial(text, text, jsonb) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_profile_private() FROM authenticated;

-- Garantir acesso apenas via service_role para automações
GRANT EXECUTE ON FUNCTION public.verify_security_invariants() TO service_role;
GRANT EXECUTE ON FUNCTION public.audit_security_definer_privileges() TO service_role;
GRANT EXECUTE ON FUNCTION public.run_manual_security_scan() TO service_role;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO service_role;
GRANT EXECUTE ON FUNCTION public.update_user_streak() TO service_role;
GRANT EXECUTE ON FUNCTION public.log_access_denial(text, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_profile_private() TO service_role;
