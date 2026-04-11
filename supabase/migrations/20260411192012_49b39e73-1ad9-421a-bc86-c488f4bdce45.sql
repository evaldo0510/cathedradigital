-- Recreate public_profiles view as security invoker
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles AS
SELECT id, name, avatar_url, role, is_premium, created_at
FROM public.profiles;

-- Recreate user_management_stats view as security invoker
DROP VIEW IF EXISTS public.user_management_stats;
CREATE VIEW public.user_management_stats AS
SELECT 
  (SELECT count(*) FROM public.profiles) as total_users,
  (SELECT count(*) FROM public.profiles WHERE is_premium = true) as premium_users,
  (SELECT count(*) FROM public.profiles WHERE role = 'admin') as admin_users;
