-- Fix storage policies to restrict public listing but allow public reading by name
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Public read access on public-assets" ON storage.objects;
CREATE POLICY "Public read access on public-assets"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'public-assets');
