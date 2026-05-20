-- Create ritual_progress table
CREATE TABLE IF NOT EXISTS public.ritual_progress (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    progress_percent INTEGER NOT NULL DEFAULT 0,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, date)
);

-- Enable RLS for ritual_progress
ALTER TABLE public.ritual_progress ENABLE ROW LEVEL SECURITY;

-- Policies for ritual_progress
CREATE POLICY "Users can view their own ritual progress"
    ON public.ritual_progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ritual progress"
    ON public.ritual_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ritual progress"
    ON public.ritual_progress FOR UPDATE
    USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for ritual_progress
CREATE TRIGGER update_ritual_progress_updated_at
    BEFORE UPDATE ON public.ritual_progress
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Update profiles table for ritual settings
-- Check if columns exist before adding (in case of re-run)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'ritual_reminder_time') THEN
        ALTER TABLE public.profiles ADD COLUMN ritual_reminder_time TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'ritual_silent_mode') THEN
        ALTER TABLE public.profiles ADD COLUMN ritual_silent_mode BOOLEAN DEFAULT FALSE;
    END IF;
END $$;
