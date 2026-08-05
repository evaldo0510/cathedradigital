-- 1. Proteger o segredo de webhook: coluna nunca mais legível pelo cliente
ALTER TABLE public.bible_audit_notifications
  ADD COLUMN IF NOT EXISTS has_secret boolean
  GENERATED ALWAYS AS (secret_key IS NOT NULL) STORED;

REVOKE SELECT (secret_key), UPDATE (secret_key), INSERT (secret_key)
  ON public.bible_audit_notifications FROM authenticated;
REVOKE ALL ON public.bible_audit_notifications FROM anon;
GRANT ALL ON public.bible_audit_notifications TO service_role;

-- 2. coming_soon_leads: anônimo só pode inserir; cobertura CRUD completa para admin
REVOKE ALL ON public.coming_soon_leads FROM anon;
GRANT INSERT ON public.coming_soon_leads TO anon;
REVOKE ALL ON public.coming_soon_leads FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coming_soon_leads TO authenticated;
GRANT ALL ON public.coming_soon_leads TO service_role;

DROP POLICY IF EXISTS "Admins can update leads" ON public.coming_soon_leads;
CREATE POLICY "Admins can update leads"
  ON public.coming_soon_leads FOR UPDATE TO authenticated
  USING (auth_internal.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (auth_internal.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete leads" ON public.coming_soon_leads;
CREATE POLICY "Admins can delete leads"
  ON public.coming_soon_leads FOR DELETE TO authenticated
  USING (auth_internal.has_role(auth.uid(), 'admin'::app_role));