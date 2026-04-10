-- Create user_emotions table to store historical data
CREATE TABLE public.user_emotions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    emotion_type TEXT NOT NULL,
    score FLOAT NOT NULL DEFAULT 1.0,
    context_text TEXT,
    source_feature TEXT, -- e.g., 'lectio', 'liturgy', 'chat'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_psychological_profiles table for aggregated state
CREATE TABLE public.user_psychological_profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    dominant_emotion TEXT,
    mood_history JSONB DEFAULT '[]'::jsonb, -- Array of recent emotions
    traits JSONB DEFAULT '{}'::jsonb, -- Progressive personality traits
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_emotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_psychological_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for user_emotions
CREATE POLICY "Users can view their own emotions" 
ON public.user_emotions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own emotions" 
ON public.user_emotions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policies for user_psychological_profiles
CREATE POLICY "Users can view their own psychological profile" 
ON public.user_psychological_profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own psychological profile" 
ON public.user_psychological_profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own psychological profile" 
ON public.user_psychological_profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Trigger for psychological profile update timestamp
CREATE OR REPLACE FUNCTION public.update_last_updated_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_psychological_profile_timestamp
BEFORE UPDATE ON public.user_psychological_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_last_updated_column();
