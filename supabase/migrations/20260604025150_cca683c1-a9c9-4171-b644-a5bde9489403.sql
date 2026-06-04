-- Harden can_update_own_profile to always block role/is_premium escalation by non-admins
CREATE OR REPLACE FUNCTION auth_internal.can_update_own_profile(_profile_id uuid, _role text, _is_premium boolean, _email text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    _profile_id = auth.uid()
    AND (
      auth_internal.has_role(auth.uid(), 'admin'::app_role)
      OR (
        _role IS NOT DISTINCT FROM (SELECT role FROM public.profiles WHERE id = _profile_id)
        AND _is_premium IS NOT DISTINCT FROM (SELECT is_premium FROM public.profiles WHERE id = _profile_id)
      )
    )
$$;

-- Fix telemetry_audit_logs to use canonical user_roles via has_role()
DROP POLICY IF EXISTS "Admins can view telemetry audit logs" ON public.telemetry_audit_logs;
DROP POLICY IF EXISTS "Admins can insert telemetry audit logs" ON public.telemetry_audit_logs;

CREATE POLICY "Admins can view telemetry audit logs"
ON public.telemetry_audit_logs
FOR SELECT
TO authenticated
USING (auth_internal.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert telemetry audit logs"
ON public.telemetry_audit_logs
FOR INSERT
TO authenticated
WITH CHECK (auth_internal.has_role(auth.uid(), 'admin'::app_role));

-- Remove unscoped Realtime broadcast for catechism_cache to prevent leaking internal generation metadata
ALTER PUBLICATION supabase_realtime DROP TABLE public.catechism_cache;