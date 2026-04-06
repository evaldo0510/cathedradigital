
-- 1. Drop the policy that depends on email column
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- 2. Now drop the columns
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS diagnosis_result;

-- 3. Update the function without email check (keep signature for compatibility)
CREATE OR REPLACE FUNCTION public.can_update_own_profile(_profile_id uuid, _role text, _is_premium boolean, _email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    _profile_id = auth.uid()
    AND _role IS NOT DISTINCT FROM (SELECT role FROM public.profiles WHERE id = _profile_id)
    AND _is_premium IS NOT DISTINCT FROM (SELECT is_premium FROM public.profiles WHERE id = _profile_id)
$$;

-- 4. Recreate profile update policy without email
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND can_update_own_profile(id, role, is_premium, '')
  );
