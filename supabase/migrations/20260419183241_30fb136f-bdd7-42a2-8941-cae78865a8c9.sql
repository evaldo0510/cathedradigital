-- Índices GIN com pg_trgm para busca rápida em community_posts
CREATE INDEX IF NOT EXISTS idx_community_posts_title_trgm
  ON public.community_posts USING gin (title extensions.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_community_posts_content_trgm
  ON public.community_posts USING gin (content extensions.gin_trgm_ops);

-- RPC para busca fuzzy insensível a acentos/case, com ranqueamento por relevância
CREATE OR REPLACE FUNCTION public.search_community_posts_fuzzy(
  search_query text,
  result_limit int DEFAULT 50
)
RETURNS SETOF public.community_posts
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, extensions
AS $$
  WITH q AS (
    SELECT extensions.unaccent(lower(search_query)) AS nq
  )
  SELECT p.*
  FROM public.community_posts p, q
  WHERE
    p.parent_id IS NULL
    AND COALESCE(p.status, 'approved') <> 'rejected'
    AND (
      extensions.unaccent(lower(COALESCE(p.title, ''))) ILIKE '%' || q.nq || '%'
      OR extensions.unaccent(lower(p.content)) ILIKE '%' || q.nq || '%'
      OR similarity(extensions.unaccent(lower(COALESCE(p.title, ''))), q.nq) > 0.15
      OR similarity(extensions.unaccent(lower(p.content)), q.nq) > 0.15
    )
  ORDER BY
    GREATEST(
      similarity(extensions.unaccent(lower(COALESCE(p.title, ''))), q.nq),
      similarity(extensions.unaccent(lower(p.content)), q.nq) * 0.6
    ) DESC,
    p.created_at DESC
  LIMIT result_limit;
$$;

GRANT EXECUTE ON FUNCTION public.search_community_posts_fuzzy(text, int) TO authenticated;