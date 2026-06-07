-- Tabelas para monitoramento de segurança
CREATE TABLE IF NOT EXISTS public.security_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'running', -- 'running', 'completed', 'failed'
    findings_count INTEGER DEFAULT 0,
    triggered_by UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.security_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id UUID REFERENCES public.security_scans(id) ON DELETE CASCADE,
    severity TEXT NOT NULL, -- 'critical', 'high', 'medium', 'low'
    category TEXT NOT NULL, -- 'RLS', 'SECURITY_DEFINER', 'SEARCH_PATH', 'API'
    target TEXT NOT NULL, -- table name or function name
    description TEXT NOT NULL,
    evidence JSONB DEFAULT '{}'::jsonb,
    recommendation TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.security_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_findings ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT ON public.security_scans TO authenticated;
GRANT SELECT ON public.security_findings TO authenticated;
GRANT ALL ON public.security_scans TO service_role;
GRANT ALL ON public.security_findings TO service_role;

-- Políticas (Apenas Admins podem ver/gerenciar scans)
CREATE POLICY "Admins can view security scans" ON public.security_scans
    FOR SELECT USING (public.is_current_user_admin());

CREATE POLICY "Admins can view security findings" ON public.security_findings
    FOR SELECT USING (public.is_current_user_admin());

-- Função para auditar SECURITY DEFINER e Search Path
CREATE OR REPLACE FUNCTION public.audit_security_definer_privileges()
RETURNS TABLE (
    function_name TEXT,
    schema_name TEXT,
    issue_type TEXT,
    severity TEXT,
    details TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    -- Verificar funções SECURITY DEFINER com privilégios públicos
    SELECT 
        p.proname::TEXT,
        n.nspname::TEXT,
        'EXCESSIVE_PRIVILEGE'::TEXT,
        'HIGH'::TEXT,
        'SECURITY DEFINER function is executable by PUBLIC'::TEXT
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
    AND p.prosecdef = true
    AND has_function_privilege('public', p.oid, 'execute')
    
    UNION ALL
    
    -- Verificar funções com Search Path mutável (segurança)
    SELECT 
        p.proname::TEXT,
        n.nspname::TEXT,
        'MUTABLE_SEARCH_PATH'::TEXT,
        'MEDIUM'::TEXT,
        'Function does not have a fixed search_path'::TEXT
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
    AND p.proconfig IS NULL OR NOT (p.proconfig @> ARRAY['search_path=public']);
END;
$$;

-- Função para registrar um scan manual via Admin
CREATE OR REPLACE FUNCTION public.run_manual_security_scan()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_scan_id UUID;
BEGIN
    -- Verificar se é admin
    IF NOT public.is_current_user_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    INSERT INTO public.security_scans (status, triggered_by)
    VALUES ('running', auth.uid())
    RETURNING id INTO v_scan_id;

    -- Registrar findings de funções
    INSERT INTO public.security_findings (scan_id, severity, category, target, description)
    SELECT v_scan_id, severity, issue_type, function_name, details
    FROM public.audit_security_definer_privileges();

    -- Finalizar scan
    UPDATE public.security_scans 
    SET status = 'completed', 
        completed_at = now(),
        findings_count = (SELECT count(*) FROM public.security_findings WHERE scan_id = v_scan_id)
    WHERE id = v_scan_id;

    RETURN v_scan_id;
END;
$$;
