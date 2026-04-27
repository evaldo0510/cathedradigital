-- Restrict execute on SECURITY DEFINER functions to authenticated or service_role
REVOKE EXECUTE ON FUNCTION public.can_update_own_profile(uuid, text, boolean, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_update_own_profile(uuid, text, boolean, text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.enforce_profile_security() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enforce_profile_security() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.prevent_role_escalation() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.prevent_role_escalation() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.sync_admin_role_from_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_admin_role_from_profile() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.sync_content_tags_to_array() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_content_tags_to_array() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.update_last_action_at() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_last_action_at() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.update_last_action_at_from_metrics() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_last_action_at_from_metrics() TO authenticated, service_role;
