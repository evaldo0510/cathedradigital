-- Fix mutable search path for handle_updated_at
ALTER FUNCTION public.handle_updated_at() SET search_path TO 'public';

-- Revoke EXECUTE from authenticated for internal system functions that are not triggers and not used in RLS
REVOKE EXECUTE ON FUNCTION public.check_daily_reminders() FROM authenticated;

-- Ensure these are only callable by service_role (and postgres)
REVOKE EXECUTE ON FUNCTION public.check_daily_reminders() FROM anon;
GRANT EXECUTE ON FUNCTION public.check_daily_reminders() TO service_role;

-- handle_new_profile_private is a trigger on auth.users, which runs as service_role usually in Supabase
-- but if it's triggered by a user action, they might need execute. 
-- However, we can try to restrict it to service_role first.
REVOKE EXECUTE ON FUNCTION public.handle_new_profile_private() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_profile_private() FROM anon;
GRANT EXECUTE ON FUNCTION public.handle_new_profile_private() TO service_role;
