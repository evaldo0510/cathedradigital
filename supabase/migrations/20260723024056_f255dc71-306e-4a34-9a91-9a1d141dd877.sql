-- ============================================================
-- Fase 1.5 · Catequese (CIC) no Editorial Engine
-- ============================================================

-- 1) Colunas slug/status
ALTER TABLE public.catechism_official
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft';

UPDATE public.catechism_official
   SET slug = 'cic-' || lpad(paragraph::text, 4, '0')
 WHERE slug IS NULL;

UPDATE public.catechism_official
   SET status = 'published'
 WHERE (texto_base IS NOT NULL AND length(texto_base) > 150)
   AND (explicacao IS NOT NULL AND length(explicacao) > 100)
   AND status = 'draft';

ALTER TABLE public.catechism_official
  ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_catechism_official_slug ON public.catechism_official(slug);
CREATE INDEX IF NOT EXISTS idx_catechism_official_status ON public.catechism_official(status);

CREATE OR REPLACE FUNCTION public.catechism_sync_slug()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := 'cic-' || lpad(NEW.paragraph::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS catechism_sync_slug_trg ON public.catechism_official;
CREATE TRIGGER catechism_sync_slug_trg
  BEFORE INSERT OR UPDATE ON public.catechism_official
  FOR EACH ROW EXECUTE FUNCTION public.catechism_sync_slug();

-- 2) Macroárea
CREATE OR REPLACE FUNCTION public.catechism_doctrinal_area(_paragraph int)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE
    WHEN _paragraph BETWEEN 1 AND 1065    THEN 'credo'
    WHEN _paragraph BETWEEN 1066 AND 1690 THEN 'sacramentos'
    WHEN _paragraph BETWEEN 1691 AND 2557 THEN 'vida-em-cristo'
    WHEN _paragraph >= 2558               THEN 'oracao'
    ELSE 'indefinido'
  END;
$$;

-- 3) ICE
CREATE OR REPLACE FUNCTION public.catechism_ice(_slug text)
RETURNS TABLE (editorial numeric, nexus numeric, ice numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  c public.catechism_official%ROWTYPE;
  ed numeric := 0;
  nx numeric := 0;
  ties int := 0;
  par_txt text;
BEGIN
  SELECT * INTO c FROM public.catechism_official WHERE slug = _slug;
  IF NOT FOUND THEN
    RETURN QUERY SELECT 0::numeric, 0::numeric, 0::numeric;
    RETURN;
  END IF;

  ed := ed + (CASE WHEN c.texto_base              IS NOT NULL AND length(c.texto_base)              > 150 THEN 3 ELSE 0 END);
  ed := ed + (CASE WHEN c.explicacao              IS NOT NULL AND length(c.explicacao)              > 100 THEN 2 ELSE 0 END);
  ed := ed + (CASE WHEN c.interpretacao_profunda  IS NOT NULL AND length(c.interpretacao_profunda)  > 100 THEN 2 ELSE 0 END);
  ed := ed + (CASE WHEN c.aplicacao_pratica       IS NOT NULL AND length(c.aplicacao_pratica)       > 80  THEN 1 ELSE 0 END);
  ed := ed + (CASE WHEN c.reflexao_final          IS NOT NULL AND length(c.reflexao_final)          > 80  THEN 1 ELSE 0 END);
  ed := ed + (CASE WHEN c.exercicio               IS NOT NULL AND length(c.exercicio)               > 40  THEN 1 ELSE 0 END);
  ed := round((ed / 10.0) * 100, 1);

  par_txt := c.paragraph::text;
  SELECT count(*) INTO ties
    FROM public.nexus_relations r
   WHERE (r.target_kind = 'catechism_paragraph' AND (r.target_ref->>'ref') = par_txt)
      OR (r.source_kind = 'catechism_paragraph' AND (r.source_ref->>'ref') = par_txt);

  nx := nx + (CASE WHEN ties >= 5 THEN 3 WHEN ties >= 2 THEN 2 WHEN ties >= 1 THEN 1 ELSE 0 END);
  nx := round((nx / 3.0) * 100, 1);

  RETURN QUERY SELECT ed, nx, round(ed * 0.7 + nx * 0.3, 1);
END;
$$;

-- 4) Quality gate
CREATE OR REPLACE FUNCTION public.catechism_quality_gate(_slug text)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  c public.catechism_official%ROWTYPE;
  sc numeric;
BEGIN
  SELECT * INTO c FROM public.catechism_official WHERE slug = _slug;
  IF NOT FOUND THEN RETURN false; END IF;
  IF c.texto_base IS NULL OR length(c.texto_base) < 150 THEN RETURN false; END IF;
  IF c.explicacao IS NULL OR length(c.explicacao) < 100 THEN RETURN false; END IF;
  IF c.interpretacao_profunda IS NULL OR length(c.interpretacao_profunda) < 100 THEN RETURN false; END IF;
  SELECT (public.catechism_ice(_slug)).ice INTO sc;
  RETURN sc >= 85;
END;
$$;

-- 5) Cobertura doutrinária
CREATE OR REPLACE FUNCTION public.catechism_doctrinal_coverage()
RETURNS TABLE (
  area text, total bigint, gold bigint, silver bigint, bronze bigint,
  review bigint, avg_ice numeric, gate_passing bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH scored AS (
    SELECT c.slug,
           public.catechism_doctrinal_area(c.paragraph) AS area,
           (public.catechism_ice(c.slug)).ice          AS ice,
           public.catechism_quality_gate(c.slug)       AS gate
    FROM public.catechism_official c
  )
  SELECT area,
         count(*)                                      AS total,
         count(*) FILTER (WHERE ice >= 95)             AS gold,
         count(*) FILTER (WHERE ice >= 85 AND ice < 95) AS silver,
         count(*) FILTER (WHERE ice >= 70 AND ice < 85) AS bronze,
         count(*) FILTER (WHERE ice < 70)              AS review,
         round(avg(ice)::numeric, 1)                   AS avg_ice,
         count(*) FILTER (WHERE gate)                  AS gate_passing
    FROM scored
   GROUP BY area
   ORDER BY area;
$$;

-- 6) Fila de correção
CREATE OR REPLACE FUNCTION public.catechism_correction_priority()
RETURNS TABLE (
  slug text, term text, area text, status text,
  ice numeric, editorial numeric, nexus numeric,
  missing_deep boolean, missing_faq boolean, missing_logos boolean,
  missing_bible boolean, missing_cic boolean, missing_fathers boolean,
  missing_count integer, effort_tier text,
  inbound_refs integer, impact_tier text, priority text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH base AS (
    SELECT c.slug,
           ('CIC ' || c.paragraph::text)                          AS term,
           public.catechism_doctrinal_area(c.paragraph)           AS area,
           c.status                                               AS status,
           (public.catechism_ice(c.slug)).editorial              AS editorial,
           (public.catechism_ice(c.slug)).nexus                  AS nexus,
           (public.catechism_ice(c.slug)).ice                    AS ice,
           (c.interpretacao_profunda IS NULL OR length(c.interpretacao_profunda) < 100) AS missing_deep,
           (c.aplicacao_pratica IS NULL OR length(c.aplicacao_pratica) < 80)   AS missing_faq,
           (c.reflexao_final IS NULL OR length(c.reflexao_final) < 80)         AS missing_logos,
           false                                                                AS missing_bible,
           false                                                                AS missing_cic,
           (c.exercicio IS NULL OR length(c.exercicio) < 40)                   AS missing_fathers,
           (SELECT count(*)::int FROM public.nexus_relations r
             WHERE r.target_kind = 'catechism_paragraph'
               AND (r.target_ref->>'ref') = c.paragraph::text)                 AS inbound
      FROM public.catechism_official c
  ), tallied AS (
    SELECT *,
      ( (missing_deep)::int + (missing_faq)::int + (missing_logos)::int
      + (missing_bible)::int + (missing_cic)::int + (missing_fathers)::int ) AS mc
    FROM base
  )
  SELECT slug, term, area, status, ice, editorial, nexus,
         missing_deep, missing_faq, missing_logos, missing_bible, missing_cic, missing_fathers,
         mc AS missing_count,
         CASE WHEN mc <= 1 THEN 'quick_win' WHEN mc <= 3 THEN 'medium' ELSE 'heavy' END AS effort_tier,
         inbound AS inbound_refs,
         CASE
           WHEN area IN ('sacramentos','credo')   THEN 'high'
           WHEN area = 'vida-em-cristo'           THEN 'medium'
           ELSE 'low'
         END AS impact_tier,
         CASE
           WHEN mc <= 1 AND area IN ('credo','sacramentos') THEN 'p0'
           WHEN mc <= 1                                     THEN 'p1'
           WHEN area IN ('credo','sacramentos')             THEN 'p1'
           WHEN mc <= 3                                     THEN 'p2'
           ELSE                                                  'p3'
         END AS priority
    FROM tallied
   ORDER BY mc ASC, ice DESC;
$$;

-- 7) Wrappers genéricos
CREATE OR REPLACE FUNCTION public.editorial_coverage(_entity text)
RETURNS TABLE (
  area text, total bigint, gold bigint, silver bigint, bronze bigint,
  review bigint, avg_ice numeric, gate_passing bigint
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _entity = 'glossary'      THEN RETURN QUERY SELECT * FROM public.glossary_doctrinal_coverage();
  ELSIF _entity = 'saints'      THEN RETURN QUERY SELECT * FROM public.saints_doctrinal_coverage();
  ELSIF _entity = 'journeys'    THEN RETURN QUERY SELECT * FROM public.journeys_doctrinal_coverage();
  ELSIF _entity = 'collections' THEN RETURN QUERY SELECT * FROM public.collections_doctrinal_coverage();
  ELSIF _entity = 'prayers'     THEN RETURN QUERY SELECT * FROM public.prayers_doctrinal_coverage();
  ELSIF _entity = 'catechism'   THEN RETURN QUERY SELECT * FROM public.catechism_doctrinal_coverage();
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
  IF _entity = 'glossary'      THEN RETURN QUERY SELECT * FROM public.glossary_correction_priority();
  ELSIF _entity = 'saints'      THEN RETURN QUERY SELECT * FROM public.saints_correction_priority();
  ELSIF _entity = 'journeys'    THEN RETURN QUERY SELECT * FROM public.journeys_correction_priority();
  ELSIF _entity = 'collections' THEN RETURN QUERY SELECT * FROM public.collections_correction_priority();
  ELSIF _entity = 'prayers'     THEN RETURN QUERY SELECT * FROM public.prayers_correction_priority();
  ELSIF _entity = 'catechism'   THEN RETURN QUERY SELECT * FROM public.catechism_correction_priority();
  ELSE RETURN; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.editorial_quality_gate(_entity text, _slug text)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _entity = 'glossary'      THEN RETURN public.glossary_quality_gate(_slug);
  ELSIF _entity = 'saints'      THEN RETURN public.saints_quality_gate(_slug);
  ELSIF _entity = 'journeys'    THEN RETURN public.journeys_quality_gate(_slug);
  ELSIF _entity = 'collections' THEN RETURN public.collections_quality_gate(_slug);
  ELSIF _entity = 'prayers'     THEN RETURN public.prayers_quality_gate(_slug);
  ELSIF _entity = 'catechism'   THEN RETURN public.catechism_quality_gate(_slug);
  ELSE RETURN false; END IF;
END;
$$;

-- 8) Permissões
REVOKE ALL ON FUNCTION public.catechism_ice(text)                 FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.catechism_doctrinal_coverage()      FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.catechism_correction_priority()     FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.catechism_quality_gate(text)        FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.catechism_doctrinal_area(int)       FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.catechism_ice(text)              TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.catechism_doctrinal_coverage()   TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.catechism_correction_priority()  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.catechism_quality_gate(text)     TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.catechism_doctrinal_area(int)    TO authenticated, service_role;

COMMENT ON FUNCTION public.catechism_ice(text)                IS 'Editorial Engine · ICE de um parágrafo do CIC (editorial 70% · nexus 30%).';
COMMENT ON FUNCTION public.catechism_doctrinal_coverage()     IS 'Editorial Engine · cobertura por macroárea (Credo/Sacramentos/Vida/Oração).';
COMMENT ON FUNCTION public.catechism_correction_priority()    IS 'Editorial Engine · fila de correção do CIC.';
COMMENT ON FUNCTION public.catechism_quality_gate(text)       IS 'Editorial Engine · gate oficial (texto + explicação + interpretação + ICE ≥ 85).';
COMMENT ON FUNCTION public.catechism_doctrinal_area(int)      IS 'Editorial Engine · macroárea canônica do CIC (4 partes).';