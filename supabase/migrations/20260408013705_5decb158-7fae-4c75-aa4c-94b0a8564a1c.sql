-- 1. Fix coupons: restrict active coupon visibility to authenticated users only
DROP POLICY IF EXISTS "Users can view active coupons" ON public.coupons;

CREATE POLICY "Authenticated users can view active coupons"
ON public.coupons
FOR SELECT
TO authenticated
USING (is_active = true);

-- 2. Fix app_metrics: restrict INSERT to authenticated users
DROP POLICY IF EXISTS "Anyone can create app metrics" ON public.app_metrics;

CREATE POLICY "Authenticated users can create app metrics"
ON public.app_metrics
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 3. Fix notifications INSERT: explicitly target authenticated only
DROP POLICY IF EXISTS "System and Admins can create notifications" ON public.notifications;

CREATE POLICY "Admins can create notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));
