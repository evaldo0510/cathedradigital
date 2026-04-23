-- Storage policies for avatars
DROP POLICY IF EXISTS "Public read access on avatars" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read all avatars" ON storage.objects;
CREATE POLICY "Admins can read all avatars" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'avatars' AND 
    (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  );

DROP POLICY IF EXISTS "Users can read own avatar" ON storage.objects;
CREATE POLICY "Users can read own avatar" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for public-assets
DROP POLICY IF EXISTS "Public read access on public-assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read all public-assets" ON storage.objects;
CREATE POLICY "Admins can read all public-assets" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'public-assets' AND 
    (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  );

-- Admin access for user_sensitive_data
DROP POLICY IF EXISTS "Admins can read all sensitive data" ON public.user_sensitive_data;
CREATE POLICY "Admins can read all sensitive data" ON public.user_sensitive_data
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
