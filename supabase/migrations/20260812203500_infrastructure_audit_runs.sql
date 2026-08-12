CREATE TABLE public.infrastructure_audit_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('PASS', 'FAIL', 'BLOCKED')),
    details JSONB
);

GRANT SELECT, INSERT ON public.infrastructure_audit_runs TO authenticated;
GRANT ALL ON public.infrastructure_audit_runs TO service_role;

ALTER TABLE public.infrastructure_audit_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage audit runs" 
ON public.infrastructure_audit_runs 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

COMMENT ON TABLE public.infrastructure_audit_runs IS 'Histórico de execuções de auditoria de infraestrutura e multi-idioma.';
