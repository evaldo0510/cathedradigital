-- Tabela para alertas de segurança no Admin
CREATE TABLE IF NOT EXISTS public.security_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id UUID REFERENCES public.security_scans(id) ON DELETE CASCADE,
    finding_id UUID REFERENCES public.security_findings(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT, UPDATE ON public.security_alerts TO authenticated;
GRANT ALL ON public.security_alerts TO service_role;

-- Política para Admins
CREATE POLICY "Admins can manage security alerts" ON public.security_alerts
    FOR ALL USING (public.is_current_user_admin());

-- Função para gerar alertas baseados em mudanças
CREATE OR REPLACE FUNCTION public.generate_security_scan_alerts(p_scan_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_prev_scan_id UUID;
    v_new_findings_count INTEGER := 0;
BEGIN
    -- Encontrar o scan anterior
    SELECT id INTO v_prev_scan_id
    FROM public.security_scans
    WHERE id != p_scan_id
    AND status = 'completed'
    AND started_at < (SELECT started_at FROM public.security_scans WHERE id = p_scan_id)
    ORDER BY started_at DESC
    LIMIT 1;

    -- Se não houver scan anterior, alertar sobre todos os achados do scan atual como "Iniciais"
    IF v_prev_scan_id IS NULL THEN
        INSERT INTO public.security_alerts (scan_id, finding_id, title, message, severity)
        SELECT 
            p_scan_id, 
            id, 
            'Novo achado de segurança: ' || target,
            'Detectado no scan inicial: ' || description,
            severity
        FROM public.security_findings
        WHERE scan_id = p_scan_id;
        
        GET DIAGNOSTICS v_new_findings_count = ROW_COUNT;
    ELSE
        -- Comparar e alertar apenas novos achados
        INSERT INTO public.security_alerts (scan_id, finding_id, title, message, severity)
        SELECT 
            p_scan_id, 
            curr.id, 
            'REGRESSÃO DE SEGURANÇA: ' || curr.target,
            'Novo problema detectado que não existia no scan anterior: ' || curr.description,
            curr.severity
        FROM public.security_findings curr
        LEFT JOIN (
            SELECT target, category 
            FROM public.security_findings 
            WHERE scan_id = v_prev_scan_id
        ) prev ON curr.target = prev.target AND curr.category = prev.category
        WHERE curr.scan_id = p_scan_id
        AND prev.target IS NULL;

        GET DIAGNOSTICS v_new_findings_count = ROW_COUNT;
    END IF;

    RETURN v_new_findings_count;
END;
$$;

-- Trigger para automatizar alertas após o scan
CREATE OR REPLACE FUNCTION public.tr_after_security_scan_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        PERFORM public.generate_security_scan_alerts(NEW.id);
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_on_security_scan_complete ON public.security_scans;
CREATE TRIGGER tr_on_security_scan_complete
    AFTER UPDATE ON public.security_scans
    FOR EACH ROW
    EXECUTE FUNCTION public.tr_after_security_scan_complete();
