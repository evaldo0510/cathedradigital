-- 1. Create table for security audit logs
CREATE TABLE IF NOT EXISTS public.bible_audit_security_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL, -- e.g., 'POLICY_CHANGE', 'SCAN_RUN'
    entity_name TEXT NOT NULL, -- table or policy name
    details JSONB NOT NULL, -- before/after state
    scan_id UUID, -- optional link to a scan run
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Grant access to admins only
GRANT SELECT ON public.bible_audit_security_logs TO authenticated;
GRANT ALL ON public.bible_audit_security_logs TO service_role;
ALTER TABLE public.bible_audit_security_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view security logs"
    ON public.bible_audit_security_logs
    FOR SELECT
    TO authenticated
    USING (auth_internal.has_role(auth.uid(), 'admin'::app_role));

-- 2. Create a helper function to log policy changes
-- Note: Postgres doesn't easily support DDL triggers for 'ALTER POLICY' with full diffs in a portable way for Supabase, 
-- so we will provide a function to be called by scripts or manually.
CREATE OR REPLACE FUNCTION public.log_security_policy_change(
    p_action TEXT,
    p_entity_name TEXT,
    p_details JSONB,
    p_scan_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO public.bible_audit_security_logs (action, entity_name, details, scan_id, created_by)
    VALUES (p_action, p_entity_name, p_details, p_scan_id, auth.uid())
    RETURNING id INTO v_log_id;
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Additional tightening for bible_audit_runs and schedules (missed in previous scan fix)
DROP POLICY IF EXISTS "Admins can manage audit runs" ON public.bible_audit_runs;
CREATE POLICY "Admins can manage audit runs"
  ON public.bible_audit_runs
  FOR ALL
  TO authenticated
  USING (auth_internal.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (auth_internal.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage audit schedules" ON public.bible_audit_schedules;
CREATE POLICY "Admins can manage audit schedules"
  ON public.bible_audit_schedules
  FOR ALL
  TO authenticated
  USING (auth_internal.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (auth_internal.has_role(auth.uid(), 'admin'::app_role));
