-- Helper function to check if the current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Policies for public-assets bucket (admins only for management)
CREATE POLICY "Admins can upload to public-assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'public-assets' AND public.is_admin());

CREATE POLICY "Admins can update public-assets"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'public-assets' AND public.is_admin());

CREATE POLICY "Admins can delete from public-assets"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'public-assets' AND public.is_admin());

-- Administrative policies for avatars (moderation)
CREATE POLICY "Admins can manage all avatars"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'avatars' AND public.is_admin());

-- Ensure the public-assets SELECT policy is robust
DROP POLICY IF EXISTS "Public read access on public-assets" ON storage.objects;
CREATE POLICY "Public read access on public-assets"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'public-assets');
