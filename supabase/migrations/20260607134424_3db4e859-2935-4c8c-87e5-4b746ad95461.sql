-- Revoke execute from public (which includes anon and authenticated) for remaining security definer functions

-- log_security_event
REVOKE EXECUTE ON FUNCTION public.log_security_event(text, text, text, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.log_security_event(text, text, text, jsonb) TO service_role;

-- log_bible_audit_action
REVOKE EXECUTE ON FUNCTION public.log_bible_audit_action(text, text, text, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.log_bible_audit_action(text, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_bible_audit_action(text, text, text, jsonb) TO service_role;

-- version_bible_audit_notification
REVOKE EXECUTE ON FUNCTION public.version_bible_audit_notification() FROM public;
GRANT EXECUTE ON FUNCTION public.version_bible_audit_notification() TO service_role;

-- log_security_policy_change
REVOKE EXECUTE ON FUNCTION public.log_security_policy_change(text, text, jsonb, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.log_security_policy_change(text, text, jsonb, uuid) TO service_role;

-- generate_security_diff_summary
REVOKE EXECUTE ON FUNCTION public.generate_security_diff_summary(jsonb, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.generate_security_diff_summary(jsonb, jsonb) TO service_role;

-- purge_user_bible_cache
REVOKE EXECUTE ON FUNCTION public.purge_user_bible_cache(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.purge_user_bible_cache(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.purge_user_bible_cache(uuid, text) TO service_role;

-- check_daily_reminders (ensuring it's private)
REVOKE EXECUTE ON FUNCTION public.check_daily_reminders() FROM public;
GRANT EXECUTE ON FUNCTION public.check_daily_reminders() TO service_role;

-- log_sensitive_operation (ensuring it's private)
REVOKE EXECUTE ON FUNCTION public.log_sensitive_operation() FROM public;
GRANT EXECUTE ON FUNCTION public.log_sensitive_operation() TO service_role;
