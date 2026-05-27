-- Create reading reflections table
CREATE TABLE IF NOT EXISTS public.reading_reflections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reading_type TEXT NOT NULL, -- 'bible', 'catechism', 'magisterium'
    content TEXT,
    context_id TEXT, -- e.g. "Genesis 1", "CCC 121"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.reading_reflections ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can insert their own reflections"
    ON public.reading_reflections FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own reflections"
    ON public.reading_reflections FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own reflections"
    ON public.reading_reflections FOR UPDATE
    USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_reading_reflections_updated_at
    BEFORE UPDATE ON public.reading_reflections
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();