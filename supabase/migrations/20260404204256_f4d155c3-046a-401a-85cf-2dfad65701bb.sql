
-- Remove the overly broad policy
DROP POLICY IF EXISTS "Anyone can read public profile fields" ON public.profiles;

-- Restore own-profile-only policy
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Recreate public_profiles as security definer view (intentional - only exposes safe columns)
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker = false)
AS SELECT id, name, avatar_url, bio FROM public.profiles;

GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;
