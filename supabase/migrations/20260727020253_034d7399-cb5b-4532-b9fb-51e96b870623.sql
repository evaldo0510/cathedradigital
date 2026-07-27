-- 1. community_posts: restrict SELECT
DROP POLICY IF EXISTS "Anyone authenticated can read posts" ON public.community_posts;

CREATE POLICY "Read approved or own posts"
  ON public.community_posts
  FOR SELECT
  TO authenticated
  USING (
    status = 'approved'
    OR auth.uid() = user_id
    OR auth_internal.is_admin()
  );

-- 2. partner-logos storage: restrict public SELECT to approved/ folder
DROP POLICY IF EXISTS "Public read partner-logos" ON storage.objects;

CREATE POLICY "Public read approved partner-logos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (
    bucket_id = 'partner-logos'
    AND (storage.foldername(name))[1] = 'approved'
  );

CREATE POLICY "Users read own partner-logos submissions"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'partner-logos'
    AND (storage.foldername(name))[1] = 'submissions'
    AND owner = auth.uid()
  );