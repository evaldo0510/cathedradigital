
-- 1. Attach the existing prevent_role_escalation function as a trigger
CREATE TRIGGER prevent_role_escalation_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_role_escalation();

-- 2. Replace the overly permissive SELECT policy on profiles
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON public.profiles;

-- Users can read their own full profile
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow reading minimal info for community features (via public_profiles view)
-- The public_profiles view already exists and only exposes id, name, avatar_url, bio
