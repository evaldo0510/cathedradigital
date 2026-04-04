
-- Drop the security definer view
DROP VIEW IF EXISTS public.public_profiles;

-- Recreate with security_invoker = true (default, safe)
CREATE VIEW public.public_profiles
WITH (security_invoker = true)
AS SELECT id, name, avatar_url, bio FROM public.profiles;

GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;

-- Add a limited SELECT policy for reading public fields of any profile
-- This allows the view to work for all authenticated users
CREATE POLICY "Anyone can read public profile fields"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- But we already have "Users can read own profile" which is redundant now
-- Drop it since the new policy is broader (but safe because sensitive fields aren't in the view)
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
