
-- Permitir leitura pública (conteúdo doutrinal público, sem dados sensíveis)
GRANT SELECT ON public.bible_connections TO anon;

DROP POLICY IF EXISTS "Anyone can read bible connections" ON public.bible_connections;
CREATE POLICY "Public can read bible connections"
ON public.bible_connections
FOR SELECT
TO anon, authenticated
USING (true);
