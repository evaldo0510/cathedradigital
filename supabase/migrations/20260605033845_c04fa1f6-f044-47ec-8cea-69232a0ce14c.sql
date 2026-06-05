-- Revoke all execute rights from public role (which includes anon and authenticated)
REVOKE EXECUTE ON FUNCTION public.is_current_user_admin() FROM public;
REVOKE EXECUTE ON FUNCTION public.update_user_streak() FROM public;
REVOKE EXECUTE ON FUNCTION public.log_sensitive_operation() FROM public;
REVOKE EXECUTE ON FUNCTION public.log_access_denial(text, text, jsonb) FROM public;
REVOKE EXECUTE ON FUNCTION public.cleanup_telemetry_logs() FROM public;
REVOKE EXECUTE ON FUNCTION public.cleanup_telemetry_logs(integer) FROM public;
REVOKE EXECUTE ON FUNCTION public.track_webhook_alert(text, text, text) FROM public;
REVOKE EXECUTE ON FUNCTION public.get_pending_webhook_retries() FROM public;
REVOKE EXECUTE ON FUNCTION public.log_security_event(text, text, text, jsonb) FROM public;
REVOKE EXECUTE ON FUNCTION public.notify_admin_on_security_event() FROM public;
REVOKE EXECUTE ON FUNCTION public.check_daily_reminders() FROM public;
REVOKE EXECUTE ON FUNCTION public.handle_new_profile_private() FROM public;

-- Restore essential access for standard authenticated users
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_streak() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_profile_private() TO authenticated;

-- Restrict sensitive operational functions to service_role (backend/admin only)
GRANT EXECUTE ON FUNCTION public.log_security_event(text, text, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.log_sensitive_operation() TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_telemetry_logs() TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_telemetry_logs(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.track_webhook_alert(text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_pending_webhook_retries() TO service_role;
GRANT EXECUTE ON FUNCTION public.notify_admin_on_security_event() TO service_role;
GRANT EXECUTE ON FUNCTION public.check_daily_reminders() TO service_role;
