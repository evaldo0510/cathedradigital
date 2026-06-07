-- Limpeza
DROP FUNCTION IF EXISTS public.tmp_security_test_vulnerability();

-- Scan final para limpar o histórico e confirmar que está tudo seguro
DO $$
DECLARE
    v_scan_id UUID;
BEGIN
    INSERT INTO public.security_scans (status, started_at)
    VALUES ('running', now())
    RETURNING id INTO v_scan_id;

    INSERT INTO public.security_findings (scan_id, severity, category, target, description)
    SELECT v_scan_id, severity, issue_type, function_name, details
    FROM public.audit_security_definer_privileges();

    UPDATE public.security_scans 
    SET status = 'completed',
        completed_at = now(),
        findings_count = (SELECT count(*) FROM public.security_findings WHERE scan_id = v_scan_id)
    WHERE id = v_scan_id;
END $$;
