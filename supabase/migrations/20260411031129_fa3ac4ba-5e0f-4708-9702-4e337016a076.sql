-- Create table for tracking catechism progress
CREATE TABLE IF NOT EXISTS public.catechism_paragraphs_read (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    paragraph INTEGER NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(user_id, paragraph)
);

-- Enable RLS
ALTER TABLE public.catechism_paragraphs_read ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own catechism progress"
ON public.catechism_paragraphs_read FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own catechism progress"
ON public.catechism_paragraphs_read FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own catechism progress"
ON public.catechism_paragraphs_read FOR DELETE
USING (auth.uid() = user_id);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_catechism_progress_user ON public.catechism_paragraphs_read(user_id);
