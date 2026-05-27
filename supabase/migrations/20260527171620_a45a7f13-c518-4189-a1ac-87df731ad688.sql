
DROP POLICY "System can insert security logs" ON public.security_audit_logs;

CREATE POLICY "System can insert security logs"
ON public.security_audit_logs
FOR INSERT
WITH CHECK (auth.role() = 'service_role');
