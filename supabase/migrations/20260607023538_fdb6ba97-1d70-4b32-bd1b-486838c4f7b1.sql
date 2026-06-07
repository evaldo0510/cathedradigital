CREATE TABLE IF NOT EXISTS public.bible_audit_runs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    status TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bible_audit_runs TO authenticated;
GRANT ALL ON public.bible_audit_runs TO service_role;
GRANT SELECT ON public.bible_audit_runs TO anon;

ALTER TABLE public.bible_audit_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view audit runs" ON public.bible_audit_runs FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert audit runs" ON public.bible_audit_runs FOR INSERT WITH CHECK (true);

-- Drop existing trigger if any and recreate
DROP TRIGGER IF EXISTS bible_audit_runs_lang_guard ON public.bible_audit_runs;

CREATE OR REPLACE FUNCTION public.enforce_bible_language_pt() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.metadata ? 'book' THEN
        NEW.metadata = NEW.metadata || jsonb_build_object(
            'book', REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(NEW.metadata->>'book', 'Tobit', 'Tobias'), 'Judith', 'Judite'), 'Wisdom', 'Sabedoria'), 'Sirach', 'Eclesiástico'), 'Baruch', 'Baruc'), 'Maccabees', 'Macabeus')
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bible_audit_runs_lang_guard
    BEFORE INSERT ON public.bible_audit_runs
    FOR EACH ROW EXECUTE FUNCTION public.enforce_bible_language_pt();