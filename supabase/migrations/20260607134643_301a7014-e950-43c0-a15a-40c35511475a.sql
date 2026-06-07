-- Função para validar invariantes de segurança (Testes de Regressão)
CREATE OR REPLACE FUNCTION public.verify_security_invariants()
RETURNS TABLE (
    test_name TEXT,
    status TEXT,
    error_message TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- 1. Testar se tabelas sensíveis têm RLS habilitado
    RETURN QUERY
    SELECT 
        'RLS_CHECK_' || tablename,
        CASE WHEN rowsecurity THEN 'PASS' ELSE 'FAIL' END,
        CASE WHEN NOT rowsecurity THEN 'RLS not enabled on ' || tablename ELSE NULL END
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN ('security_scans', 'security_findings', 'bible_audit_runs', 'bible_integrity_reports');

    -- 2. Testar se funções SECURITY DEFINER não são públicas
    RETURN QUERY
    SELECT 
        'FUNC_PRIVS_' || p.proname,
        CASE WHEN NOT has_function_privilege('public', p.oid, 'execute') THEN 'PASS' ELSE 'FAIL' END,
        CASE WHEN has_function_privilege('public', p.oid, 'execute') THEN 'Function ' || p.proname || ' is executable by public' ELSE NULL END
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
    AND p.prosecdef = true;

    -- 3. Testar se is_current_user_admin() está protegido contra anon
    RETURN QUERY
    SELECT 
        'ADMIN_FUNC_PROTECTION',
        CASE WHEN NOT has_function_privilege('anon', 'public.is_current_user_admin()', 'execute') THEN 'PASS' ELSE 'FAIL' END,
        CASE WHEN has_function_privilege('anon', 'public.is_current_user_admin()', 'execute') THEN 'is_current_user_admin() is executable by anon' ELSE NULL END;
END;
$$;

-- Restringir execução
REVOKE ALL ON FUNCTION public.verify_security_invariants() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_security_invariants() TO service_role;
