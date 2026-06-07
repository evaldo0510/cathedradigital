CREATE TABLE public.bible_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  verse_id TEXT NOT NULL, -- Format: BookAbbr-Ch-Verse (e.g., Jo-6-35)
  category TEXT NOT NULL CHECK (category IN ('catechism', 'saint', 'document', 'theme', 'cross_reference')),
  reference_title TEXT NOT NULL,
  reference_id TEXT, -- For deep linking (e.g., CIC-1324)
  summary TEXT,
  relevance_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast lookup by verse
CREATE INDEX idx_bible_connections_verse_id ON public.bible_connections (verse_id);

-- Standard permissions
GRANT SELECT ON public.bible_connections TO authenticated;
GRANT ALL ON public.bible_connections TO service_role;

-- RLS
ALTER TABLE public.bible_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read bible connections" 
  ON public.bible_connections FOR SELECT 
  TO authenticated 
  USING (true);

-- Updated at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bible_connections_updated_at 
  BEFORE UPDATE ON public.bible_connections 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();