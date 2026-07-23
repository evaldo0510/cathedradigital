-- Editorial Engine · Santos, Doutores, Padres, Mártires

CREATE OR REPLACE FUNCTION public.saints_doctrinal_area(_category text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE lower(coalesce(_category, ''))
    WHEN 'doctor'    THEN 'Doutores da Igreja'
    WHEN 'father'    THEN 'Padres da Igreja'
    WHEN 'martyr'    THEN 'Mártires'
    WHEN 'virgin'    THEN 'Virgens'
    WHEN 'confessor' THEN 'Confessores'
    WHEN 'blessed'   THEN 'Beatos'
    WHEN 'saint'     THEN 'Santos'
    ELSE 'Outros'
  END;
$$;

CREATE OR REPLACE FUNCTION public.saints_ice(_id text)
RETURNS TABLE (editorial numeric, nexus numeric, ice numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.saints%ROWTYPE; ed numeric := 0; nx numeric := 0;
BEGIN
  SELECT * INTO s FROM public.saints WHERE id = _id;
  IF NOT FOUND THEN RETURN QUERY SELECT 0::numeric, 0::numeric, 0::numeric; RETURN; END IF;

  ed := ed + (CASE WHEN s.bio IS NOT NULL AND length(s.bio) > 120 THEN 1 ELSE 0 END);
  ed := ed + (CASE WHEN s.full_bio IS NOT NULL AND length(s.full_bio) > 600 THEN 3 ELSE 0 END);
  ed := ed + (CASE WHEN s.historical_context IS NOT NULL AND length(s.historical_context) > 100 THEN 1 ELSE 0 END);
  ed := ed + (CASE WHEN jsonb_typeof(s.spiritual_practice) = 'array' AND jsonb_array_length(s.spiritual_practice) > 0 THEN 2 ELSE 0 END);
  ed := ed + (CASE WHEN array_length(s.virtues, 1) > 0 THEN 1 ELSE 0 END);
  ed := ed + (CASE WHEN array_length(s.patronages, 1) > 0 THEN 1 ELSE 0 END);
  ed := ed + (CASE WHEN jsonb_typeof(s.iconography) = 'array' AND jsonb_array_length(s.iconography) > 0 THEN 1 ELSE 0 END);
  ed := ed + (CASE WHEN s.prayer IS NOT NULL AND length(s.prayer) > 50 THEN 2 ELSE 0 END);
  ed := ed + (CASE WHEN jsonb_typeof(s.quotes_rich) = 'array' AND jsonb_array_length(s.quotes_rich) > 0 THEN 1 ELSE 0 END);
  ed := ed + (CASE WHEN jsonb_typeof(s.timeline) = 'array' AND jsonb_array_length(s.timeline) > 0 THEN 1 ELSE 0 END);
  ed := ed + (CASE WHEN s.works IS NOT NULL AND jsonb_typeof(s.works) IN ('array','object') THEN 2 ELSE 0 END);
  ed := round((ed / 16.0) * 100, 1);

  nx := nx + (CASE WHEN s.bible_refs IS NOT NULL THEN 2 ELSE 0 END);
  nx := nx + (CASE WHEN array_length(s.catechism_refs, 1) > 0 THEN 2 ELSE 0 END);
  nx := nx + (CASE WHEN s.church_doc_refs IS NOT NULL THEN 2 ELSE 0 END);
  nx := nx + (CASE WHEN jsonb_typeof(s.sources) = 'array' AND jsonb_array_length(s.sources) > 0 THEN 2 ELSE 0 END);
  nx := round((nx / 8.0) * 100, 1);

  RETURN QUERY SELECT ed, nx, round(ed * 0.7 + nx * 0.3, 1);
END;
$$;

CREATE OR REPLACE FUNCTION public.saints_doctrinal_coverage()
RETURNS TABLE (
  area text, total bigint, gold bigint, silver bigint, bronze bigint,
  review bigint, avg_ice numeric, gate_passing bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH scored AS (
    SELECT s.id, public.saints_doctrinal_area(s.category) AS area,
           (public.saints_ice(s.id)).ice AS ice
    FROM public.saints s
  )
  SELECT
    area,
    count(*)::bigint,
    count(*) FILTER (WHERE ice >= 90)::bigint,
    count(*) FILTER (WHERE ice >= 75 AND ice < 90)::bigint,
    count(*) FILTER (WHERE ice >= 60 AND ice < 75)::bigint,
    count(*) FILTER (WHERE ice < 60)::bigint,
    round(avg(ice), 1),
    count(*) FILTER (WHERE ice >= 85)::bigint
  FROM scored GROUP BY area ORDER BY count(*) DESC;
$$;

CREATE OR REPLACE FUNCTION public.saints_correction_priority()
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
    SELECT s.id, s.name, s.category, s.content_status::text AS status,
           (public.saints_ice(s.id)).*,
           (s.full_bio IS NULL OR length(coalesce(s.full_bio,'')) < 600) AS m_deep,
           (jsonb_typeof(s.spiritual_practice) IS DISTINCT FROM 'array' OR jsonb_array_length(coalesce(s.spiritual_practice,'[]'::jsonb)) = 0) AS m_faq,
           (s.prayer IS NULL OR length(coalesce(s.prayer,'')) < 50) AS m_logos,
           (s.bible_refs IS NULL) AS m_bible,
           (array_length(s.catechism_refs, 1) IS NULL) AS m_cic,
           (s.church_doc_refs IS NULL) AS m_fathers
    FROM public.saints s
  ),
  tallied AS (
    SELECT *,
      ((m_deep)::int + (m_faq)::int + (m_logos)::int
      + (m_bible)::int + (m_cic)::int + (m_fathers)::int) AS mc
    FROM scored
  )
  SELECT
    id, name, public.saints_doctrinal_area(category), status, ice, editorial, nexus,
    m_deep, m_faq, m_logos, m_bible, m_cic, m_fathers, mc,
    CASE WHEN mc <= 1 THEN 'quick_win' WHEN mc <= 3 THEN 'medium' ELSE 'deep' END,
    0,
    CASE lower(coalesce(category,'')) WHEN 'doctor' THEN 'high' WHEN 'father' THEN 'high' WHEN 'martyr' THEN 'medium' ELSE 'low' END,
    CASE
      WHEN mc <= 1 AND lower(coalesce(category,'')) IN ('doctor','father') THEN 'p0'
      WHEN mc <= 1 THEN 'p1'
      WHEN lower(coalesce(category,'')) IN ('doctor','father') THEN 'p1'
      WHEN mc <= 3 THEN 'p2'
      ELSE 'p3'
    END
  FROM tallied
  ORDER BY
    (CASE lower(coalesce(category,'')) WHEN 'doctor' THEN 0 WHEN 'father' THEN 1 WHEN 'martyr' THEN 2 ELSE 3 END),
    mc ASC, ice DESC;
$$;

CREATE OR REPLACE FUNCTION public.saints_quality_gate(_slug text)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.saints%ROWTYPE; sc numeric;
BEGIN
  SELECT * INTO s FROM public.saints WHERE id = _slug;
  IF NOT FOUND THEN RETURN false; END IF;
  IF s.name IS NULL OR s.category IS NULL OR s.feast_day IS NULL THEN RETURN false; END IF;
  IF s.full_bio IS NULL OR length(s.full_bio) < 600 THEN RETURN false; END IF;
  IF s.prayer IS NULL OR length(s.prayer) < 50 THEN RETURN false; END IF;
  IF s.sources IS NULL OR jsonb_typeof(s.sources) <> 'array' OR jsonb_array_length(s.sources) = 0 THEN RETURN false; END IF;
  SELECT (public.saints_ice(_slug)).ice INTO sc;
  RETURN sc >= 85;
END;
$$;

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
  ELSE RETURN; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.editorial_quality_gate(_entity text, _slug text)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _entity = 'glossary' THEN RETURN public.glossary_quality_gate(_slug);
  ELSIF _entity = 'saints' THEN RETURN public.saints_quality_gate(_slug);
  ELSE RETURN false; END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.saints_ice(text)                FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.saints_doctrinal_coverage()     FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.saints_correction_priority()    FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.saints_quality_gate(text)       FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.saints_ice(text)             TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.saints_doctrinal_coverage()  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.saints_correction_priority() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.saints_quality_gate(text)    TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.saints_doctrinal_area(text)  TO authenticated, service_role;

COMMENT ON FUNCTION public.saints_ice(text)              IS 'Editorial Engine · ICE de um santo (editorial 70% · nexus 30%).';
COMMENT ON FUNCTION public.saints_doctrinal_coverage()   IS 'Editorial Engine · cobertura por categoria eclesial.';
COMMENT ON FUNCTION public.saints_correction_priority()  IS 'Editorial Engine · fila de correção dos santos.';
COMMENT ON FUNCTION public.saints_quality_gate(text)     IS 'Editorial Engine · gate oficial de um santo.';