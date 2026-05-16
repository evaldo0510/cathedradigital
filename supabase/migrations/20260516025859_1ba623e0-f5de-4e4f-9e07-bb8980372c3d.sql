-- Add is_reviewed column to spiritual_journal
ALTER TABLE public.spiritual_journal 
ADD COLUMN is_reviewed BOOLEAN NOT NULL DEFAULT false;

-- Add is_reviewed column to user_notes
ALTER TABLE public.user_notes 
ADD COLUMN is_reviewed BOOLEAN NOT NULL DEFAULT false;