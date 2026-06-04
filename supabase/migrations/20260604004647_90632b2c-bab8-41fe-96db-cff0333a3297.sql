-- Function to cleanup old telemetry logs
CREATE OR REPLACE FUNCTION public.cleanup_telemetry_logs(retention_days INTEGER DEFAULT 30)
RETURNS void AS $$
BEGIN
  DELETE FROM public.security_logs
  WHERE created_at < (now() - (retention_days || ' days')::interval)
  AND (event_type = 'error' OR action = 'navigation_click');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to service role
GRANT EXECUTE ON FUNCTION public.cleanup_telemetry_logs(INTEGER) TO service_role;
