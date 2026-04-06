
-- 1. Rewrite can_update_own_profile to not accept untrusted params
-- Instead, it reads the current DB values and compares against the NEW row values
CREATE OR REPLACE FUNCTION public.can_update_own_profile(
  _profile_id uuid,
  _role text,
  _is_premium boolean,
  _email text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR (
      -- Ensure the profile being checked belongs to the caller
      _profile_id = auth.uid()
      AND EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role IS NOT DISTINCT FROM _role
          AND p.is_premium IS NOT DISTINCT FROM _is_premium
          AND p.email IS NOT DISTINCT FROM _email
      )
    );
$$;

-- 2. Restrict journey_steps: free steps public, premium steps require auth + premium
DROP POLICY IF EXISTS "Journey steps are viewable by everyone" ON public.journey_steps;

CREATE POLICY "Free journey steps are public"
ON public.journey_steps
FOR SELECT
TO public
USING (is_free = true);

CREATE POLICY "Premium journey steps require premium"
ON public.journey_steps
FOR SELECT
TO authenticated
USING (
  is_free = true
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.is_premium = true
  )
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);
