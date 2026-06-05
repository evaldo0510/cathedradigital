-- Fix secret_leaks: remove anonymous access via NULL user_id branch
DROP POLICY IF EXISTS "Users can view their own leaks" ON public.secret_leaks;
CREATE POLICY "Users can view their own leaks"
ON public.secret_leaks
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND (
    auth.uid() = ((details ->> 'user_id')::uuid)
    OR auth_internal.has_role(auth.uid(), 'admin'::public.app_role)
  )
);

-- Fix webhook_* policies: replace profiles.role checks with auth_internal.has_role
DROP POLICY IF EXISTS "Admins can view webhook logs" ON public.webhook_logs;
CREATE POLICY "Admins can view webhook logs"
ON public.webhook_logs
FOR SELECT
TO authenticated
USING (auth_internal.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Users can view their own webhook logs" ON public.webhook_logs;
CREATE POLICY "Users can view their own webhook logs"
ON public.webhook_logs
FOR SELECT
TO authenticated
USING (
  ((payload ->> 'external_reference') = (auth.uid())::text)
  OR ((payload ->> 'userId') = (auth.uid())::text)
  OR (((payload -> 'data') ->> 'external_reference') = (auth.uid())::text)
  OR auth_internal.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "Admins can view alerts" ON public.webhook_alerts;
CREATE POLICY "Admins can view alerts"
ON public.webhook_alerts
FOR SELECT
TO authenticated
USING (auth_internal.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can view webhook alerts" ON public.webhook_alerts;
CREATE POLICY "Admins can view webhook alerts"
ON public.webhook_alerts
FOR ALL
TO authenticated
USING (auth_internal.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (auth_internal.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can manage webhook settings" ON public.webhook_settings;
CREATE POLICY "Admins can manage webhook settings"
ON public.webhook_settings
FOR ALL
TO authenticated
USING (auth_internal.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (auth_internal.has_role(auth.uid(), 'admin'::public.app_role));