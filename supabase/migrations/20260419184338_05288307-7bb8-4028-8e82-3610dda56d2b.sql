-- Immutable wrapper around unaccent so it can be used in expression indexes.
-- Safe to re-run: CREATE OR REPLACE only changes the body if needed.
CREATE OR REPLACE FUNCTION public.immutable_unaccent(text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
STRICT
SET search_path TO 'public', 'extensions'
AS $$
  SELECT extensions.unaccent('extensions.unaccent', $1);
$$;

-- GIN trigram indexes on tags(label) and tags(category), accent-insensitive.
CREATE INDEX IF NOT EXISTS idx_tags_label_trgm
  ON public.tags USING gin (public.immutable_unaccent(lower(label)) extensions.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_tags_category_trgm
  ON public.tags USING gin (public.immutable_unaccent(lower(coalesce(category, ''))) extensions.gin_trgm_ops);

-- Fuzzy search RPC mirroring search_glossary_fuzzy / search_saints_fuzzy.
CREATE OR REPLACE FUNCTION public.search_tags_fuzzy(
  search_query text,
  result_limit integer DEFAULT 50
)
RETURNS SETOF public.tags
LANGUAGE sql
STABLE
SET search_path TO 'public', 'extensions'
AS $function$
  WITH q AS (
    SELECT public.immutable_unaccent(lower(search_query)) AS nq
  )
  SELECT t.*
  FROM public.tags t, q
  WHERE
    public.immutable_unaccent(lower(t.label)) ILIKE '%' || q.nq || '%'
    OR public.immutable_unaccent(lower(COALESCE(t.category, ''))) ILIKE '%' || q.nq || '%'
    OR similarity(public.immutable_unaccent(lower(t.label)), q.nq) > 0.15
  ORDER BY
    GREATEST(
      similarity(public.immutable_unaccent(lower(t.label)), q.nq),
      similarity(public.immutable_unaccent(lower(COALESCE(t.category, ''))), q.nq) * 0.5
    ) DESC,
    t.label ASC
  LIMIT result_limit;
$function$;