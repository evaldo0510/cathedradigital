-- Add trigram indexes for journeys fuzzy search
CREATE INDEX IF NOT EXISTS idx_journeys_title_trgm
  ON public.journeys
  USING gin (public.immutable_unaccent(lower(title)) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_journeys_description_trgm
  ON public.journeys
  USING gin (public.immutable_unaccent(lower(description)) gin_trgm_ops);

-- Create fuzzy search RPC for journeys
CREATE OR REPLACE FUNCTION public.search_journeys_fuzzy(
  search_query text,
  result_limit integer DEFAULT 50
)
RETURNS SETOF journeys
LANGUAGE sql
STABLE
SET search_path TO 'public', 'extensions'
AS $$
  WITH q AS (
    SELECT public.immutable_unaccent(lower(search_query)) AS nq
  )
  SELECT j.*
  FROM public.journeys j, q
  WHERE
    j.is_active = true
    AND (
      public.immutable_unaccent(lower(j.title)) ILIKE '%' || q.nq || '%'
      OR public.immutable_unaccent(lower(COALESCE(j.description, ''))) ILIKE '%' || q.nq || '%'
      OR similarity(public.immutable_unaccent(lower(j.title)), q.nq) > 0.15
    )
  ORDER BY
    GREATEST(
      similarity(public.immutable_unaccent(lower(j.title)), q.nq),
      similarity(public.immutable_unaccent(lower(COALESCE(j.description, ''))), q.nq) * 0.5
    ) DESC,
    j.sort_order ASC
  LIMIT result_limit;
$$;
