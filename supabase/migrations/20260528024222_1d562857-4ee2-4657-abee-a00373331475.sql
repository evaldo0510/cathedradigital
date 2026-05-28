-- Add preference columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS contemplative_preferences JSONB DEFAULT '{
  "rhythm": "moderate",
  "suggestion_mode": "balanced",
  "recurring_themes": []
}'::jsonb,
ADD COLUMN IF NOT EXISTS spiritual_themes TEXT[] DEFAULT '{}';

-- Enable Real-time for progress and profile tables
-- First, check if the publication exists (Supabase default is 'supabase_realtime')
-- If not, we might need to create it, but typically it exists.
-- We use DO block to be safe.

DO $$
BEGIN
  -- Enable real-time for specific tables if not already enabled
  -- We assume 'supabase_realtime' publication exists as per Lovable/Supabase defaults
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'itineraria_progress'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.itineraria_progress;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'journey_progress'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.journey_progress;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'reading_marks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reading_marks;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'reading_reflections'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reading_reflections;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;
