-- 1. Remove the overly permissive SELECT policy on profiles
DROP POLICY IF EXISTS "Public profile information" ON public.profiles;

-- 2. Fix app_metrics admin policy to use has_role() instead of profiles.role
DROP POLICY IF EXISTS "Admins can view all metrics" ON public.app_metrics;

CREATE POLICY "Admins can view all metrics"
ON public.app_metrics
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
