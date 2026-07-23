
CREATE TABLE public.editorial_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  module TEXT NOT NULL DEFAULT 'glossary',
  total INT NOT NULL DEFAULT 0,
  published INT NOT NULL DEFAULT 0,
  gold INT NOT NULL DEFAULT 0,
  silver INT NOT NULL DEFAULT 0,
  bronze INT NOT NULL DEFAULT 0,
  review INT NOT NULL DEFAULT 0,
  avg_editorial NUMERIC(5,2) NOT NULL DEFAULT 0,
  avg_nexus NUMERIC(5,2) NOT NULL DEFAULT 0,
  avg_ice NUMERIC(5,2) NOT NULL DEFAULT 0,
  gate_passing INT NOT NULL DEFAULT 0,
  gate_failing INT NOT NULL DEFAULT 0,
  per_slug JSONB NOT NULL DEFAULT '[]'::jsonb,
  regressions JSONB NOT NULL DEFAULT '[]'::jsonb,
  trigger TEXT NOT NULL DEFAULT 'manual'
);
CREATE INDEX idx_editorial_snapshots_captured_at ON public.editorial_snapshots (captured_at DESC);
CREATE INDEX idx_editorial_snapshots_module ON public.editorial_snapshots (module, captured_at DESC);

GRANT SELECT ON public.editorial_snapshots TO authenticated;
GRANT ALL ON public.editorial_snapshots TO service_role;
ALTER TABLE public.editorial_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "editorial_snapshots_admin_read"
  ON public.editorial_snapshots FOR SELECT TO authenticated
  USING (public.is_current_user_admin());

CREATE POLICY "editorial_snapshots_service_write"
  ON public.editorial_snapshots FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public._glossary_editorial_score(g public.glossary)
RETURNS INT LANGUAGE sql IMMUTABLE AS $$
  SELECT LEAST(100, (
    (CASE WHEN length(coalesce(g.short_definition,'')) >= 20 THEN 4 ELSE 0 END) +
    (CASE WHEN length(coalesce(g.definition,'')) >= 20 THEN 8 ELSE 0 END) +
    (CASE WHEN length(coalesce(g.deep_interpretation,'')) >= 20 THEN 15 ELSE 0 END) +
    (CASE WHEN length(coalesce(g.etymology,'')) >= 20 THEN 8 ELSE 0 END) +
    (CASE WHEN length(coalesce(g.historical_context,'')) >= 20 THEN 8 ELSE 0 END) +
    (CASE WHEN length(coalesce(g.practical_application,'')) >= 20 THEN 8 ELSE 0 END) +
    (CASE WHEN length(coalesce(g.logos_meditation,'')) >= 20 THEN 8 ELSE 0 END) +
    (CASE WHEN jsonb_array_length(coalesce(g.faq,'[]'::jsonb)) >= 3 THEN 8 ELSE 0 END) +
    (CASE WHEN jsonb_array_length(coalesce(g.bibliography,'[]'::jsonb)) >= 3 THEN 7 ELSE 0 END)
  ) * 100 / 74);
$$;

CREATE OR REPLACE FUNCTION public._glossary_nexus_score(g public.glossary)
RETURNS INT LANGUAGE sql IMMUTABLE AS $$
  SELECT LEAST(100, (
    (CASE WHEN coalesce(array_length(g.bible_verses,1),0) >= 3 THEN 6 ELSE 0 END) +
    (CASE WHEN coalesce(array_length(g.catechism_references,1),0) >= 2 THEN 6 ELSE 0 END) +
    (CASE WHEN coalesce(array_length(g.fathers_refs,1),0) >= 1 THEN 5 ELSE 0 END) +
    (CASE WHEN coalesce(array_length(g.magisterium_references,1),0) >= 1 THEN 5 ELSE 0 END) +
    (CASE WHEN jsonb_array_length(coalesce(g.nexus_refs,'[]'::jsonb)) >= 20 THEN 4 ELSE 0 END)
  ) * 100 / 26);
$$;

CREATE OR REPLACE FUNCTION public.glossary_quality_gate(_slug TEXT)
RETURNS TABLE(passing BOOLEAN, ice INT, editorial INT, nexus INT, failing_reasons TEXT[])
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  g public.glossary%ROWTYPE;
  e INT; n INT; ice_v INT;
  reasons TEXT[] := ARRAY[]::TEXT[];
BEGIN
  SELECT * INTO g FROM public.glossary WHERE slug = _slug;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 0, 0, ARRAY['slug_not_found']::TEXT[];
    RETURN;
  END IF;
  e := public._glossary_editorial_score(g);
  n := public._glossary_nexus_score(g);
  ice_v := (e + n) / 2;

  IF ice_v < 85 THEN reasons := reasons || 'ice_below_85'; END IF;
  IF e < 90 THEN reasons := reasons || 'editorial_below_90'; END IF;
  IF n < 90 THEN reasons := reasons || 'nexus_below_90'; END IF;
  IF length(coalesce(g.deep_interpretation,'')) < 20 THEN reasons := reasons || 'missing_deep_interpretation'; END IF;
  IF jsonb_array_length(coalesce(g.faq,'[]'::jsonb)) < 3 THEN reasons := reasons || 'missing_faq'; END IF;
  IF length(coalesce(g.logos_meditation,'')) < 20 THEN reasons := reasons || 'missing_logos'; END IF;
  IF coalesce(array_length(g.bible_verses,1),0) < 3 THEN reasons := reasons || 'bible_lt_3'; END IF;
  IF coalesce(array_length(g.catechism_references,1),0) < 2 THEN reasons := reasons || 'catechism_lt_2'; END IF;
  IF coalesce(array_length(g.fathers_refs,1),0) < 1 THEN reasons := reasons || 'fathers_lt_1'; END IF;

  RETURN QUERY SELECT (array_length(reasons,1) IS NULL), ice_v, e, n, reasons;
END;
$$;

GRANT EXECUTE ON FUNCTION public.glossary_quality_gate(TEXT) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public._glossary_enforce_quality_gate()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  gate RECORD;
BEGIN
  IF NEW.status = 'published' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'published') THEN
    SELECT * INTO gate FROM public.glossary_quality_gate(NEW.slug);
    IF NOT gate.passing THEN
      RAISE EXCEPTION 'quality_gate_failed: %', array_to_string(gate.failing_reasons, ', ')
        USING HINT = 'Verbete não cumpre critérios mínimos de qualidade editorial (Sprint 6.6).';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS glossary_quality_gate_trg ON public.glossary;
CREATE TRIGGER glossary_quality_gate_trg
  BEFORE INSERT OR UPDATE OF status ON public.glossary
  FOR EACH ROW EXECUTE FUNCTION public._glossary_enforce_quality_gate();

CREATE OR REPLACE FUNCTION public.compute_glossary_editorial_snapshot(_trigger TEXT DEFAULT 'manual')
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_id UUID;
  prev JSONB;
  per JSONB;
  regs JSONB;
  t_total INT; t_pub INT;
  t_gold INT; t_silver INT; t_bronze INT; t_review INT;
  a_ed NUMERIC; a_nx NUMERIC; a_ice NUMERIC;
  t_pass INT; t_fail INT;
BEGIN
  WITH s AS (
    SELECT g.slug, g.term, g.status,
      public._glossary_editorial_score(g) AS ed,
      public._glossary_nexus_score(g) AS nx
    FROM public.glossary g
  ), s2 AS (
    SELECT slug, term, status, ed, nx,
      ((ed + nx) / 2) AS ice_v,
      (ed >= 90 AND nx >= 90 AND ((ed+nx)/2) >= 85) AS gate_pass
    FROM s
  )
  SELECT
    jsonb_agg(jsonb_build_object(
      'slug', slug, 'term', term, 'status', status,
      'editorial', ed, 'nexus', nx, 'ice', ice_v, 'gate_pass', gate_pass
    ) ORDER BY ice_v ASC),
    count(*), count(*) FILTER (WHERE status='published'),
    count(*) FILTER (WHERE ice_v >= 95),
    count(*) FILTER (WHERE ice_v >= 85 AND ice_v < 95),
    count(*) FILTER (WHERE ice_v >= 70 AND ice_v < 85),
    count(*) FILTER (WHERE ice_v < 70),
    round(avg(ed)::numeric, 2), round(avg(nx)::numeric, 2), round(avg(ice_v)::numeric, 2),
    count(*) FILTER (WHERE gate_pass), count(*) FILTER (WHERE NOT gate_pass)
  INTO per, t_total, t_pub, t_gold, t_silver, t_bronze, t_review,
       a_ed, a_nx, a_ice, t_pass, t_fail
  FROM s2;

  SELECT per_slug INTO prev
  FROM public.editorial_snapshots
  WHERE module = 'glossary' ORDER BY captured_at DESC LIMIT 1;

  IF prev IS NOT NULL THEN
    WITH prev_map AS (
      SELECT (x->>'slug') AS slug, (x->>'ice')::INT AS ice, (x->>'editorial')::INT AS ed, (x->>'nexus')::INT AS nx
      FROM jsonb_array_elements(prev) x
    ), cur_map AS (
      SELECT (x->>'slug') AS slug, (x->>'ice')::INT AS ice, (x->>'editorial')::INT AS ed, (x->>'nexus')::INT AS nx
      FROM jsonb_array_elements(per) x
    )
    SELECT coalesce(jsonb_agg(jsonb_build_object(
      'slug', c.slug, 'ice_prev', p.ice, 'ice_now', c.ice,
      'editorial_delta', c.ed - p.ed, 'nexus_delta', c.nx - p.nx
    )), '[]'::jsonb) INTO regs
    FROM cur_map c JOIN prev_map p USING (slug)
    WHERE c.ice < p.ice OR c.ed < p.ed OR c.nx < p.nx;
  ELSE
    regs := '[]'::jsonb;
  END IF;

  INSERT INTO public.editorial_snapshots(
    module, total, published, gold, silver, bronze, review,
    avg_editorial, avg_nexus, avg_ice, gate_passing, gate_failing,
    per_slug, regressions, trigger
  ) VALUES (
    'glossary', t_total, t_pub, t_gold, t_silver, t_bronze, t_review,
    a_ed, a_nx, a_ice, t_pass, t_fail,
    coalesce(per,'[]'::jsonb), regs, _trigger
  ) RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.compute_glossary_editorial_snapshot(TEXT) TO authenticated, service_role;
