
-- Editorial Engine · Coleções

CREATE OR REPLACE FUNCTION public.collections_doctrinal_area(_category text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE lower(coalesce(_category, ''))
    WHEN 'sacramentos'  THEN 'Sacramentos'
    WHEN 'santos'       THEN 'Santos'
    WHEN 'oracao'       THEN 'Oração'
    WHEN 'liturgia'     THEN 'Liturgia'
    WHEN 'formacao'     THEN 'Formação'
    WHEN 'espiritualidade' THEN 'Espiritualidade'
    ELSE 'Outros'
  END;
$$;

CREATE OR REPLACE FUNCTION public.collections_ice(_slug text)
RETURNS TABLE (editorial numeric, nexus numeric, ice numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.collections%ROWTYPE; ed numeric := 0; nx numeric := 0; items int := 0; refs int := 0;
BEGIN
  SELECT * INTO c FROM public.collections WHERE slug = _slug;
  IF NOT FOUND THEN RETURN QUERY SELECT 0::numeric, 0::numeric, 0::numeric; RETURN; END IF;

  ed := ed + (CASE WHEN c.subtitle IS NOT NULL AND length(c.subtitle) > 20 THEN 1 ELSE 0 END);
  ed := ed + (CASE WHEN c.description IS NOT NULL AND length(c.description) > 200 THEN 3 ELSE 0 END);
  ed := ed + (CASE WHEN c.cover IS NOT NULL AND length(c.cover) > 8 THEN 2 ELSE 0 END);
  ed := round((ed / 6.0) * 100, 1);

  SELECT count(*) INTO items FROM public.collection_items WHERE collection_id = c.id;
  IF jsonb_typeof(c.nexus_refs) = 'array' THEN refs := jsonb_array_length(c.nexus_refs); END IF;
  nx := nx + (CASE WHEN refs >= 3 THEN 2 WHEN refs >= 1 THEN 1 ELSE 0 END);
  nx := nx + (CASE WHEN items >= 5 THEN 3 WHEN items >= 3 THEN 2 WHEN items >= 1 THEN 1 ELSE 0 END);
  nx := round((nx / 5.0) * 100, 1);

  RETURN QUERY SELECT ed, nx, round(ed * 0.7 + nx * 0.3, 1);
END;
$$;

CREATE OR REPLACE FUNCTION public.collections_doctrinal_coverage()
RETURNS TABLE (
  area text, total bigint, gold bigint, silver bigint, bronze bigint,
  review bigint, avg_ice numeric, gate_passing bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH scored AS (
    SELECT c.slug, public.collections_doctrinal_area(c.category) AS area,
           (public.collections_ice(c.slug)).ice AS ice
    FROM public.collections c WHERE c.slug IS NOT NULL
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

CREATE OR REPLACE FUNCTION public.collections_correction_priority()
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
    SELECT c.slug, c.title, c.category, c.status,
           (public.collections_ice(c.slug)).*,
           (c.description IS NULL OR length(coalesce(c.description,'')) < 200) AS m_deep,
           (c.subtitle IS NULL OR length(coalesce(c.subtitle,'')) < 20) AS m_faq,
           (c.cover IS NULL) AS m_logos,
           ((jsonb_typeof(c.nexus_refs) IS DISTINCT FROM 'array') OR jsonb_array_length(coalesce(c.nexus_refs,'[]'::jsonb)) < 3) AS m_bible,
           ((SELECT count(*) FROM public.collection_items ci WHERE ci.collection_id = c.id) < 3) AS m_cic,
           ((SELECT count(*) FROM public.collection_items ci WHERE ci.collection_id = c.id) < 5) AS m_fathers
    FROM public.collections c WHERE c.slug IS NOT NULL
  ),
  tallied AS (
    SELECT *,
      ((m_deep)::int + (m_faq)::int + (m_logos)::int
      + (m_bible)::int + (m_cic)::int + (m_fathers)::int) AS mc
    FROM scored
  )
  SELECT
    slug, title, public.collections_doctrinal_area(category), status, ice, editorial, nexus,
    m_deep, m_faq, m_logos, m_bible, m_cic, m_fathers, mc,
    CASE WHEN mc <= 1 THEN 'quick_win' WHEN mc <= 3 THEN 'medium' ELSE 'deep' END,
    0,
    CASE lower(coalesce(category,''))
      WHEN 'sacramentos' THEN 'high'
      WHEN 'formacao' THEN 'high'
      WHEN 'santos' THEN 'medium'
      ELSE 'low'
    END,
    CASE
      WHEN mc <= 1 AND lower(coalesce(category,'')) IN ('sacramentos','formacao') THEN 'p0'
      WHEN mc <= 1 THEN 'p1'
      WHEN lower(coalesce(category,'')) IN ('sacramentos','formacao') THEN 'p1'
      WHEN mc <= 3 THEN 'p2'
      ELSE 'p3'
    END
  FROM tallied
  ORDER BY mc ASC, ice DESC;
$$;

CREATE OR REPLACE FUNCTION public.collections_quality_gate(_slug text)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.collections%ROWTYPE; sc numeric; items int;
BEGIN
  SELECT * INTO c FROM public.collections WHERE slug = _slug;
  IF NOT FOUND THEN RETURN false; END IF;
  IF c.title IS NULL OR c.cover IS NULL THEN RETURN false; END IF;
  IF c.description IS NULL OR length(c.description) < 200 THEN RETURN false; END IF;
  SELECT count(*) INTO items FROM public.collection_items WHERE collection_id = c.id;
  IF items < 3 THEN RETURN false; END IF;
  SELECT (public.collections_ice(_slug)).ice INTO sc;
  RETURN sc >= 85;
END;
$$;

-- Wrappers genéricos passam a rotear collections
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
  ELSE RETURN; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.editorial_quality_gate(_entity text, _slug text)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _entity = 'glossary' THEN RETURN public.glossary_quality_gate(_slug);
  ELSIF _entity = 'saints' THEN RETURN public.saints_quality_gate(_slug);
  ELSIF _entity = 'journeys' THEN RETURN public.journeys_quality_gate(_slug);
  ELSIF _entity = 'collections' THEN RETURN public.collections_quality_gate(_slug);
  ELSE RETURN false; END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.collections_ice(text)                FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.collections_doctrinal_coverage()     FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.collections_correction_priority()    FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.collections_quality_gate(text)       FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.collections_ice(text)             TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.collections_doctrinal_coverage()  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.collections_correction_priority() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.collections_quality_gate(text)    TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.collections_doctrinal_area(text)  TO authenticated, service_role;

COMMENT ON FUNCTION public.collections_ice(text)             IS 'Editorial Engine · ICE de uma coleção (editorial 70% · nexus 30%).';
COMMENT ON FUNCTION public.collections_doctrinal_coverage()  IS 'Editorial Engine · cobertura por macroárea das coleções.';
COMMENT ON FUNCTION public.collections_correction_priority() IS 'Editorial Engine · fila de correção das coleções.';
COMMENT ON FUNCTION public.collections_quality_gate(text)    IS 'Editorial Engine · gate oficial de uma coleção.';
