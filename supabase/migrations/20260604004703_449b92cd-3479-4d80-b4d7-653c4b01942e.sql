-- Fix search_path and revoke public access
ALTER FUNCTION public.cleanup_telemetry_logs(INTEGER) SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.cleanup_telemetry_logs(INTEGER) FROM public;
REVOKE EXECUTE ON FUNCTION public.cleanup_telemetry_logs(INTEGER) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_telemetry_logs(INTEGER) TO service_role;
