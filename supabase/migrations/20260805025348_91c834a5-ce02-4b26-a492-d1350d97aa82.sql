-- Sprint 4 — Biblioteca Inteligente (Global Search V2)

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'search_result_type') THEN
        CREATE TYPE public.search_result_type AS ENUM (
          'bible', 'catechism', 'saint', 'patristic', 'magisterium', 'prayer', 'journey', 'glossary'
        );
    END IF;
END $$;

CREATE OR REPLACE FUNCTION public.global_search_v2(
  p_query TEXT,
  p_limit INT DEFAULT 20
)
RETURNS TABLE (
  id TEXT,
  title TEXT,
  subtitle TEXT,
  content TEXT,
  item_type public.search_result_type,
  slug TEXT,
  rank REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  (
    -- BÍBLIA
    SELECT 
      v.id::text,
      'Versículo ' || v.number::text as title,
      b.name || ' ' || c.number::text as subtitle,
      v.text as content,
      'bible'::public.search_result_type as item_type,
      b.slug || '/' || c.number::text || '#' || v.number::text as slug,
      ts_rank_cd(to_tsvector('portuguese', v.text), plainto_tsquery('portuguese', p_query)) as rank
    FROM public.bible_verses v
    JOIN public.bible_chapters c ON v.chapter_id = c.id
    JOIN public.bible_books b ON c.book_id = b.id
    WHERE to_tsvector('portuguese', v.text) @@ plainto_tsquery('portuguese', p_query)

    UNION ALL

    -- CATECISMO
    SELECT 
      p.id::text,
      'Parágrafo ' || p.number::text as title,
      COALESCE(p.theme, 'Catecismo da Igreja Católica') as subtitle,
      p.content as content,
      'catechism'::public.search_result_type as item_type,
      p.number::text as slug,
      ts_rank_cd(to_tsvector('portuguese', p.content || ' ' || COALESCE(p.theme, '')), plainto_tsquery('portuguese', p_query)) as rank
    FROM public.catechism_paragraphs p
    WHERE to_tsvector('portuguese', p.content || ' ' || COALESCE(p.theme, '')) @@ plainto_tsquery('portuguese', p_query)

    UNION ALL

    -- SANTOS
    SELECT 
      s.id::text,
      s.name as title,
      s.title as subtitle,
      s.biography as content,
      'saint'::public.search_result_type as item_type,
      s.slug as slug,
      ts_rank_cd(to_tsvector('portuguese', s.name || ' ' || COALESCE(s.title, '') || ' ' || s.biography), plainto_tsquery('portuguese', p_query)) * 1.5 as rank
    FROM public.saints s
    WHERE to_tsvector('portuguese', s.name || ' ' || COALESCE(s.title, '') || ' ' || s.biography) @@ plainto_tsquery('portuguese', p_query)

    UNION ALL

    -- PATRÍSTICA / MAGISTÉRIO
    SELECT 
      sw.id::text,
      sw.title as title,
      s.name as subtitle,
      sw.description as content,
      CASE 
        WHEN sw.category = 'magisterium' THEN 'magisterium'::public.search_result_type 
        ELSE 'patristic'::public.search_result_type 
      END as item_type,
      sw.slug as slug,
      ts_rank_cd(to_tsvector('portuguese', sw.title || ' ' || COALESCE(sw.description, '')), plainto_tsquery('portuguese', p_query)) as rank
    FROM public.saint_works sw
    LEFT JOIN public.saints s ON sw.saint_id = s.id
    WHERE to_tsvector('portuguese', sw.title || ' ' || COALESCE(sw.description, '')) @@ plainto_tsquery('portuguese', p_query)

    UNION ALL

    -- ORAÇÕES
    SELECT 
      p.id::text,
      p.title as title,
      p.category as subtitle,
      p.content as content,
      'prayer'::public.search_result_type as item_type,
      p.slug as slug,
      ts_rank_cd(to_tsvector('portuguese', p.title || ' ' || COALESCE(p.content, '')), plainto_tsquery('portuguese', p_query)) as rank
    FROM public.prayers p
    WHERE to_tsvector('portuguese', p.title || ' ' || COALESCE(p.content, '')) @@ plainto_tsquery('portuguese', p_query)

    UNION ALL

    -- JORNADAS
    SELECT 
      j.id::text,
      j.title as title,
      j.subtitle as subtitle,
      j.description as content,
      'journey'::public.search_result_type as item_type,
      j.slug as slug,
      ts_rank_cd(to_tsvector('portuguese', j.title || ' ' || COALESCE(j.subtitle, '') || ' ' || COALESCE(j.description, '')), plainto_tsquery('portuguese', p_query)) as rank
    FROM public.journeys j
    WHERE to_tsvector('portuguese', j.title || ' ' || COALESCE(j.subtitle, '') || ' ' || COALESCE(j.description, '')) @@ plainto_tsquery('portuguese', p_query)

    UNION ALL

    -- GLOSSÁRIO
    SELECT 
      g.id::text,
      g.term as title,
      g.etymology as subtitle,
      g.definition as content,
      'glossary'::public.search_result_type as item_type,
      g.slug as slug,
      ts_rank_cd(to_tsvector('portuguese', g.term || ' ' || COALESCE(g.definition, '')), plainto_tsquery('portuguese', p_query)) as rank
    FROM public.glossary g
    WHERE to_tsvector('portuguese', g.term || ' ' || COALESCE(g.definition, '')) @@ plainto_tsquery('portuguese', p_query)
  )
  ORDER BY rank DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.global_search_v2(TEXT, INT) TO anon, authenticated;
