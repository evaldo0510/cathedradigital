-- SECURITY HARDENING: Revoke public execute on SECURITY DEFINER functions
-- and convert to SECURITY INVOKER where appropriate.

-- 1. Identify and handle auth_internal.is_admin()
-- This function only checks the current user's own profile record.
-- It doesn't strictly need SECURITY DEFINER if the user can read their own profile.
ALTER FUNCTION auth_internal.is_admin() SECURITY INVOKER;

-- 2. Revoke public EXECUTE and grant specifically to roles
-- We revoke from PUBLIC (which includes everyone) and then grant back to authenticated/service_role/anon as needed.

DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.prosecdef = true 
        AND n.nspname IN ('public', 'auth_internal')
    LOOP
        -- Revoke from everyone
        EXECUTE format('REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM PUBLIC', 
            func_record.nspname, func_record.proname, func_record.args);
        
        -- Grant back to roles that actually need it
        EXECUTE format('GRANT EXECUTE ON FUNCTION %I.%I(%s) TO authenticated, service_role', 
            func_record.nspname, func_record.proname, func_record.args);
            
        -- Grant to anon for role-check functions used in RLS (to prevent permission errors on public policies)
        IF func_record.proname IN ('has_role', 'is_admin') THEN
            EXECUTE format('GRANT EXECUTE ON FUNCTION %I.%I(%s) TO anon', 
                func_record.nspname, func_record.proname, func_record.args);
        END IF;
    END LOOP;
END $$;

-- 3. Handle specifically sensitive functions that anon should NOT have access to
-- Even if they were granted above by the loop, we ensure they are revoked from anon here if they are purely internal/admin.
REVOKE EXECUTE ON FUNCTION public.update_user_streak() FROM anon;
REVOKE EXECUTE ON FUNCTION public.check_daily_reminders() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_profile_private() FROM anon;
REVOKE EXECUTE ON FUNCTION auth_internal.sync_admin_role_from_profile() FROM anon;
REVOKE EXECUTE ON FUNCTION auth_internal.update_last_action_at() FROM anon;
REVOKE EXECUTE ON FUNCTION auth_internal.enforce_profile_security() FROM anon;
REVOKE EXECUTE ON FUNCTION auth_internal.prevent_role_escalation() FROM anon;
REVOKE EXECUTE ON FUNCTION auth_internal.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION auth_internal.update_last_action_at_from_metrics() FROM anon;
REVOKE EXECUTE ON FUNCTION auth_internal.sync_content_tags_to_array() FROM anon;
REVOKE EXECUTE ON FUNCTION auth_internal.can_update_own_profile(uuid, text, boolean, text) FROM anon;
