
-- Restore column grants (admins need full read via has_role policy)
GRANT SELECT (contact_email) ON public.partners TO authenticated;

-- Drop the broad public policy that exposed contact_email
DROP POLICY IF EXISTS "Public can view approved partners" ON public.partners;

-- Create safe public view (no contact_email)
CREATE OR REPLACE VIEW public.public_partners
WITH (security_invoker = true) AS
SELECT id, name, description, logo_url, website_url, status, created_at, updated_at
FROM public.partners
WHERE status = 'approved';

GRANT SELECT ON public.public_partners TO anon, authenticated;

-- Allow admins to still read all columns on the base table
CREATE POLICY "Admins can view all partners"
ON public.partners
FOR SELECT
TO authenticated
USING (auth_internal.has_role(auth.uid(), 'admin'::app_role));
