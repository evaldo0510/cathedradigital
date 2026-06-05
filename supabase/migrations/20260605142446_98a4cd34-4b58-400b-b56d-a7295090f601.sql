-- 1. Create table for security scan history if it doesn't exist
CREATE TABLE IF NOT EXISTS public.bible_audit_security_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status TEXT NOT NULL CHECK (status IN ('passed', 'failed', 'warning')),
    issues_found JSONB DEFAULT '[]'::jsonb,
    compliance_score INTEGER,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    triggered_by UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. Add extra fields to security logs for better traceability
ALTER TABLE public.bible_audit_security_logs 
ADD COLUMN IF NOT EXISTS before_state JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS after_state JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'info';

-- 3. Enable RLS and Grant access
ALTER TABLE public.bible_audit_security_scans ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.bible_audit_security_scans TO service_role;
GRANT SELECT ON public.bible_audit_security_scans TO authenticated;

CREATE POLICY "Admins can manage security scans"
ON public.bible_audit_security_scans
FOR ALL
TO authenticated
USING (auth_internal.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (auth_internal.has_role(auth.uid(), 'admin'::app_role));

-- 4. Function to generate a security diff summary
CREATE OR REPLACE FUNCTION public.generate_security_diff_summary(before_val JSONB, after_val JSONB)
RETURNS TEXT AS $$
DECLARE
    summary TEXT := '';
BEGIN
    IF (before_val IS NULL OR after_val IS NULL) THEN
        RETURN 'State change initialized.';
    END IF;
    -- Basic diff summary logic
    IF (before_val->>'action' != after_val->>'action') THEN
        summary := summary || 'Action changed from ' || (before_val->>'action') || ' to ' || (after_val->>'action') || '. ';
    END IF;
    RETURN summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Tighten all bible_audit_* tables for ALL (Admin only)
-- We use a more careful loop without extra uid parameters
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name LIKE 'bible_audit_%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Admins can manage %I" ON public.%I', t, t);
        EXECUTE format('CREATE POLICY "Admins can manage %I" ON public.%I FOR ALL TO authenticated USING (auth_internal.has_role(auth.uid(), ''admin''::app_role)) WITH CHECK (auth_internal.has_role(auth.uid(), ''admin''::app_role))', t, t);
    END LOOP;
END;
$$;
