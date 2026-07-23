
-- Editorial Engine · Orações

CREATE OR REPLACE FUNCTION public.prayers_doctrinal_area(_category text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE lower(coalesce(_category, ''))
    WHEN 'marianas'      THEN 'Mariologia'
    WHEN 'mariana'       THEN 'Mariologia'
    WHEN 'eucaristia'    THEN 'Sacramentos'
    WHEN 'sacramentos'   THEN 'Sacramentos'
    WHEN 'liturgia'      THEN 'Liturgia'
    WHEN 'oficio'        THEN 'Liturgia'
    WHEN 'oficio-divino' THEN 'Liturgia'
    WHEN 'novena'        THEN 'Devoção'
    WHEN 'ladainha'      THEN 'Devoção'
    WHEN 'litany'        THEN 'Devoção'
    WHEN 'contemplativa' THEN 'Espiritualidade'
    WHEN 'meditacao'     THEN 'Espiritualidade'
    WHEN 'lectio'        THEN 'Espiritualidade'
    WHEN 'matinal'       THEN 'Cotidiano'
    WHEN 'noturna'       THEN 'Cotidiano'
    WHEN 'cotidiana'     THEN 'Cotidiano'
    WHEN 'basica'        THEN 'Cotidiano'
    WHEN 'via-sacra'     THEN 'Paixão'
    WHEN 'paixao'        THEN 'Paixão'
    ELSE 'Outras'
  END;
$$;

CREATE OR REPLACE FUNCTION public.prayers_ice(_slug text)
RETURNS TABLE (editorial numeric, nexus numeric, ice numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  p public.prayers%ROWTYPE;
  ed numeric := 0;
  nx numeric := 0;
  sections int := 0;
  bib int := 0;
  cic int := 0;
  gloss int := 0;
BEGIN
  SELECT * INTO p FROM public.prayers WHERE slug = _slug;
  IF NOT FOUND THEN RETURN QUERY SELECT 0::numeric, 0::numeric, 0::numeric; RETURN; END IF;

  ed := ed + (CASE WHEN p.subtitle IS NOT NULL AND length(p.subtitle) > 20 THEN 1 ELSE 0 END);
  ed := ed + (CASE WHEN p.content IS NOT NULL AND length(p.content) > 200 THEN 3 ELSE 0 END);
  ed := ed + (CASE WHEN p.explanation IS NOT NULL AND length(p.explanation) > 120 THEN 2 ELSE 0 END);
  ed := ed + (CASE WHEN p.meditation IS NOT NULL AND length(p.meditation) > 80 THEN 2 ELSE 0 END);
  ed := ed + (CASE WHEN p.source_ref IS NOT NULL AND length(p.source_ref) > 8 THEN 1 ELSE 0 END);
  ed := round((ed / 9.0) * 100, 1);

  SELECT count(*) INTO sections FROM public.prayer_sections WHERE prayer_id = p.id;
  IF sections = 0 THEN
    SELECT count(*) INTO sections FROM public.prayer_blocks WHERE prayer_id = p.id;
  END IF;
  bib   := coalesce(array_length(p.related_bible, 1), 0);
  cic   := coalesce(array_length(p.related_catechism, 1), 0);
  gloss := coalesce(array_length(p.related_glossary, 1), 0);

  nx := nx + (CASE WHEN sections >= 3 THEN 3 WHEN sections >= 1 THEN 2 ELSE 0 END);
  nx := nx + (CASE WHEN bib   >= 3 THEN 2 WHEN bib   >= 1 THEN 1 ELSE 0 END);
  nx := nx + (CASE WHEN cic   >= 2 THEN 1 ELSE 0 END);
  nx := nx + (CASE WHEN gloss >= 1 THEN 1 ELSE 0 END);
  nx := round((nx / 7.0) * 100, 1);

  RETURN QUERY SELECT ed, nx, round(ed * 0.7 + nx * 0.3, 1);
END;
$$;

CREATE OR REPLACE FUNCTION public.prayers_doctrinal_coverage()
RETURNS TABLE (
  area text, total bigint, gold bigint, silver bigint, bronze bigint,
  review bigint, avg_ice numeric, gate_passing bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH scored AS (
    SELECT p.slug, public.prayers_doctrinal_area(p.category::text) AS area,
           (public.prayers_ice(p.slug)).ice AS ice
    FROM public.prayers p WHERE p.slug IS NOT NULL
  )
  SELECT area,
    count(*)::bigint,
    count(*) FILTER (WHERE ice >= 90)::bigint,
    count(*) FILTER (WHERE ice >= 75 AND ice < 90)::bigint,
    count(*) FILTER (WHERE ice >= 60 AND ice < 75)::bigint,
    count(*) FILTER (WHERE ice < 60)::bigint,
    round(avg(ice), 1),
    count(*) FILTER (WHERE ice >= 85)::bigint
  FROM scored GROUP BY area ORDER BY count(*) DESC;
$$;

CREATE OR REPLACE FUNCTION public.prayers_correction_priority()
RETURNS TABLE (
  slug text, term text, area text, status text,
  ice numeric, editorial numeric, nexus numeric,
  missing_deep boolean, missing_faq boolean, missing_logos boolean,
  missing_bible boolean, missing_cic boolean, missing_fathers boolean,
  missing_count integer, effort_tier text,
  inbound_refs integer, impact_tier text, priority text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH scored AS (
    SELECT p.slug, p.title, p.category::text AS category_txt,
           (CASE WHEN p.is_published THEN 'published' ELSE 'draft' END) AS status_txt,
           (public.prayers_ice(p.slug)).*,
           (p.content IS NULL OR length(coalesce(p.content,'')) < 200)          AS m_deep,
           (p.subtitle IS NULL OR length(coalesce(p.subtitle,'')) < 20)         AS m_faq,
           (p.explanation IS NULL OR length(coalesce(p.explanation,'')) < 120)  AS m_logos,
           (coalesce(array_length(p.related_bible, 1), 0) < 1)                  AS m_bible,
           (coalesce(array_length(p.related_catechism, 1), 0) < 2)              AS m_cic,
           (
             (SELECT count(*) FROM public.prayer_sections ps WHERE ps.prayer_id = p.id) < 1
             AND (SELECT count(*) FROM public.prayer_blocks pb WHERE pb.prayer_id = p.id) < 1
           )                                                                    AS m_fathers
    FROM public.prayers p WHERE p.slug IS NOT NULL
  ),
  tallied AS (
    SELECT *,
      ((m_deep)::int + (m_faq)::int + (m_logos)::int
      + (m_bible)::int + (m_cic)::int + (m_fathers)::int) AS mc
    FROM scored
  )
  SELECT
    slug, title, public.prayers_doctrinal_area(category_txt), status_txt, ice, editorial, nexus,
    m_deep, m_faq, m_logos, m_bible, m_cic, m_fathers, mc,
    CASE WHEN mc <= 1 THEN 'quick_win' WHEN mc <= 3 THEN 'medium' ELSE 'deep' END,
    0,
    CASE lower(coalesce(category_txt,''))
      WHEN 'eucaristia'    THEN 'high'
      WHEN 'sacramentos'   THEN 'high'
      WHEN 'liturgia'      THEN 'high'
      WHEN 'oficio'        THEN 'high'
      WHEN 'oficio-divino' THEN 'high'
      WHEN 'marianas'      THEN 'medium'
      WHEN 'mariana'       THEN 'medium'
      WHEN 'via-sacra'     THEN 'medium'
      ELSE 'low'
    END,
    CASE
      WHEN mc <= 1 AND lower(coalesce(category_txt,'')) IN ('eucaristia','sacramentos','liturgia','oficio','oficio-divino') THEN 'p0'
      WHEN mc <= 1 THEN 'p1'
      WHEN lower(coalesce(category_txt,'')) IN ('eucaristia','sacramentos','liturgia','oficio','oficio-divino') THEN 'p1'
      WHEN mc <= 3 THEN 'p2'
      ELSE 'p3'
    END
  FROM tallied
  ORDER BY mc ASC, ice DESC;
$$;

CREATE OR REPLACE FUNCTION public.prayers_quality_gate(_slug text)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  p public.prayers%ROWTYPE;
  sc numeric;
  sections int;
BEGIN
  SELECT * INTO p FROM public.prayers WHERE slug = _slug;
  IF NOT FOUND THEN RETURN false; END IF;
  IF p.title IS NULL OR p.subtitle IS NULL THEN RETURN false; END IF;
  IF p.content IS NULL OR length(p.content) < 200 THEN RETURN false; END IF;
  IF p.explanation IS NULL OR length(p.explanation) < 120 THEN RETURN false; END IF;
  IF coalesce(p.engine_version, 1) < 2 THEN RETURN false; END IF;
  SELECT count(*) INTO sections FROM public.prayer_sections WHERE prayer_id = p.id;
  IF sections < 1 THEN RETURN false; END IF;
  SELECT (public.prayers_ice(_slug)).ice INTO sc;
  RETURN sc >= 85;
END;
$$;

-- Wrappers genéricos passam a rotear prayers
CREATE OR REPLACE FUNCTION public.editorial_coverage(_entity text)
RETURNS TABLE (
  area text, total bigint, gold bigint, silver bigint, bronze bigint,
  review bigint, avg_ice numeric, gate_passing bigint
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _entity = 'glossary' THEN
    RETURN QUERY SELECT * FROM public.glossary_doctrinal_coverage();
  ELSIF _entity = 'saints' THEN
    RETURN QUERY SELECT * FROM public.saints_doctrinal_coverage();
  ELSIF _entity = 'journeys' THEN
    RETURN QUERY SELECT * FROM public.journeys_doctrinal_coverage();
  ELSIF _entity = 'collections' THEN
    RETURN QUERY SELECT * FROM public.collections_doctrinal_coverage();
  ELSIF _entity = 'prayers' THEN
    RETURN QUERY SELECT * FROM public.prayers_doctrinal_coverage();
  ELSE RETURN; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.editorial_correction_priority(_entity text)
RETURNS TABLE (
  slug text, term text, area text, status text,
  ice numeric, editorial numeric, nexus numeric,
  missing_deep boolean, missing_faq boolean, missing_logos boolean,
  missing_bible boolean, missing_cic boolean, missing_fathers boolean,
  missing_count integer, effort_tier text,
  inbound_refs integer, impact_tier text, priority text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _entity = 'glossary' THEN
    RETURN QUERY SELECT * FROM public.glossary_correction_priority();
  ELSIF _entity = 'saints' THEN
    RETURN QUERY SELECT * FROM public.saints_correction_priority();
  ELSIF _entity = 'journeys' THEN
    RETURN QUERY SELECT * FROM public.journeys_correction_priority();
  ELSIF _entity = 'collections' THEN
    RETURN QUERY SELECT * FROM public.collections_correction_priority();
  ELSIF _entity = 'prayers' THEN
    RETURN QUERY SELECT * FROM public.prayers_correction_priority();
  ELSE RETURN; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.editorial_quality_gate(_entity text, _slug text)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _entity = 'glossary'    THEN RETURN public.glossary_quality_gate(_slug);
  ELSIF _entity = 'saints'      THEN RETURN public.saints_quality_gate(_slug);
  ELSIF _entity = 'journeys'    THEN RETURN public.journeys_quality_gate(_slug);
  ELSIF _entity = 'collections' THEN RETURN public.collections_quality_gate(_slug);
  ELSIF _entity = 'prayers'     THEN RETURN public.prayers_quality_gate(_slug);
  ELSE RETURN false; END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.prayers_ice(text)                FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.prayers_doctrinal_coverage()     FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.prayers_correction_priority()    FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.prayers_quality_gate(text)       FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.prayers_ice(text)             TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.prayers_doctrinal_coverage()  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.prayers_correction_priority() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.prayers_quality_gate(text)    TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.prayers_doctrinal_area(text)  TO authenticated, service_role;

COMMENT ON FUNCTION public.prayers_ice(text)             IS 'Editorial Engine · ICE de uma oração (editorial 70% · nexus 30%).';
COMMENT ON FUNCTION public.prayers_doctrinal_coverage()  IS 'Editorial Engine · cobertura por macroárea das orações.';
COMMENT ON FUNCTION public.prayers_correction_priority() IS 'Editorial Engine · fila de correção das orações.';
COMMENT ON FUNCTION public.prayers_quality_gate(text)    IS 'Editorial Engine · gate oficial de uma oração (exige engine_version = 2 + seção).';
