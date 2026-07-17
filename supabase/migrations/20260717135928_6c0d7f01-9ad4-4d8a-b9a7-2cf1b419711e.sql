
CREATE OR REPLACE FUNCTION public.search_glossary_fuzzy(search_query text, result_limit integer DEFAULT 50)
 RETURNS SETOF glossary
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  WITH q AS (SELECT extensions.unaccent(lower(search_query)) AS nq)
  SELECT g.*
  FROM public.glossary g, q
  WHERE
    extensions.unaccent(lower(g.term)) ILIKE '%' || q.nq || '%'
    OR extensions.unaccent(lower(COALESCE(g.definition, ''))) ILIKE '%' || q.nq || '%'
    OR extensions.similarity(extensions.unaccent(lower(g.term)), q.nq) > 0.15
  ORDER BY
    GREATEST(
      extensions.similarity(extensions.unaccent(lower(g.term)), q.nq),
      extensions.similarity(extensions.unaccent(lower(COALESCE(g.definition, ''))), q.nq) * 0.5
    ) DESC,
    g.term ASC
  LIMIT result_limit;
$function$;

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
    extensions.unaccent(lower(s.name)) ILIKE '%' || q.nq || '%'
    OR extensions.unaccent(lower(COALESCE(s.title, ''))) ILIKE '%' || q.nq || '%'
    OR extensions.similarity(extensions.unaccent(lower(s.name)), q.nq) > 0.15
    OR extensions.similarity(extensions.unaccent(lower(COALESCE(s.title, ''))), q.nq) > 0.15
  ORDER BY
    GREATEST(
      extensions.similarity(extensions.unaccent(lower(s.name)), q.nq),
      extensions.similarity(extensions.unaccent(lower(COALESCE(s.title, ''))), q.nq) * 0.7
    ) DESC,
    s.name ASC
  LIMIT result_limit;
$function$;

CREATE OR REPLACE FUNCTION public.search_community_posts_fuzzy(search_query text, result_limit integer DEFAULT 50)
 RETURNS SETOF community_posts
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  WITH q AS (SELECT extensions.unaccent(lower(search_query)) AS nq)
  SELECT p.*
  FROM public.community_posts p, q
  WHERE
    p.parent_id IS NULL
    AND COALESCE(p.status, 'approved') <> 'rejected'
    AND (
      extensions.unaccent(lower(COALESCE(p.title, ''))) ILIKE '%' || q.nq || '%'
      OR extensions.unaccent(lower(p.content)) ILIKE '%' || q.nq || '%'
      OR extensions.similarity(extensions.unaccent(lower(COALESCE(p.title, ''))), q.nq) > 0.15
      OR extensions.similarity(extensions.unaccent(lower(p.content)), q.nq) > 0.15
    )
  ORDER BY
    GREATEST(
      extensions.similarity(extensions.unaccent(lower(COALESCE(p.title, ''))), q.nq),
      extensions.similarity(extensions.unaccent(lower(p.content)), q.nq) * 0.6
    ) DESC,
    p.created_at DESC
  LIMIT result_limit;
$function$;

CREATE OR REPLACE FUNCTION public.search_tags_fuzzy(search_query text, result_limit integer DEFAULT 50)
 RETURNS SETOF tags
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  WITH q AS (SELECT public.immutable_unaccent(lower(search_query)) AS nq)
  SELECT t.*
  FROM public.tags t, q
  WHERE
    public.immutable_unaccent(lower(t.label)) ILIKE '%' || q.nq || '%'
    OR public.immutable_unaccent(lower(COALESCE(t.category, ''))) ILIKE '%' || q.nq || '%'
    OR extensions.similarity(public.immutable_unaccent(lower(t.label)), q.nq) > 0.15
  ORDER BY
    GREATEST(
      extensions.similarity(public.immutable_unaccent(lower(t.label)), q.nq),
      extensions.similarity(public.immutable_unaccent(lower(COALESCE(t.category, ''))), q.nq) * 0.5
    ) DESC,
    t.label ASC
  LIMIT result_limit;
$function$;

CREATE OR REPLACE FUNCTION public.search_journeys_fuzzy(search_query text, result_limit integer DEFAULT 50)
 RETURNS SETOF journeys
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  WITH q AS (SELECT public.immutable_unaccent(lower(search_query)) AS nq)
  SELECT j.*
  FROM public.journeys j, q
  WHERE
    j.is_active = true
    AND (
      public.immutable_unaccent(lower(j.title)) ILIKE '%' || q.nq || '%'
      OR public.immutable_unaccent(lower(COALESCE(j.description, ''))) ILIKE '%' || q.nq || '%'
      OR extensions.similarity(public.immutable_unaccent(lower(j.title)), q.nq) > 0.15
    )
  ORDER BY
    GREATEST(
      extensions.similarity(public.immutable_unaccent(lower(j.title)), q.nq),
      extensions.similarity(public.immutable_unaccent(lower(COALESCE(j.description, ''))), q.nq) * 0.5
    ) DESC,
    j.sort_order ASC
  LIMIT result_limit;
$function$;
