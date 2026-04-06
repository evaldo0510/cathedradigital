-- Remove the self-referencing policy that can cause infinite recursion
DROP POLICY IF EXISTS "Users can update own safe fields" ON public.profiles;