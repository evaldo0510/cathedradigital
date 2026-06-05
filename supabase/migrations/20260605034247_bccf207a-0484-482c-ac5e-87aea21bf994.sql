CREATE TABLE public.bible_audit_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'running', -- 'running', 'completed', 'failed'
    total_books INTEGER,
    covered_books INTEGER,
    total_chapters INTEGER,
    covered_chapters INTEGER,
    total_verses INTEGER,
    covered_verses INTEGER,
    empty_books JSONB DEFAULT '[]',
    logs JSONB DEFAULT '[]', -- Array of { timestamp, level, message, details }
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.bible_audit_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    frequency TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
    next_run TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    last_run_id UUID REFERENCES public.bible_audit_runs(id),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.bible_audit_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES public.bible_audit_runs(id),
    severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
    message TEXT NOT NULL,
    details JSONB,
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bible_audit_runs TO authenticated;
GRANT ALL ON public.bible_audit_runs TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bible_audit_schedules TO authenticated;
GRANT ALL ON public.bible_audit_schedules TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bible_audit_alerts TO authenticated;
GRANT ALL ON public.bible_audit_alerts TO service_role;

-- RLS
ALTER TABLE public.bible_audit_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bible_audit_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bible_audit_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own audit runs" ON public.bible_audit_runs FOR ALL USING (true);
CREATE POLICY "Users can manage their own audit schedules" ON public.bible_audit_schedules FOR ALL USING (true);
CREATE POLICY "Users can manage their own audit alerts" ON public.bible_audit_alerts FOR ALL USING (true);
