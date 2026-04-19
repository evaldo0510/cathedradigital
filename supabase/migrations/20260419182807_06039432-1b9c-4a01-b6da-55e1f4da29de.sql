CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.search_saints_fuzzy(
  search_query text,
  result_limit int DEFAULT 50
)
RETURNS SETOF public.saints
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, extensions
AS $$
  WITH q AS (
    SELECT extensions.unaccent(lower(search_query)) AS nq
  )
  SELECT s.*
  FROM public.saints s, q
  WHERE
    extensions.unaccent(lower(s.name)) ILIKE '%' || q.nq || '%'
    OR extensions.unaccent(lower(COALESCE(s.title, ''))) ILIKE '%' || q.nq || '%'
    OR similarity(extensions.unaccent(lower(s.name)), q.nq) > 0.15
    OR similarity(extensions.unaccent(lower(COALESCE(s.title, ''))), q.nq) > 0.15
  ORDER BY
    GREATEST(
      similarity(extensions.unaccent(lower(s.name)), q.nq),
      similarity(extensions.unaccent(lower(COALESCE(s.title, ''))), q.nq) * 0.7
    ) DESC,
    s.name ASC
  LIMIT result_limit;
$$;

GRANT EXECUTE ON FUNCTION public.search_saints_fuzzy(text, int) TO anon, authenticated;

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
  WITH q AS (
    SELECT extensions.unaccent(lower(search_query)) AS nq
  )
  SELECT g.*
  FROM public.glossary g, q
  WHERE
    extensions.unaccent(lower(g.term)) ILIKE '%' || q.nq || '%'
    OR extensions.unaccent(lower(COALESCE(g.definition, ''))) ILIKE '%' || q.nq || '%'
    OR similarity(extensions.unaccent(lower(g.term)), q.nq) > 0.15
  ORDER BY
    GREATEST(
      similarity(extensions.unaccent(lower(g.term)), q.nq),
      similarity(extensions.unaccent(lower(COALESCE(g.definition, ''))), q.nq) * 0.5
    ) DESC,
    g.term ASC
  LIMIT result_limit;
$$;

GRANT EXECUTE ON FUNCTION public.search_glossary_fuzzy(text, int) TO anon, authenticated;