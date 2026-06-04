-- Revoke public execute from sensitive functions
REVOKE EXECUTE ON FUNCTION public.is_current_user_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO service_role;

REVOKE EXECUTE ON FUNCTION public.update_user_streak() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_user_streak() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_streak() TO service_role;

REVOKE EXECUTE ON FUNCTION public.log_sensitive_operation() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_sensitive_operation() TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_sensitive_operation() TO service_role;

REVOKE EXECUTE ON FUNCTION public.log_access_denial(text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_access_denial(text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_access_denial(text, text, jsonb) TO service_role;

-- Ensure cleanup functions are not public
REVOKE EXECUTE ON FUNCTION public.cleanup_telemetry_logs() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_telemetry_logs() TO service_role;

REVOKE EXECUTE ON FUNCTION public.cleanup_telemetry_logs(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_telemetry_logs(integer) TO service_role;

-- Webhook functions restricted
REVOKE EXECUTE ON FUNCTION public.track_webhook_alert(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_webhook_alert(text, text, text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.get_pending_webhook_retries() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_pending_webhook_retries() TO service_role;

-- Daily reminders
REVOKE EXECUTE ON FUNCTION public.check_daily_reminders() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_daily_reminders() TO service_role;
