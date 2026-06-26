CREATE POLICY "admins manage bible-dumps"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'bible-dumps' AND public.is_current_user_admin())
  WITH CHECK (bucket_id = 'bible-dumps' AND public.is_current_user_admin());