-- Revoke from everyone first to reset
REVOKE EXECUTE ON FUNCTION public.is_current_user_admin() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_user_streak() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_telemetry_logs() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.track_webhook_alert(text, text, text) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_daily_reminders() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_profile_private() FROM public, anon, authenticated;

-- Grant to appropriate roles
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_user_streak() TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.cleanup_telemetry_logs() TO service_role;
GRANT EXECUTE ON FUNCTION public.track_webhook_alert(text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_daily_reminders() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_profile_private() TO service_role;
