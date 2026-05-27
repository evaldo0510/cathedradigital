DROP POLICY IF EXISTS "Anyone can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users insert own audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (
  (user_id IS NULL OR user_id = auth.uid())
  AND event_type = ANY (ARRAY['unauthorized_access','login_attempt','security_event','audit_event'])
);