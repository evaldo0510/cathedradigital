-- 1. Fix mutable search_path and execution permissions for SECURITY DEFINER functions

-- log_bible_audit_action
ALTER FUNCTION public.log_bible_audit_action(text, text, text, jsonb) SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.log_bible_audit_action(text, text, text, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.log_bible_audit_action(text, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_bible_audit_action(text, text, text, jsonb) TO service_role;

-- version_bible_audit_notification
ALTER FUNCTION public.version_bible_audit_notification() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.version_bible_audit_notification() FROM public;
GRANT EXECUTE ON FUNCTION public.version_bible_audit_notification() TO service_role;

-- generate_security_diff_summary
ALTER FUNCTION public.generate_security_diff_summary(jsonb, jsonb) SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.generate_security_diff_summary(jsonb, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.generate_security_diff_summary(jsonb, jsonb) TO service_role;

-- purge_user_bible_cache
ALTER FUNCTION public.purge_user_bible_cache(uuid, text) SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.purge_user_bible_cache(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.purge_user_bible_cache(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.purge_user_bible_cache(uuid, text) TO service_role;

-- 2. Restrict other SECURITY DEFINER functions that might be exposed to public

-- notify_admin_on_security_event
REVOKE EXECUTE ON FUNCTION public.notify_admin_on_security_event() FROM public;
GRANT EXECUTE ON FUNCTION public.notify_admin_on_security_event() TO service_role;

-- cleanup_telemetry_logs (both variants)
REVOKE EXECUTE ON FUNCTION public.cleanup_telemetry_logs() FROM public;
REVOKE EXECUTE ON FUNCTION public.cleanup_telemetry_logs(integer) FROM public;
GRANT EXECUTE ON FUNCTION public.cleanup_telemetry_logs() TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_telemetry_logs(integer) TO service_role;

-- log_access_denial
REVOKE EXECUTE ON FUNCTION public.log_access_denial(text, text, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.log_access_denial(text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_access_denial(text, text, jsonb) TO service_role;

-- track_webhook_alert
REVOKE EXECUTE ON FUNCTION public.track_webhook_alert(text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.track_webhook_alert(text, text, text) TO service_role;

-- get_pending_webhook_retries
REVOKE EXECUTE ON FUNCTION public.get_pending_webhook_retries() FROM public;
GRANT EXECUTE ON FUNCTION public.get_pending_webhook_retries() TO service_role;

-- log_security_policy_change
REVOKE EXECUTE ON FUNCTION public.log_security_policy_change(text, text, jsonb, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.log_security_policy_change(text, text, jsonb, uuid) TO service_role;

-- 3. Fix standard trigger functions (search_path only)
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.enforce_bible_language_pt() SET search_path = public;
