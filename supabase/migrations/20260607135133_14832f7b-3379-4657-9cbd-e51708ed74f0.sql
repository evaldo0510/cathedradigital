-- Iniciar um scan manual para gerar dados iniciais
DO $$
DECLARE
    v_scan_id UUID;
BEGIN
    -- Como estamos no contexto de migração, podemos rodar a lógica diretamente
    INSERT INTO public.security_scans (status, started_at)
    VALUES ('completed', now())
    RETURNING id INTO v_scan_id;

    -- Registrar findings atuais
    INSERT INTO public.security_findings (scan_id, severity, category, target, description)
    SELECT v_scan_id, severity, issue_type, function_name, details
    FROM public.audit_security_definer_privileges();

    UPDATE public.security_scans 
    SET completed_at = now(),
        findings_count = (SELECT count(*) FROM public.security_findings WHERE scan_id = v_scan_id)
    WHERE id = v_scan_id;
END $$;
