CREATE OR REPLACE FUNCTION public.glossary_doctrinal_area(_slug text, _category text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE
    WHEN _slug IN ('ceu','inferno','purgatorio','juizo','escatologia','ressurreicao') THEN 'Escatologia'
    WHEN _slug = 'mariologia' THEN 'Mariologia'
    WHEN _category IN ('Sacramentos','Sacramento','Eucaristia') THEN 'Sacramentos'
    WHEN _category = 'Liturgia' THEN 'Liturgia'
    WHEN _category IN ('Igreja','Eclesiologia','Hierarquia') THEN 'Eclesiologia'
    WHEN _category IN ('Vida Cristã','virtude-teologal') THEN 'Vida Cristã e Moral'
    WHEN _category IN ('Doutrinal','Doutrina','Teologia','Teologia Sistemática','Catecismo') THEN 'Doutrina Fundamental'
    ELSE 'Outros'
  END
$$;

CREATE OR REPLACE FUNCTION public.glossary_correction_priority()
RETURNS TABLE(
  slug text, term text, area text, category text, status text,
  ice int, editorial int, nexus int,
  missing_deep boolean, missing_faq boolean, missing_logos boolean,
  missing_bible boolean, missing_cic boolean, missing_fathers boolean,
  missing_count int, effort_tier text,
  inbound_refs int, impact_tier text, priority text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH base AS (
    SELECT
      g.slug, g.term, g.category, g.status,
      public.glossary_doctrinal_area(g.slug, g.category) AS area,
      public._glossary_editorial_score(g.*) AS editorial,
      public._glossary_nexus_score(g.*)     AS nexus,
      (g.deep_interpretation IS NULL OR length(trim(g.deep_interpretation)) < 100) AS missing_deep,
      (g.faq IS NULL OR jsonb_typeof(g.faq) <> 'array' OR jsonb_array_length(g.faq) < 3) AS missing_faq,
      (g.logos_meditation IS NULL OR length(trim(g.logos_meditation)) < 60) AS missing_logos,
      (coalesce(array_length(g.bible_verses,1),0) < 3)         AS missing_bible,
      (coalesce(array_length(g.catechism_references,1),0) < 2) AS missing_cic,
      (coalesce(array_length(g.fathers_refs,1),0) < 1)         AS missing_fathers
    FROM public.glossary g
  ),
  scored AS (
    SELECT b.*,
      round(b.editorial * 0.6 + b.nexus * 0.4)::int AS ice,
      (b.missing_deep::int + b.missing_faq::int + b.missing_logos::int
        + b.missing_bible::int + b.missing_cic::int + b.missing_fathers::int) AS missing_count,
      (SELECT count(*)::int FROM public.nexus_relations r
        WHERE r.target_kind = 'glossary'
          AND (
            (jsonb_typeof(r.target_ref) = 'string' AND r.target_ref #>> '{}' = b.slug)
            OR r.target_ref->>'slug' = b.slug
            OR r.target_ref->>'ref'  = b.slug
          )
      ) AS inbound_refs
    FROM base b
  )
  SELECT
    s.slug, s.term, s.area, s.category, s.status,
    s.ice, s.editorial, s.nexus,
    s.missing_deep, s.missing_faq, s.missing_logos,
    s.missing_bible, s.missing_cic, s.missing_fathers,
    s.missing_count,
    CASE WHEN s.missing_count <= 1 THEN 'quick'
         WHEN s.missing_count <= 3 THEN 'medium'
         ELSE 'hard' END AS effort_tier,
    s.inbound_refs,
    CASE WHEN s.inbound_refs >= 5 THEN 'high'
         WHEN s.inbound_refs >= 2 THEN 'medium'
         ELSE 'low' END AS impact_tier,
    CASE
      WHEN s.ice >= 85 AND s.missing_count = 0 THEN 'ok'
      WHEN s.inbound_refs >= 5 AND s.ice < 70   THEN 'red'
      WHEN s.missing_count <= 1                 THEN 'quick_win'
      WHEN s.inbound_refs >= 2                  THEN 'orange'
      ELSE 'yellow'
    END AS priority
  FROM scored s;
$$;

REVOKE ALL ON FUNCTION public.glossary_correction_priority() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.glossary_correction_priority() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.glossary_doctrinal_coverage()
RETURNS TABLE(
  area text, total int, gold int, silver int, bronze int, review int,
  avg_ice numeric, gate_passing int
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH base AS (
    SELECT
      public.glossary_doctrinal_area(g.slug, g.category) AS area,
      (public._glossary_editorial_score(g.*) * 0.6
        + public._glossary_nexus_score(g.*) * 0.4)::numeric AS ice,
      (SELECT gate.passing FROM public.glossary_quality_gate(g.slug) gate) AS gate_pass
    FROM public.glossary g
  )
  SELECT
    b.area,
    count(*)::int                                           AS total,
    count(*) FILTER (WHERE b.ice >= 95)::int                AS gold,
    count(*) FILTER (WHERE b.ice >= 85 AND b.ice < 95)::int AS silver,
    count(*) FILTER (WHERE b.ice >= 70 AND b.ice < 85)::int AS bronze,
    count(*) FILTER (WHERE b.ice < 70)::int                 AS review,
    round(avg(b.ice), 1)                                    AS avg_ice,
    count(*) FILTER (WHERE b.gate_pass IS TRUE)::int        AS gate_passing
  FROM base b
  GROUP BY b.area
  ORDER BY
    CASE b.area
      WHEN 'Doutrina Fundamental' THEN 1
      WHEN 'Sacramentos'          THEN 2
      WHEN 'Vida Cristã e Moral'  THEN 3
      WHEN 'Liturgia'             THEN 4
      WHEN 'Eclesiologia'         THEN 5
      WHEN 'Mariologia'           THEN 6
      WHEN 'Escatologia'          THEN 7
      ELSE 99
    END;
$$;

REVOKE ALL ON FUNCTION public.glossary_doctrinal_coverage() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.glossary_doctrinal_coverage() TO authenticated, service_role;