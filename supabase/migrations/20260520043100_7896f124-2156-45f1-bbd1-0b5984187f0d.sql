-- Add new columns to profiles for reading settings and goals
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS reading_settings JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS journey_reminder_time TEXT,
ADD COLUMN IF NOT EXISTS weekly_goal INTEGER DEFAULT 5;

-- Update RLS (already exists but just to be sure)
-- Assuming profiles already has appropriate RLS policies.
