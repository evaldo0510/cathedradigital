-- Glossário: público vê apenas publicados; editor+ vê tudo
DROP POLICY IF EXISTS "Glossary is viewable by everyone" ON public.glossary;

CREATE POLICY "glossary_public_read_published"
ON public.glossary
FOR SELECT
USING (
  status = 'published'
  OR (auth.uid() IS NOT NULL AND public.has_glossary_role(auth.uid(), 'editor'))
);

-- Catecismo oficial: público vê apenas publicados; admin vê tudo
DROP POLICY IF EXISTS "Public can view official texts" ON public.catechism_official;

CREATE POLICY "catechism_official_public_read_published"
ON public.catechism_official
FOR SELECT
USING (
  status = 'published'
  OR (auth.uid() IS NOT NULL AND public.is_current_user_admin())
);