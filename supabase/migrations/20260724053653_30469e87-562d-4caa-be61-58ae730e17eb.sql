CREATE OR REPLACE FUNCTION public.search_saints_fuzzy(search_query text, result_limit integer DEFAULT 50)
 RETURNS SETOF saints
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  WITH q AS (SELECT extensions.unaccent(lower(search_query)) AS nq)
  SELECT s.*
  FROM public.saints s, q
  WHERE
    s.status = 'active'
    AND (
      extensions.unaccent(lower(s.name)) ILIKE '%' || q.nq || '%'
      OR extensions.unaccent(lower(COALESCE(s.title, ''))) ILIKE '%' || q.nq || '%'
      OR extensions.similarity(extensions.unaccent(lower(s.name)), q.nq) > 0.15
      OR extensions.similarity(extensions.unaccent(lower(COALESCE(s.title, ''))), q.nq) > 0.15
    )
  ORDER BY
    GREATEST(
      extensions.similarity(extensions.unaccent(lower(s.name)), q.nq),
      extensions.similarity(extensions.unaccent(lower(COALESCE(s.title, ''))), q.nq) * 0.7
    ) DESC,
    s.name ASC
  LIMIT result_limit;
$function$;