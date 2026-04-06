CREATE POLICY "Users can insert own sensitive data"
  ON public.user_sensitive_data FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);