
-- Allow all authenticated users to read profiles for leaderboard
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Authenticated users can read profiles"
ON public.profiles FOR SELECT TO authenticated
USING (true);
