-- Table to track inspections of sensitive error logs
CREATE TABLE IF NOT EXISTS public.telemetry_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inspector_id UUID REFERENCES auth.users(id),
    request_id TEXT NOT NULL,
    inspected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    action_type TEXT DEFAULT 'view_error_detail'
);

ALTER TABLE public.telemetry_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view telemetry audit logs"
ON public.telemetry_audit_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can insert telemetry audit logs"
ON public.telemetry_audit_logs FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

GRANT ALL ON public.telemetry_audit_logs TO service_role;
GRANT SELECT, INSERT ON public.telemetry_audit_logs TO authenticated;

-- Enhanced cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_telemetry_logs(retention_days INTEGER DEFAULT 30)
RETURNS void AS $$
BEGIN
  -- Delete logs older than retention period
  DELETE FROM public.security_logs
  WHERE created_at < (now() - (retention_days || ' days')::interval)
  AND (event_type = 'error' OR action = 'navigation_click');
  
  -- Delete audit records older than 90 days
  DELETE FROM public.telemetry_audit_logs
  WHERE inspected_at < (now() - interval '90 days');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
