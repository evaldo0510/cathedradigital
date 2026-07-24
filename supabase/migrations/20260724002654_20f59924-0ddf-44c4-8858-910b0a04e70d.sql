DROP POLICY IF EXISTS "Authenticated can read avatars" ON storage.objects;
CREATE POLICY "Authenticated can read avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'avatars');