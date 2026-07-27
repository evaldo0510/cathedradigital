DROP POLICY IF EXISTS "Authenticated can upload partner-logos submissions" ON storage.objects;

CREATE POLICY "Authenticated can upload partner-logos submissions"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'partner-logos'
  AND (storage.foldername(name))[1] = 'submissions'
  AND (storage.foldername(name))[2] = auth.uid()::text
  AND owner = auth.uid()
);