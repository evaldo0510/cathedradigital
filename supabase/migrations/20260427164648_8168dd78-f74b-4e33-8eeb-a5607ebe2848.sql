-- Revoke public execution of security-sensitive functions
REVOKE EXECUTE ON FUNCTION public.update_last_action_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_profile_security() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_role_escalation() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_last_action_at_from_metrics() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_admin_role_from_profile() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.can_update_own_profile(uuid, text, boolean, text) FROM PUBLIC, anon, authenticated;

-- Grant execution to specific roles where necessary
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

-- Ensure triggers can still run (they run as the owner usually, but let's be explicit if needed)
-- Trigger functions are usually called by the system, but REVOKE FROM PUBLIC is safe as long as the trigger is SECURITY DEFINER and owned by a superuser or the table owner.

-- Fix RLS for catechism_execution_logs (ensure only admins can see)
ALTER TABLE public.catechism_execution_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view logs" ON public.catechism_execution_logs;
CREATE POLICY "Admins can view logs" ON public.catechism_execution_logs
FOR SELECT TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can insert logs" ON public.catechism_execution_logs
FOR INSERT TO authenticated
WITH CHECK (public.is_admin());
