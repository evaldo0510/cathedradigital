-- Check if we need to rename or drop/recreate
DO $$
BEGIN
    -- If the table exists with the wrong schema, we drop it to ensure consistency with current requirements
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bible_audit_runs') THEN
        DROP TABLE public.bible_audit_runs CASCADE;
    END IF;
END $$;

CREATE TABLE public.bible_audit_runs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    status TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    total_books INTEGER,
    covered_books INTEGER,
    total_chapters INTEGER,
    covered_chapters INTEGER,
    total_verses INTEGER,
    covered_verses INTEGER,
    empty_books TEXT[],
    logs JSONB DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES auth.users(id),
    search_queries JSONB DEFAULT '[]'::jsonb,
    config JSONB DEFAULT '{}'::jsonb
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bible_audit_runs TO authenticated;
GRANT ALL ON public.bible_audit_runs TO service_role;
GRANT SELECT ON public.bible_audit_runs TO anon;

ALTER TABLE public.bible_audit_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view audit runs" ON public.bible_audit_runs FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert audit runs" ON public.bible_audit_runs FOR INSERT WITH CHECK (true);

-- Re-apply language guard trigger
CREATE OR REPLACE FUNCTION public.enforce_bible_language_pt() RETURNS TRIGGER AS $$
BEGIN
    -- Ensure metadata exists
    IF NEW.metadata IS NULL THEN
        NEW.metadata = '{}'::jsonb;
    END IF;

    -- Replace common English terms in the report if they leaked
    NEW.metadata = CAST(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(CAST(NEW.metadata AS TEXT), 'Tobit', 'Tobias'), 'Judith', 'Judite'), 'Wisdom', 'Sabedoria'), 'Sirach', 'Eclesiástico'), 'Baruch', 'Baruc'), 'Maccabees', 'Macabeus') AS JSONB);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bible_audit_runs_lang_guard
    BEFORE INSERT ON public.bible_audit_runs
    FOR EACH ROW EXECUTE FUNCTION public.enforce_bible_language_pt();