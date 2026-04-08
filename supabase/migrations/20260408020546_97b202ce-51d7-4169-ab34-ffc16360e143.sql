-- Remove public coupon browsing — validation happens via validate-coupon edge function
DROP POLICY IF EXISTS "Authenticated users can view active coupons" ON public.coupons;

-- Only admins can see coupons directly
CREATE POLICY "Only admins can view coupons"
ON public.coupons
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));