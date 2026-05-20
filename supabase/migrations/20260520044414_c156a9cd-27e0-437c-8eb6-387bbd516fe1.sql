-- Set search_path and revoke public execute for security
ALTER FUNCTION public.check_daily_reminders() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.check_daily_reminders() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_daily_reminders() TO service_role;
