-- Fuzzy search function leveraging the pg_trgm GIN index on saints(name, title)
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
  SELECT s.*
  FROM public.saints s
  WHERE
    s.name % search_query
    OR s.title % search_query
    OR s.name ILIKE '%' || search_query || '%'
    OR s.title ILIKE '%' || search_query || '%'
  ORDER BY
    GREATEST(
      similarity(s.name, search_query),
      similarity(COALESCE(s.title, ''), search_query) * 0.7
    ) DESC,
    s.name ASC
  LIMIT result_limit;
$$;

GRANT EXECUTE ON FUNCTION public.search_saints_fuzzy(text, int) TO anon, authenticated;