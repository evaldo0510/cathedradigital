DROP POLICY IF EXISTS "Admins can manage telemetry settings" ON public.telemetry_settings;
CREATE POLICY "Admins can manage telemetry settings" ON public.telemetry_settings
  FOR ALL TO authenticated
  USING (auth_internal.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (auth_internal.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can view and create audit logs" ON public.telemetry_audit;
CREATE POLICY "Admins can view and create audit logs" ON public.telemetry_audit
  FOR ALL TO authenticated
  USING (auth_internal.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (auth_internal.has_role(auth.uid(), 'admin'::app_role));