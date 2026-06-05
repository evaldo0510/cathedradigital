CREATE TABLE IF NOT EXISTS public.bible_audit_a11y_config (
    id TEXT PRIMARY KEY DEFAULT 'default',
    threshold_normal FLOAT DEFAULT 4.5,
    threshold_large FLOAT DEFAULT 3.0,
    device_overrides JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Grant access to admins
GRANT ALL ON public.bible_audit_a11y_config TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.bible_audit_a11y_config TO authenticated;

ALTER TABLE public.bible_audit_a11y_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage a11y config"
ON public.bible_audit_a11y_config
FOR ALL
TO authenticated
USING (auth_internal.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (auth_internal.has_role(auth.uid(), 'admin'::app_role));

-- Insert initial record
INSERT INTO public.bible_audit_a11y_config (id, threshold_normal, threshold_large)
VALUES ('default', 4.5, 3.0)
ON CONFLICT (id) DO NOTHING;
