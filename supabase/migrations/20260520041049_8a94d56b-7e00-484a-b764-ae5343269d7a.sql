-- Create reading_marks table
CREATE TABLE public.reading_marks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL,
    content_id TEXT NOT NULL,
    chapter INTEGER,
    paragraph INTEGER,
    position FLOAT,
    label TEXT,
    url TEXT,
    is_last_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reading_marks ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own reading marks" 
ON public.reading_marks FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reading marks" 
ON public.reading_marks FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reading marks" 
ON public.reading_marks FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reading marks" 
ON public.reading_marks FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_reading_marks_updated_at
BEFORE UPDATE ON public.reading_marks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for performance
CREATE INDEX idx_reading_marks_user_id ON public.reading_marks(user_id);
CREATE INDEX idx_reading_marks_last_read ON public.reading_marks(user_id) WHERE is_last_read = true;