-- 1. Correct journey_steps policy (fix is_premium error)
DROP POLICY IF EXISTS "Premium journey steps require premium" ON public.journey_steps;
CREATE POLICY "Premium journey steps require premium" ON public.journey_steps
FOR SELECT TO authenticated 
USING (
  is_free 
  OR (SELECT is_premium FROM public.profiles WHERE id = auth.uid()) 
  OR auth_internal.has_role(auth.uid(), 'admin'::app_role)
);

-- 2. Add missing policy for catechism_execution_logs
DROP POLICY IF EXISTS "Admins can view logs" ON public.catechism_execution_logs;
CREATE POLICY "Admins can view logs" ON public.catechism_execution_logs
FOR SELECT TO authenticated USING (auth_internal.is_admin());

DROP POLICY IF EXISTS "Admins can insert logs" ON public.catechism_execution_logs;
CREATE POLICY "Admins can insert logs" ON public.catechism_execution_logs
FOR INSERT TO authenticated WITH CHECK (auth_internal.is_admin());

-- 3. Security Hardening for auth_internal schema
-- Revoke from public
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA auth_internal FROM PUBLIC;

-- Grant to authenticated and service_role
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth_internal TO authenticated, service_role;

-- 4. Set search_path for ALL public functions to satisfy linter
DO $$
DECLARE
    func_record record;
BEGIN
    FOR func_record IN 
        SELECT p.proname, n.nspname, pg_get_function_identity_arguments(p.oid) as ident_args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
    LOOP
        EXECUTE format('ALTER FUNCTION %I.%I(%s) SET search_path = public', func_record.nspname, func_record.proname, func_record.ident_args);
    END LOOP;
END $$;

-- 5. Revoke execute from public for any straggling SECURITY DEFINER functions in public schema
DO $$
DECLARE
    func_record record;
BEGIN
    FOR func_record IN 
        SELECT p.proname, n.nspname, pg_get_function_identity_arguments(p.oid) as ident_args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.prosecdef = true
    LOOP
        EXECUTE format('REVOKE ALL ON FUNCTION %I.%I(%s) FROM PUBLIC', func_record.nspname, func_record.proname, func_record.ident_args);
    END LOOP;
END $$;
