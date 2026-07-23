
-- Editorial Engine · Jornadas Espirituais

CREATE OR REPLACE FUNCTION public.journeys_doctrinal_area(_category text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE lower(coalesce(_category, ''))
    WHEN 'fundamentos'   THEN 'Fundamentos'
    WHEN 'formacao'      THEN 'Formação'
    WHEN 'oracao'        THEN 'Vida de Oração'
    WHEN 'mistico'       THEN 'Vida Mística'
    WHEN 'transformacao' THEN 'Transformação'
    WHEN 'cura'          THEN 'Cura Interior'
    WHEN 'rotina'        THEN 'Rotina Espiritual'
    ELSE 'Outros'
  END;
$$;

CREATE OR REPLACE FUNCTION public.journeys_ice(_slug text)
RETURNS TABLE (editorial numeric, nexus numeric, ice numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE j public.journeys%ROWTYPE; ed numeric := 0; nx numeric := 0; steps int := 0;
BEGIN
  SELECT * INTO j FROM public.journeys WHERE slug = _slug;
  IF NOT FOUND THEN RETURN QUERY SELECT 0::numeric, 0::numeric, 0::numeric; RETURN; END IF;

  ed := ed + (CASE WHEN j.subtitle IS NOT NULL AND length(j.subtitle) > 20 THEN 1 ELSE 0 END);
  ed := ed + (CASE WHEN j.description IS NOT NULL AND length(j.description) > 200 THEN 2 ELSE 0 END);
  ed := ed + (CASE WHEN j.hero_kicker IS NOT NULL AND length(j.hero_kicker) > 3 THEN 1 ELSE 0 END);
  ed := ed + (CASE WHEN j.hero_quote IS NOT NULL AND length(j.hero_quote) > 20 THEN 1 ELSE 0 END);
  ed := ed + (CASE WHEN j.hero_image_url IS NOT NULL AND length(j.hero_image_url) > 8 THEN 2 ELSE 0 END);
  ed := ed + (CASE WHEN j.narrative_intro IS NOT NULL AND length(j.narrative_intro) > 200 THEN 3 ELSE 0 END);
  ed := ed + (CASE WHEN j.closing_message IS NOT NULL AND length(j.closing_message) > 100 THEN 2 ELSE 0 END);
  ed := round((ed / 12.0) * 100, 1);

  SELECT count(*) INTO steps FROM public.journey_steps WHERE journey_id = j.id;
  nx := nx + (CASE WHEN array_length(j.tags, 1) >= 3 THEN 1 ELSE 0 END);
  nx := nx + (CASE WHEN steps >= 5 THEN 3 WHEN steps >= 3 THEN 2 WHEN steps >= 1 THEN 1 ELSE 0 END);
  nx := round((nx / 4.0) * 100, 1);

  RETURN QUERY SELECT ed, nx, round(ed * 0.7 + nx * 0.3, 1);
END;
$$;

CREATE OR REPLACE FUNCTION public.journeys_doctrinal_coverage()
RETURNS TABLE (
  area text, total bigint, gold bigint, silver bigint, bronze bigint,
  review bigint, avg_ice numeric, gate_passing bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH scored AS (
    SELECT j.slug, public.journeys_doctrinal_area(j.category) AS area,
           (public.journeys_ice(j.slug)).ice AS ice
    FROM public.journeys j WHERE j.slug IS NOT NULL
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

CREATE OR REPLACE FUNCTION public.journeys_correction_priority()
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
    SELECT j.slug, j.title, j.category, j.status,
           (public.journeys_ice(j.slug)).*,
           (j.narrative_intro IS NULL OR length(coalesce(j.narrative_intro,'')) < 200) AS m_deep,
           (j.closing_message IS NULL OR length(coalesce(j.closing_message,'')) < 100) AS m_faq,
           (j.hero_quote IS NULL OR length(coalesce(j.hero_quote,'')) < 20) AS m_logos,
           (j.hero_image_url IS NULL) AS m_bible,
           (array_length(j.tags, 1) IS NULL OR array_length(j.tags, 1) < 3) AS m_cic,
           ((SELECT count(*) FROM public.journey_steps s WHERE s.journey_id = j.id) < 5) AS m_fathers
    FROM public.journeys j WHERE j.slug IS NOT NULL
  ),
  tallied AS (
    SELECT *,
      ((m_deep)::int + (m_faq)::int + (m_logos)::int
      + (m_bible)::int + (m_cic)::int + (m_fathers)::int) AS mc
    FROM scored
  )
  SELECT
    slug, title, public.journeys_doctrinal_area(category), status, ice, editorial, nexus,
    m_deep, m_faq, m_logos, m_bible, m_cic, m_fathers, mc,
    CASE WHEN mc <= 1 THEN 'quick_win' WHEN mc <= 3 THEN 'medium' ELSE 'deep' END,
    0,
    CASE lower(coalesce(category,''))
      WHEN 'fundamentos' THEN 'high'
      WHEN 'formacao' THEN 'high'
      WHEN 'oracao' THEN 'medium'
      ELSE 'low'
    END,
    CASE
      WHEN mc <= 1 AND lower(coalesce(category,'')) IN ('fundamentos','formacao') THEN 'p0'
      WHEN mc <= 1 THEN 'p1'
      WHEN lower(coalesce(category,'')) IN ('fundamentos','formacao') THEN 'p1'
      WHEN mc <= 3 THEN 'p2'
      ELSE 'p3'
    END
  FROM tallied
  ORDER BY mc ASC, ice DESC;
$$;

CREATE OR REPLACE FUNCTION public.journeys_quality_gate(_slug text)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE j public.journeys%ROWTYPE; sc numeric; steps int;
BEGIN
  SELECT * INTO j FROM public.journeys WHERE slug = _slug;
  IF NOT FOUND THEN RETURN false; END IF;
  IF j.title IS NULL OR j.category IS NULL THEN RETURN false; END IF;
  IF j.hero_image_url IS NULL THEN RETURN false; END IF;
  IF j.narrative_intro IS NULL OR length(j.narrative_intro) < 200 THEN RETURN false; END IF;
  IF j.closing_message IS NULL OR length(j.closing_message) < 100 THEN RETURN false; END IF;
  SELECT count(*) INTO steps FROM public.journey_steps WHERE journey_id = j.id;
  IF steps < 5 THEN RETURN false; END IF;
  SELECT (public.journeys_ice(_slug)).ice INTO sc;
  RETURN sc >= 85;
END;
$$;

-- Wrappers genéricos passam a rotear journeys
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
  ELSE RETURN false; END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.journeys_ice(text)                FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.journeys_doctrinal_coverage()     FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.journeys_correction_priority()    FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.journeys_quality_gate(text)       FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.journeys_ice(text)             TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.journeys_doctrinal_coverage()  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.journeys_correction_priority() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.journeys_quality_gate(text)    TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.journeys_doctrinal_area(text)  TO authenticated, service_role;

COMMENT ON FUNCTION public.journeys_ice(text)             IS 'Editorial Engine · ICE de uma jornada (editorial 70% · nexus 30%).';
COMMENT ON FUNCTION public.journeys_doctrinal_coverage()  IS 'Editorial Engine · cobertura por macroárea de jornadas.';
COMMENT ON FUNCTION public.journeys_correction_priority() IS 'Editorial Engine · fila de correção das jornadas.';
COMMENT ON FUNCTION public.journeys_quality_gate(text)    IS 'Editorial Engine · gate oficial de uma jornada.';
