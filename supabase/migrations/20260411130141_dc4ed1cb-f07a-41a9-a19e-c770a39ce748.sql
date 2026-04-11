-- Add optional location/community fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS diocese TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS paroquia TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS movimento_pastoral TEXT DEFAULT NULL;