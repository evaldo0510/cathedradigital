
-- 1. catechism_import_queue: restrict SELECT/INSERT to admins
DROP POLICY IF EXISTS "Authenticated can read queue" ON public.catechism_import_queue;
DROP POLICY IF EXISTS "Authenticated can enqueue" ON public.catechism_import_queue;

CREATE POLICY "Admins can read queue"
  ON public.catechism_import_queue
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can enqueue"
  ON public.catechism_import_queue
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. editorial_pipeline_events: restrict SELECT to staff/admin
DROP POLICY IF EXISTS "editorial_pipeline_events_read_all" ON public.editorial_pipeline_events;

CREATE POLICY "editorial_pipeline_events_read_staff"
  ON public.editorial_pipeline_events
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.glossary_permissions gp
      WHERE gp.user_id = auth.uid()
        AND gp.role = ANY (ARRAY['editor'::text, 'reviewer'::text, 'admin'::text])
    )
  );

-- 3. nexus_synonyms: use centralized has_role()
DROP POLICY IF EXISTS "Admins can manage nexus synonyms" ON public.nexus_synonyms;

CREATE POLICY "Admins can manage nexus synonyms"
  ON public.nexus_synonyms
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. partner-logos storage bucket: require authentication for upload
DROP POLICY IF EXISTS "Anyone can upload to partner-logos" ON storage.objects;

CREATE POLICY "Authenticated can upload partner-logos submissions"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'partner-logos'
    AND (storage.foldername(name))[1] = 'submissions'
  );
