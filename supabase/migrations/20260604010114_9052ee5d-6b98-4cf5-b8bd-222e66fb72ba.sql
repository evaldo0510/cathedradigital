-- Revoke public access to critical functions
REVOKE EXECUTE ON FUNCTION public.cleanup_telemetry_logs() FROM public;
REVOKE EXECUTE ON FUNCTION public.cleanup_telemetry_logs() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_telemetry_logs() FROM anon;

-- Ensure service role can still execute
GRANT EXECUTE ON FUNCTION public.cleanup_telemetry_logs() TO service_role;

-- Fix search_path for audit and mask functions
ALTER FUNCTION public.mask_ip(TEXT) SET search_path = public;
ALTER FUNCTION public.cleanup_telemetry_logs() SET search_path = public;
