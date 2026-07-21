
DROP POLICY IF EXISTS "Anyone can read allowed terms" ON public.language_allowlist;

CREATE POLICY "Admins can read allowed terms"
ON public.language_allowlist
FOR SELECT
TO authenticated
USING (auth_internal.has_role(auth.uid(), 'admin'::app_role));
