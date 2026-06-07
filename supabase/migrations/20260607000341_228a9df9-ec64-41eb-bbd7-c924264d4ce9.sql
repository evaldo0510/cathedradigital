CREATE TABLE public.saved_filters (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    query TEXT,
    filter_by TEXT DEFAULT 'all',
    project_id TEXT DEFAULT 'global',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_filters TO authenticated;
GRANT ALL ON public.saved_filters TO service_role;

-- RLS
ALTER TABLE public.saved_filters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own filters" 
ON public.saved_filters FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_saved_filters_updated_at 
BEFORE UPDATE ON public.saved_filters 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();