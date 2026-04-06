
DROP POLICY "Service can insert sensitive data" ON public.user_sensitive_data;

-- Since handle_new_user is SECURITY DEFINER, it bypasses RLS.
-- No INSERT policy needed for authenticated users.
