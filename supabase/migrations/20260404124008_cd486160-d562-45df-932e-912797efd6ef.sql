-- Fix: recreate view with SECURITY INVOKER
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles
  WITH (security_invoker = true)
  AS SELECT id, name, avatar_url, bio FROM public.profiles;

GRANT SELECT ON public.public_profiles TO authenticated;