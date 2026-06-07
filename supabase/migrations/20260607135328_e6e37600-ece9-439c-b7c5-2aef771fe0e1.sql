-- Trigger manual de um novo scan para testar os alertas
DO $$
DECLARE
    v_scan_id UUID;
BEGIN
    INSERT INTO public.security_scans (status, started_at)
    VALUES ('running', now())
    RETURNING id INTO v_scan_id;

    -- Popular achados
    INSERT INTO public.security_findings (scan_id, severity, category, target, description)
    SELECT v_scan_id, severity, issue_type, function_name, details
    FROM public.audit_security_definer_privileges();

    -- Finalizar scan (isso deve disparar o trigger de alertas)
    UPDATE public.security_scans 
    SET status = 'completed',
        completed_at = now(),
        findings_count = (SELECT count(*) FROM public.security_findings WHERE scan_id = v_scan_id)
    WHERE id = v_scan_id;
END $$;
