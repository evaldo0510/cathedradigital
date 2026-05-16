DROP POLICY "Anyone can insert audit logs" ON public.audit_logs;

CREATE POLICY "Anyone can insert audit logs" 
ON public.audit_logs 
FOR INSERT 
WITH CHECK (event_type IN ('unauthorized_access', 'login_attempt', 'security_event', 'audit_event'));
