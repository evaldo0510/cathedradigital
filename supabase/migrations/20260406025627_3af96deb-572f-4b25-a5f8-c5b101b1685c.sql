-- Drop the permissive policy that exposes all active coupons
DROP POLICY IF EXISTS "Authenticated users can read active coupons" ON public.coupons;
