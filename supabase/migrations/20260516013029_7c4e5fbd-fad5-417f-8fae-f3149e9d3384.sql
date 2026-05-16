-- Add preferred_reminder_time to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS preferred_reminder_time TIME;

-- Ensure trail_progress has appropriate indexes
CREATE INDEX IF NOT EXISTS idx_trail_progress_user_id ON public.trail_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_trail_progress_trail_id ON public.trail_progress(trail_id);

-- Add column for reflection answers to user_notes or just use existing.
-- We can add a specialized category if needed.
