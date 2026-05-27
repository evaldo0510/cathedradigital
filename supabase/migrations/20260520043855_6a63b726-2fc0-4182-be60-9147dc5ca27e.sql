-- Fix Security Warn 1: Function Search Path Mutable
ALTER FUNCTION public.update_user_streak() SET search_path = public;

-- Fix Security Warn 3 & 4: Restrict execution permissions
REVOKE ALL ON FUNCTION public.update_user_streak() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_user_streak() TO postgres, service_role;
-- Triggers still work since they are executed by the database engine
