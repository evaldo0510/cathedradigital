CREATE OR REPLACE FUNCTION public.run_saints_enrichment_heuristic(p_limit integer DEFAULT NULL)
RETURNS public.saints_enrichment_runs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth_internal
AS $$
DECLARE
  v_run public.saints_enrichment_runs;
  v_processed int := 0;
  v_updated int := 0;
  v_country_hits int := 0;
  v_vocation_hits int := 0;
  v_missing_country int := 0;
  v_missing_vocation int := 0;
BEGIN
  IF auth.uid() IS NULL OR NOT auth_internal.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden: admin only';
  END IF;

  INSERT INTO public.saints_enrichment_runs(kind, limit_n, status, triggered_by, started_at)
  VALUES ('heuristic', p_limit, 'running', auth.uid(), now())
  RETURNING * INTO v_run;

  WITH src AS (
    SELECT s.id, s.country, s.vocation, s.category,
      lower(concat_ws(' ',
        s.name,
        coalesce(s.title,''),
        coalesce(s.historical_context,''),
        coalesce(left(s.full_bio, 4000),''),
        array_to_string(coalesce(s.patron_of, ARRAY[]::text[]), ' ')
      )) AS hay
    FROM public.saints s
    WHERE s.country IS NULL OR s.vocation IS NULL
    ORDER BY s.name
    LIMIT COALESCE(p_limit, 100000)
  ),
  inferred AS (
    SELECT id, country, vocation, category, hay,
      CASE
        WHEN country IS NOT NULL THEN country
        WHEN hay ~ '(assis|padu[ao]|rom[ao]|napol|siena|florenç|it[áa]li)' THEN 'Itália'
        WHEN hay ~ '(lisieux|paris|par[íi]s|fran[çc]|lyon|marselha|avinh[ãa]o)' THEN 'França'
        WHEN hay ~ '([áa]vila|sevilha|toledo|espanha|castela|granada)' THEN 'Espanha'
        WHEN hay ~ '(cracovia|polônia|polonia|varsóvia|wadowice)' THEN 'Polônia'
        WHEN hay ~ '(alemanha|munique|colônia|colonia|bavária|bavaria)' THEN 'Alemanha'
        WHEN hay ~ '(irlanda|dublin)' THEN 'Irlanda'
        WHEN hay ~ '(inglaterra|londres|canterbury)' THEN 'Inglaterra'
        WHEN hay ~ '(portugal|lisboa|coimbra|braga|porto)' THEN 'Portugal'
        WHEN hay ~ '(brasil|s[ãa]o paulo|rio de janeiro|bahia|anchieta)' THEN 'Brasil'
        WHEN hay ~ '(m[ée]xic|guadalupe)' THEN 'México'
        WHEN hay ~ '(argentina|buenos aires)' THEN 'Argentina'
        WHEN hay ~ '(gr[ée]cia|atenas|bizant|constantinop|éfeso|efeso)' THEN 'Grécia'
        WHEN hay ~ '(egito|alexandria|nitria|tebaida)' THEN 'Egito'
        WHEN hay ~ '(s[íi]?ria|antioquia|damasco)' THEN 'Síria'
        WHEN hay ~ '(palestin|jerusalé|nazaré|belé)' THEN 'Palestina'
        WHEN hay ~ '(turqui|capad[óo]cia|smir|niceia)' THEN 'Turquia'
        WHEN hay ~ '(hungria|budapeste)' THEN 'Hungria'
        WHEN hay ~ '([áa]ustria|viena)' THEN 'Áustria'
        WHEN hay ~ '(su[íi]ç|zurique|genebra)' THEN 'Suíça'
        WHEN hay ~ '(b[ée]lgic|bruxelas)' THEN 'Bélgica'
        WHEN hay ~ '(holanda|amsterd[ãa])' THEN 'Holanda'
        WHEN hay ~ '(r[úu]ssia|moscou|kiev)' THEN 'Rússia'
        WHEN hay ~ '(estados unidos|eua|nova york|filadélfia)' THEN 'Estados Unidos'
        ELSE NULL
      END AS new_country,
      CASE
        WHEN vocation IS NOT NULL THEN vocation
        WHEN hay ~ '(papa|sumo pontífice)' THEN 'Papa'
        WHEN hay ~ '(cardeal)' THEN 'Cardeal'
        WHEN hay ~ '(bispo|arcebispo|patriarca|metropolita)' THEN 'Bispo'
        WHEN hay ~ '(doutor da igreja|doutora da igreja)' THEN 'Doutor(a) da Igreja'
        WHEN hay ~ '(apóstolo|evangelista)' THEN 'Apóstolo'
        WHEN hay ~ '(mártir)' THEN 'Mártir'
        WHEN hay ~ '(fundador|fundadora)' THEN 'Fundador(a)'
        WHEN hay ~ '(monge|monja|eremita|anacoreta|abade|abadessa)' THEN 'Vida Monástica'
        WHEN hay ~ '(freir[ao]|religios[ao]|carmelita|dominican|francisc|jesuít|beneditin|clariss|salesian|redentorist)' THEN 'Vida Religiosa'
        WHEN hay ~ '(padre|presbítero|sacerdote|pároco)' THEN 'Sacerdote'
        WHEN hay ~ '(diácono)' THEN 'Diácono'
        WHEN hay ~ '(virgem|virgindade consagrada)' THEN 'Virgem consagrada'
        WHEN hay ~ '(missionári[ao])' THEN 'Missionário(a)'
        WHEN hay ~ '(rei|rainha|imperador|imperatriz|príncipe|princesa)' THEN 'Nobreza cristã'
        WHEN hay ~ '(leig[ao]|casad[ao]|mãe de família|pai de família)' THEN 'Leigo(a)'
        WHEN hay ~ '(profeta|patriarca do antigo testamento)' THEN 'Patriarca / Profeta'
        WHEN category = 'pope' THEN 'Papa'
        WHEN category = 'martyr' THEN 'Mártir'
        WHEN category = 'doctor' THEN 'Doutor(a) da Igreja'
        WHEN category = 'apostle' THEN 'Apóstolo'
        WHEN category = 'founder' THEN 'Fundador(a)'
        WHEN category = 'virgin' THEN 'Virgem consagrada'
        WHEN category = 'bishop' THEN 'Bispo'
        WHEN category = 'monk' THEN 'Vida Monástica'
        WHEN category = 'religious' THEN 'Vida Religiosa'
        WHEN category = 'layperson' THEN 'Leigo(a)'
        ELSE NULL
      END AS new_vocation
    FROM src
  ),
  upd AS (
    UPDATE public.saints s
    SET country = COALESCE(s.country, i.new_country),
        vocation = COALESCE(s.vocation, i.new_vocation),
        updated_at = now()
    FROM inferred i
    WHERE s.id = i.id
      AND (
        (s.country IS NULL AND i.new_country IS NOT NULL)
        OR (s.vocation IS NULL AND i.new_vocation IS NOT NULL)
      )
    RETURNING s.id,
             (i.new_country IS NOT NULL AND i.country IS NULL) AS did_country,
             (i.new_vocation IS NOT NULL AND i.vocation IS NULL) AS did_vocation
  )
  SELECT
    (SELECT count(*) FROM src),
    (SELECT count(*) FROM upd),
    (SELECT count(*) FILTER (WHERE did_country) FROM upd),
    (SELECT count(*) FILTER (WHERE did_vocation) FROM upd)
  INTO v_processed, v_updated, v_country_hits, v_vocation_hits;

  SELECT count(*) FILTER (WHERE country IS NULL),
         count(*) FILTER (WHERE vocation IS NULL)
  INTO v_missing_country, v_missing_vocation
  FROM public.saints;

  UPDATE public.saints_enrichment_runs
  SET processed = v_processed,
      updated = v_updated,
      country_hits = v_country_hits,
      vocation_hits = v_vocation_hits,
      remaining_missing_country = v_missing_country,
      remaining_missing_vocation = v_missing_vocation,
      status = 'completed',
      finished_at = now()
  WHERE id = v_run.id
  RETURNING * INTO v_run;

  RETURN v_run;
END;
$$;

REVOKE ALL ON FUNCTION public.run_saints_enrichment_heuristic(integer) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.run_saints_enrichment_heuristic(integer) TO authenticated, service_role;