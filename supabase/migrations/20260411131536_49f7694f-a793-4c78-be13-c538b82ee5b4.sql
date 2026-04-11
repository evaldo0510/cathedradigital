-- Fix infinite recursion in user_roles SELECT policy
DROP POLICY IF EXISTS "Admins can view all user_roles" ON public.user_roles;
CREATE POLICY "Admins can view all user_roles" 
ON public.user_roles 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Simplify profiles update policy
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND (
    -- Admins can update anything on their own profile
    public.has_role(auth.uid(), 'admin'::app_role) OR
    -- Non-admins cannot change role or premium status
    (
      (role IS NOT DISTINCT FROM (SELECT role FROM public.profiles WHERE id = auth.uid())) AND
      (is_premium IS NOT DISTINCT FROM (SELECT is_premium FROM public.profiles WHERE id = auth.uid()))
    )
  )
);

-- Re-enable the original helper function but make it more robust
CREATE OR REPLACE FUNCTION public.can_update_own_profile(_profile_id uuid, _role text, _is_premium boolean, _email text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    _profile_id = auth.uid()
    AND (
      public.has_role(auth.uid(), 'admin'::app_role) OR
      (
        _role IS NOT DISTINCT FROM (SELECT role FROM public.profiles WHERE id = _profile_id)
        AND _is_premium IS NOT DISTINCT FROM (SELECT is_premium FROM public.profiles WHERE id = _profile_id)
      )
    )
$function$;
