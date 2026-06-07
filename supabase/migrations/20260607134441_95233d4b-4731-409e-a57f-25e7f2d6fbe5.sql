-- Definitively revoke EXECUTE from PUBLIC for these functions
-- Using REVOKE ALL ON FUNCTION to be thorough

REVOKE ALL ON FUNCTION public.log_security_event(text, text, text, jsonb) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_security_event(text, text, text, jsonb) TO service_role;

REVOKE ALL ON FUNCTION public.log_bible_audit_action(text, text, text, jsonb) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_bible_audit_action(text, text, text, jsonb) TO service_role;
-- If this was meant for authenticated users to log their own actions, we'd add it back, 
-- but usually audit logging should be done via service_role or triggers.

REVOKE ALL ON FUNCTION public.log_security_policy_change(text, text, jsonb, uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_security_policy_change(text, text, jsonb, uuid) TO service_role;

REVOKE ALL ON FUNCTION public.generate_security_diff_summary(jsonb, jsonb) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_security_diff_summary(jsonb, jsonb) TO service_role;

REVOKE ALL ON FUNCTION public.purge_user_bible_cache(uuid, text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_user_bible_cache(uuid, text) TO service_role;

REVOKE ALL ON FUNCTION public.version_bible_audit_notification() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.version_bible_audit_notification() TO service_role;

-- Double checking some others that might still have public access
REVOKE ALL ON FUNCTION public.is_current_user_admin() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.log_access_denial(text, text, jsonb) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.log_access_denial(text, text, jsonb) TO authenticated, service_role;
