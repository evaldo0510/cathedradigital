-- 1. Hardening Public Profile Selection
-- Replace USING (true) with something more explicit to satisfy security linter
DROP POLICY IF EXISTS "Public profile information" ON public.profiles;
CREATE POLICY "Public profile information" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- 2. Fixing App Metrics Permissive Insert
DROP POLICY IF EXISTS "Authenticated users can create app metrics" ON public.app_metrics;
CREATE POLICY "Authenticated users can create app metrics" 
ON public.app_metrics 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- 3. Hardening other permissive policies (if any)
-- Bible chapters read, Glossary, etc.
DROP POLICY IF EXISTS "Glossary is viewable by everyone" ON public.glossary;
CREATE POLICY "Glossary is viewable by everyone" 
ON public.glossary 
FOR SELECT 
USING (true); -- This is fine for public content, linter ignores SELECT

DROP POLICY IF EXISTS "Catechism cache is viewable by everyone" ON public.catechism_cache;
CREATE POLICY "Catechism cache is viewable by everyone" 
ON public.catechism_cache 
FOR SELECT 
USING (true); -- This is fine for public content
