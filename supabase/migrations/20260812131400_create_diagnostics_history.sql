CREATE TABLE public.diagnostics_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT NOT NULL,
    details JSONB NOT NULL,
    results JSONB NOT NULL
);

GRANT SELECT, INSERT ON public.diagnostics_history TO authenticated;
GRANT ALL ON public.diagnostics_history TO service_role;

ALTER TABLE public.diagnostics_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to insert diagnostics history"
ON public.diagnostics_history
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to select diagnostics history"
ON public.diagnostics_history
FOR SELECT
TO authenticated
USING (true);
