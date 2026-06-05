
-- 1. Fix admin check on bible_audit_notifications
DROP POLICY IF EXISTS "Admins can manage audit notifications" ON public.bible_audit_notifications;
CREATE POLICY "Admins can manage audit notifications"
  ON public.bible_audit_notifications
  FOR ALL
  TO authenticated
  USING (auth_internal.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (auth_internal.has_role(auth.uid(), 'admin'::app_role));

-- 2. Remove permissive public ALL policy on bible_audit_alerts and restrict writes to admins
DROP POLICY IF EXISTS "Users can manage their own audit alerts" ON public.bible_audit_alerts;
DROP POLICY IF EXISTS "Only service_role or admins can manage alerts" ON public.bible_audit_alerts;
CREATE POLICY "Admins can manage audit alerts"
  ON public.bible_audit_alerts
  FOR ALL
  TO authenticated
  USING (auth_internal.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (auth_internal.has_role(auth.uid(), 'admin'::app_role));

-- 3. Lock down bible_audit_webhook_logs to admins
DROP POLICY IF EXISTS "Users can manage their own webhook logs" ON public.bible_audit_webhook_logs;
CREATE POLICY "Admins can manage webhook logs"
  ON public.bible_audit_webhook_logs
  FOR ALL
  TO authenticated
  USING (auth_internal.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (auth_internal.has_role(auth.uid(), 'admin'::app_role));

-- 4. Restrict bible_audit_notification_versions reads to admins only
DROP POLICY IF EXISTS "Users can view all notification versions" ON public.bible_audit_notification_versions;
CREATE POLICY "Admins can view notification versions"
  ON public.bible_audit_notification_versions
  FOR SELECT
  TO authenticated
  USING (auth_internal.has_role(auth.uid(), 'admin'::app_role));

-- 5. Also tighten bible_audit_webhook_deliveries and bible_audit_action_logs (similar context, both contain operational secrets / PII)
DROP POLICY IF EXISTS "Users can view delivery history" ON public.bible_audit_webhook_deliveries;
CREATE POLICY "Admins can view delivery history"
  ON public.bible_audit_webhook_deliveries
  FOR SELECT
  TO authenticated
  USING (auth_internal.has_role(auth.uid(), 'admin'::app_role));
