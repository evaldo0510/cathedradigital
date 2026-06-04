-- Revoke from anon role
REVOKE EXECUTE ON FUNCTION public.cleanup_telemetry_logs(INTEGER) FROM anon;
