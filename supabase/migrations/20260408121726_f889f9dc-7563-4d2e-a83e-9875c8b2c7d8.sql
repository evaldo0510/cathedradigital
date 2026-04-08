
-- Drop the overly permissive update policy
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create a restrictive update policy using the existing security definer function
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO public
USING (auth.uid() = id)
WITH CHECK (
  public.can_update_own_profile(id, role, is_premium, '')
);
