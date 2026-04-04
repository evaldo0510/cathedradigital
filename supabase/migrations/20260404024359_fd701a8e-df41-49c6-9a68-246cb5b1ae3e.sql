-- Create catechism_cache table
CREATE TABLE public.catechism_cache (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    paragraph INTEGER NOT NULL UNIQUE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.catechism_cache ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read the cache
CREATE POLICY "Catechism cache is viewable by everyone" 
ON public.catechism_cache 
FOR SELECT 
USING (true);

-- Add index for paragraph search
CREATE INDEX idx_catechism_cache_paragraph ON public.catechism_cache(paragraph);
