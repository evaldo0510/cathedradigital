-- 1. Secure existing SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.get_pending_webhook_retries() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_webhook_retries() TO service_role;

REVOKE EXECUTE ON FUNCTION public.log_sensitive_operation() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_sensitive_operation() TO service_role;

REVOKE EXECUTE ON FUNCTION public.log_access_denial(text, text, jsonb) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_access_denial(text, text, jsonb) TO service_role;

-- 2. Ensure security_audit_logs is protected
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'security_audit_logs' AND policyname = 'Admins can view security logs') THEN
        CREATE POLICY "Admins can view security logs" ON public.security_audit_logs
        FOR SELECT TO authenticated
        USING (auth_internal.has_role('admin'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'security_audit_logs' AND policyname = 'Service role can manage security logs') THEN
        CREATE POLICY "Service role can manage security logs" ON public.security_audit_logs
        FOR ALL TO service_role
        USING (true)
        WITH CHECK (true);
    END IF;
END $$;

-- 3. Add SQL helper for security logging
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type text,
  p_description text,
  p_severity text DEFAULT 'warning',
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.security_audit_logs (event_type, description, severity, metadata)
  VALUES (p_event_type, p_description, p_severity, p_metadata);
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_security_event(text, text, text, jsonb) TO service_role;
