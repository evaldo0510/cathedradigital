
-- Sprint Biblioteca Católica — Onda 1 (Fundação · Parte 2)
-- View unificada + RPC de busca

CREATE OR REPLACE VIEW public.library_items_v1
WITH (security_invoker = true) AS
SELECT
  -- classificação Biblioteca
  CASE
    WHEN sw.category IN ('patristica', 'monastica')                THEN 'patristic'::public.library_kind
    WHEN sw.category IN ('doutor', 'escolastica', 'mistica',
                         'carmelita', 'franciscana', 'dominicana') THEN 'doctor'::public.library_kind
    WHEN sw.category = 'classic'                                    THEN 'classic'::public.library_kind
    WHEN sw.category = 'magisterio'                                 THEN 'magisterium'::public.library_kind
    ELSE 'saint_work'::public.library_kind
  END                                    AS library_kind,
  'saint_work'::text                     AS source_module,
  sw.id                                  AS id,
  sw.slug                                AS slug,
  sw.title                               AS title,
  sw.original_title                      AS original_title,
  sw.saint_id                            AS author_id,
  COALESCE(s.name, sw.saint_id)          AS author_label,
  ('/santos/' || sw.saint_id)            AS author_href,
  sw.category::text                      AS category,
  sw.year_written                        AS year,
  COALESCE(sw.synopsis, sw.abstract)     AS synopsis,
  sw.main_themes                         AS themes,
  sw.access_type::text                   AS access_type,
  sw.cover_image_url                     AS cover_image_url,
  sw.total_reading_minutes               AS reading_minutes,
  sw.chapter_count                       AS chapter_count,
  sw.ficha_completeness::text            AS ficha_completeness,
  sw.status::text                        AS status,
  sw.is_public_domain                    AS is_public_domain,
  sw.language                            AS language,
  sw.editorial_score                     AS editorial_score,
  sw.published_at                        AS published_at,
  sw.updated_at                          AS updated_at,
  -- rota canônica para o SPA
  ('/biblioteca/escritos/' || sw.saint_id || '/' || sw.slug) AS href,
  -- coluna de busca (FTS português)
  setweight(to_tsvector('portuguese', coalesce(sw.title, '')),                'A') ||
  setweight(to_tsvector('portuguese', coalesce(sw.original_title, '')),       'B') ||
  setweight(to_tsvector('portuguese', coalesce(s.name, sw.saint_id)),         'B') ||
  setweight(to_tsvector('portuguese', coalesce(sw.synopsis, sw.abstract,'')), 'C') ||
  setweight(to_tsvector('portuguese',
    coalesce(array_to_string(sw.main_themes, ' '), '')),                      'C')
                                          AS search_tsv
FROM public.saint_works sw
LEFT JOIN public.saints s ON s.id = sw.saint_id
WHERE sw.status = 'published';

-- Grants: leitura pública (Biblioteca é conteúdo público)
GRANT SELECT ON public.library_items_v1 TO anon, authenticated;

-- RPC de busca (FTS + filtros)
CREATE OR REPLACE FUNCTION public.search_library_items(
  p_query text DEFAULT NULL,
  p_kinds public.library_kind[] DEFAULT NULL,
  p_access text DEFAULT NULL,
  p_completeness text[] DEFAULT NULL,
  p_limit int DEFAULT 24,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  library_kind        public.library_kind,
  id                  uuid,
  slug                text,
  title               text,
  author_label        text,
  author_href         text,
  category            text,
  year                int,
  synopsis            text,
  themes              text[],
  access_type         text,
  cover_image_url     text,
  reading_minutes     int,
  chapter_count       int,
  ficha_completeness  text,
  is_public_domain    boolean,
  language            text,
  href                text,
  rank                real,
  total_count         bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH q AS (
    SELECT
      CASE WHEN p_query IS NULL OR btrim(p_query) = ''
           THEN NULL
           ELSE websearch_to_tsquery('portuguese', p_query) END AS tsq
  ),
  base AS (
    SELECT
      li.*,
      CASE WHEN (SELECT tsq FROM q) IS NULL
           THEN 0::real
           ELSE ts_rank(li.search_tsv, (SELECT tsq FROM q)) END AS rank
    FROM public.library_items_v1 li
    WHERE
      (p_kinds IS NULL OR li.library_kind = ANY(p_kinds))
      AND (p_access IS NULL OR li.access_type = p_access)
      AND (p_completeness IS NULL OR li.ficha_completeness = ANY(p_completeness))
      AND ((SELECT tsq FROM q) IS NULL OR li.search_tsv @@ (SELECT tsq FROM q))
  ),
  counted AS (SELECT count(*) AS total FROM base)
  SELECT
    b.library_kind, b.id, b.slug, b.title, b.author_label, b.author_href,
    b.category, b.year, b.synopsis, b.themes, b.access_type,
    b.cover_image_url, b.reading_minutes, b.chapter_count,
    b.ficha_completeness, b.is_public_domain, b.language, b.href,
    b.rank,
    (SELECT total FROM counted) AS total_count
  FROM base b
  ORDER BY b.rank DESC NULLS LAST, b.editorial_score DESC, b.updated_at DESC
  LIMIT GREATEST(p_limit, 1)
  OFFSET GREATEST(p_offset, 0);
$$;

GRANT EXECUTE ON FUNCTION public.search_library_items(text, public.library_kind[], text, text[], int, int) TO anon, authenticated;
