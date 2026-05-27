-- Final execution privilege cleanup to satisfy security linter
-- We revoke EXECUTE from authenticated for internal trigger functions
-- that are triggered by system events or other table actions, not direct user calls.

REVOKE EXECUTE ON FUNCTION public.update_user_streak() FROM authenticated;
REVOKE EXECUTE ON FUNCTION auth_internal.sync_admin_role_from_profile() FROM authenticated;
REVOKE EXECUTE ON FUNCTION auth_internal.update_last_action_at() FROM authenticated;
REVOKE EXECUTE ON FUNCTION auth_internal.enforce_profile_security() FROM authenticated;
REVOKE EXECUTE ON FUNCTION auth_internal.prevent_role_escalation() FROM authenticated;
REVOKE EXECUTE ON FUNCTION auth_internal.handle_new_user() FROM authenticated;
REVOKE EXECUTE ON FUNCTION auth_internal.update_last_action_at_from_metrics() FROM authenticated;
REVOKE EXECUTE ON FUNCTION auth_internal.sync_content_tags_to_array() FROM authenticated;

-- Note: has_role and can_update_own_profile MUST keep authenticated execute 
-- because they are used directly in RLS policies for authenticated users.
