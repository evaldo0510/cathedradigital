-- coordinated cache purging RPC
CREATE OR REPLACE FUNCTION public.purge_user_bible_cache(p_user_id UUID, p_book_abbr TEXT DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
    IF p_book_abbr IS NULL THEN
        DELETE FROM public.reading_marks WHERE user_id = p_user_id AND content_type = 'bible';
    ELSE
        DELETE FROM public.reading_marks WHERE user_id = p_user_id AND content_type = 'bible' AND content_id = p_book_abbr;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tracking cache versioning at DB level
CREATE TABLE IF NOT EXISTS public.bible_cache_metadata (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    client_version INTEGER NOT NULL DEFAULT 4,
    last_purged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bible_cache_metadata TO authenticated;
GRANT ALL ON public.bible_cache_metadata TO service_role;

ALTER TABLE public.bible_cache_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own cache metadata" ON public.bible_cache_metadata
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- reading_state_history for navigation recovery
CREATE TABLE IF NOT EXISTS public.reading_state_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    content_type TEXT NOT NULL,
    content_id TEXT NOT NULL,
    chapter INTEGER,
    verse INTEGER,
    paragraph INTEGER,
    view_mode TEXT,
    scroll_position INTEGER,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.reading_state_history TO authenticated;
GRANT ALL ON public.reading_state_history TO service_role;

ALTER TABLE public.reading_state_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own state history" ON public.reading_state_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own state history" ON public.reading_state_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own state history" ON public.reading_state_history
    FOR DELETE USING (auth.uid() = user_id);

-- Update trigger for bible_cache_metadata
CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bible_cache_metadata_updated_at 
    BEFORE UPDATE ON public.bible_cache_metadata 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Language guard trigger for audit logs (preventing English leaks at source)
CREATE OR REPLACE FUNCTION public.enforce_bible_language_pt() RETURNS TRIGGER AS $$
BEGIN
    NEW.metadata = NEW.metadata || jsonb_build_object(
        'book', REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(NEW.metadata->>'book', 'Tobit', 'Tobias'), 'Judith', 'Judite'), 'Wisdom', 'Sabedoria'), 'Sirach', 'Eclesiástico'), 'Baruch', 'Baruc'), 'Maccabees', 'Macabeus')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only if bible_audit_runs table exists (checked via list_dir/view logs)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bible_audit_runs') THEN
        CREATE TRIGGER bible_audit_runs_lang_guard
            BEFORE INSERT ON public.bible_audit_runs
            FOR EACH ROW EXECUTE FUNCTION public.enforce_bible_language_pt();
    END IF;
END $$;
