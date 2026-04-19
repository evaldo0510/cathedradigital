-- Add pg_trgm GIN indexes on glossary for fast fuzzy search
CREATE INDEX IF NOT EXISTS idx_glossary_term_trgm
  ON public.glossary USING gin (term extensions.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_glossary_definition_trgm
  ON public.glossary USING gin (definition extensions.gin_trgm_ops);

-- Fuzzy search RPC for glossary, ranked by similarity
CREATE OR REPLACE FUNCTION public.search_glossary_fuzzy(
  search_query text,
  result_limit int DEFAULT 50
)
RETURNS SETOF public.glossary
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, extensions
AS $$
  SELECT g.*
  FROM public.glossary g
  WHERE
    g.term % search_query
    OR g.definition % search_query
    OR g.term ILIKE '%' || search_query || '%'
    OR g.definition ILIKE '%' || search_query || '%'
  ORDER BY
    GREATEST(
      similarity(g.term, search_query),
      similarity(COALESCE(g.definition, ''), search_query) * 0.5
    ) DESC,
    g.term ASC
  LIMIT result_limit;
$$;

GRANT EXECUTE ON FUNCTION public.search_glossary_fuzzy(text, int) TO anon, authenticated;