
-- Create security audit logs table
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'info', -- info, warning, critical
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Use GRANT to set permissions
GRANT SELECT, INSERT ON public.security_audit_logs TO authenticated;
GRANT ALL ON public.security_audit_logs TO service_role;

-- Enable RLS
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies (only admins can view)
CREATE POLICY "Admins can view security logs" 
ON public.security_audit_logs 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "System can insert security logs"
ON public.security_audit_logs
FOR INSERT
WITH CHECK (true); -- Allow insertion (limited by service_role for system, or authenticated for user-triggered audits)

-- Create RLS test results table
CREATE TABLE IF NOT EXISTS public.rls_test_results (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    test_name TEXT NOT NULL,
    status TEXT NOT NULL, -- success, failure
    details TEXT,
    run_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Use GRANT to set permissions
GRANT SELECT ON public.rls_test_results TO authenticated;
GRANT ALL ON public.rls_test_results TO service_role;

-- Enable RLS
ALTER TABLE public.rls_test_results ENABLE ROW LEVEL SECURITY;

-- Create policies (only admins can view)
CREATE POLICY "Admins can view RLS results" 
ON public.rls_test_results 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Add index for performance
CREATE INDEX idx_security_audit_logs_event_type ON public.security_audit_logs(event_type);
CREATE INDEX idx_security_audit_logs_severity ON public.security_audit_logs(severity);
