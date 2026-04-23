-- Remove broad public SELECT policies to prevent bucket listing
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public read access on public-assets" ON storage.objects;
