-- Create tables for visual regression
CREATE TABLE public.visual_regression_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'success', 'failed'
    pages_total INTEGER DEFAULT 0,
    pages_failed INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE public.visual_regression_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES public.visual_regression_runs(id) ON DELETE CASCADE,
    page_name TEXT NOT NULL,
    route TEXT NOT NULL,
    viewport TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pass', 'fail', 'approved'
    baseline_url TEXT,
    current_url TEXT,
    diff_url TEXT,
    reason TEXT,
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES auth.users(id),
    wcag_score DECIMAL,
    typography_errors JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.visual_regression_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visual_regression_snapshots ENABLE ROW LEVEL SECURITY;

-- Policies for admins
CREATE POLICY "Admins can view visual regression runs"
ON public.visual_regression_runs FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can insert/update visual regression runs"
ON public.visual_regression_runs FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can view visual regression snapshots"
ON public.visual_regression_snapshots FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can insert/update visual regression snapshots"
ON public.visual_regression_snapshots FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Indexing for performance
CREATE INDEX idx_vr_snapshots_run_id ON public.visual_regression_snapshots(run_id);
CREATE INDEX idx_vr_snapshots_status ON public.visual_regression_snapshots(status);
