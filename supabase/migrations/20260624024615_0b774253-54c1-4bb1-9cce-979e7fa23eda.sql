-- Catechism official: public read, service_role write
GRANT SELECT ON public.catechism_official TO anon, authenticated;
GRANT ALL ON public.catechism_official TO service_role;

ALTER TABLE public.catechism_official ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view official texts" ON public.catechism_official;
CREATE POLICY "Public can view official texts"
  ON public.catechism_official FOR SELECT
  USING (true);

-- Catechism cache: public read, admin/service_role write
GRANT SELECT ON public.catechism_cache TO anon, authenticated;
GRANT ALL ON public.catechism_cache TO service_role;

ALTER TABLE public.catechism_cache ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can select cache" ON public.catechism_cache;
CREATE POLICY "Anyone can select cache"
  ON public.catechism_cache FOR SELECT
  USING (true);