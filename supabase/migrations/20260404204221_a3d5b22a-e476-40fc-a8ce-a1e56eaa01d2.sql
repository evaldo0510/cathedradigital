
-- Recreate view as security definer so it bypasses RLS on profiles
-- This is safe because it only exposes non-sensitive columns
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker = false)
AS SELECT id, name, avatar_url, bio FROM public.profiles;

-- Grant access
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;
