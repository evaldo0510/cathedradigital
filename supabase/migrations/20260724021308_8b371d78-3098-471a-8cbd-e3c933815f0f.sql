ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS partner_type text NOT NULL DEFAULT 'institution';

ALTER TABLE public.partners
  DROP CONSTRAINT IF EXISTS partners_partner_type_check;
ALTER TABLE public.partners
  ADD CONSTRAINT partners_partner_type_check
  CHECK (partner_type IN ('institution', 'company', 'individual'));

DROP POLICY IF EXISTS "Anyone can submit a partnership request" ON public.partners;
CREATE POLICY "Anyone can submit a partnership request"
  ON public.partners
  FOR INSERT
  WITH CHECK (
    status = 'pending'
    AND contact_email IS NOT NULL
    AND length(contact_email) >= 5
    AND length(name) BETWEEN 2 AND 200
    AND partner_type IN ('institution', 'company', 'individual')
  );

-- Recria a view (DROP + CREATE porque a ordem de colunas mudou)
DROP VIEW IF EXISTS public.public_partners;
CREATE VIEW public.public_partners AS
  SELECT id, name, description, logo_url, website_url, status, partner_type, created_at, updated_at
  FROM public.partners
  WHERE status = 'approved';

GRANT SELECT ON public.public_partners TO anon, authenticated;

-- Storage policies para bucket partner-logos (o bucket é criado a seguir via storage_create_bucket)
DROP POLICY IF EXISTS "Public read partner-logos" ON storage.objects;
CREATE POLICY "Public read partner-logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'partner-logos');

DROP POLICY IF EXISTS "Anyone can upload to partner-logos" ON storage.objects;
CREATE POLICY "Anyone can upload to partner-logos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'partner-logos'
    AND (storage.foldername(name))[1] = 'submissions'
  );

DROP POLICY IF EXISTS "Admins manage partner-logos" ON storage.objects;
CREATE POLICY "Admins manage partner-logos"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'partner-logos' AND auth_internal.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (bucket_id = 'partner-logos' AND auth_internal.has_role(auth.uid(), 'admin'::app_role));