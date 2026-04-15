CREATE TABLE public.saints (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    title TEXT,
    feast_day TEXT,
    feast_month INTEGER,
    feast_day_num INTEGER,
    born TEXT,
    died TEXT,
    patron_of TEXT[],
    bio TEXT,
    full_bio TEXT,
    works JSONB,
    quotes TEXT[],
    category TEXT,
    image TEXT,
    prayer TEXT,
    virtues TEXT[],
    bible_refs JSONB,
    catechism_refs INTEGER[],
    church_doc_refs JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saints ENABLE ROW LEVEL SECURITY;

-- Allow public read
CREATE POLICY "Saints are viewable by everyone" 
ON public.saints 
FOR SELECT 
USING (true);

-- Indexes for performance
CREATE INDEX idx_saints_date ON public.saints (feast_month, feast_day_num);
CREATE INDEX idx_saints_name ON public.saints USING GIN (to_tsvector('portuguese', name));
