-- Fix coupons admin policy: restrict to authenticated role only
DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;

CREATE POLICY "Admins can manage coupons"
ON public.coupons
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));