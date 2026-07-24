
-- === S2.1.a Higiene: consolidar duplicatas ===
UPDATE public.saints
SET merged_into = 'teresinha', status = 'merged', updated_at = now()
WHERE id IN ('terezinha','teresa-lisieux') AND (merged_into IS NULL OR merged_into <> 'teresinha');

UPDATE public.saints
SET editorial_status = 'archived', status = 'archived', updated_at = now()
WHERE id = 'basilio-gregorio';

-- === S2.1.b Seed dos Doutores faltantes ===
INSERT INTO public.saints (id, name, title, category, feast_day, feast_month, feast_day_num, century, editorial_status, editorial_score, source_url, bio)
VALUES
  ('basilio-magno','São Basílio Magno','Doutor da Igreja','doctor','2 de janeiro',1,2,4,'draft',0,'https://pt.wikipedia.org/wiki/Bas%C3%ADlio_de_Cesareia','Padre Capadócio, organizador do monasticismo oriental.'),
  ('gregorio-nazianzeno','São Gregório de Nazianzo','O Teólogo · Doutor da Igreja','doctor','2 de janeiro',1,2,4,'draft',0,'https://pt.wikipedia.org/wiki/Greg%C3%B3rio_de_Nazianzo','Padre Capadócio, chamado "O Teólogo".'),
  ('ambrosio','Santo Ambrósio','Bispo de Milão · Doutor da Igreja','doctor','7 de dezembro',12,7,4,'draft',0,'https://pt.wikipedia.org/wiki/Ambr%C3%B3sio_de_Mil%C3%A3o','Bispo de Milão, mestre de Santo Agostinho.'),
  ('joao-crisostomo','São João Crisóstomo','Boca de Ouro · Doutor da Igreja','doctor','13 de setembro',9,13,4,'draft',0,'https://pt.wikipedia.org/wiki/Jo%C3%A3o_Cris%C3%B3stomo','Patriarca de Constantinopla, homileta insigne.'),
  ('cirilo-alexandria','São Cirilo de Alexandria','Doutor da Igreja','doctor','27 de junho',6,27,5,'draft',0,'https://pt.wikipedia.org/wiki/Cirilo_de_Alexandria','Patriarca de Alexandria, defensor da Theotókos.'),
  ('cirilo-jerusalem','São Cirilo de Jerusalém','Doutor da Igreja','doctor','18 de março',3,18,4,'draft',0,'https://pt.wikipedia.org/wiki/Cirilo_de_Jerusal%C3%A9m','Bispo de Jerusalém, catequista da Igreja primitiva.'),
  ('pedro-crisologo','São Pedro Crisólogo','Doutor da Igreja','doctor','30 de julho',7,30,5,'draft',0,'https://pt.wikipedia.org/wiki/Pedro_Cris%C3%B3logo','Bispo de Ravena, homileta.'),
  ('gregorio-magno','São Gregório Magno','Papa · Doutor da Igreja','doctor','3 de setembro',9,3,6,'draft',0,'https://pt.wikipedia.org/wiki/Papa_Greg%C3%B3rio_I','Papa, reformador da liturgia.'),
  ('beda','São Beda, o Venerável','Doutor da Igreja','doctor','25 de maio',5,25,8,'draft',0,'https://pt.wikipedia.org/wiki/Beda','Monge inglês, historiador da Igreja.'),
  ('joao-damasceno','São João Damasceno','Doutor da Igreja','doctor','4 de dezembro',12,4,8,'draft',0,'https://pt.wikipedia.org/wiki/Jo%C3%A3o_Damasceno','Último Padre grego, defensor das imagens.'),
  ('pedro-damiao','São Pedro Damião','Doutor da Igreja','doctor','21 de fevereiro',2,21,11,'draft',0,'https://pt.wikipedia.org/wiki/Pedro_Dami%C3%A3o','Reformador beneditino.'),
  ('hildegarda-bingen','Santa Hildegarda de Bingen','Doutora da Igreja','doctor','17 de setembro',9,17,12,'draft',0,'https://pt.wikipedia.org/wiki/Hildegarda_de_Bingen','Abadessa beneditina, mística e visionária.'),
  ('alberto-magno','Santo Alberto Magno','Doutor Universal','doctor','15 de novembro',11,15,13,'draft',0,'https://pt.wikipedia.org/wiki/Alberto_Magno','Mestre de Tomás de Aquino.'),
  ('boaventura','São Boaventura','Doutor Seráfico','doctor','15 de julho',7,15,13,'draft',0,'https://pt.wikipedia.org/wiki/Boaventura_de_Bagnoregio','Franciscano, teólogo místico.'),
  ('lourenco-brindisi','São Lourenço de Brindisi','Doutor da Igreja','doctor','21 de julho',7,21,16,'draft',0,'https://pt.wikipedia.org/wiki/Louren%C3%A7o_de_Br%C3%ADndisi','Capuchinho, poliglota.'),
  ('francisco-sales','São Francisco de Sales','Doutor da Igreja','doctor','24 de janeiro',1,24,17,'draft',0,'https://pt.wikipedia.org/wiki/Francisco_de_Sales','Bispo de Genebra, mestre espiritual.'),
  ('joao-avila','São João de Ávila','Doutor da Igreja','doctor','10 de maio',5,10,16,'draft',0,'https://pt.wikipedia.org/wiki/Jo%C3%A3o_de_%C3%81vila','Sacerdote andaluz, mestre espiritual.'),
  ('gregorio-narek','São Gregório de Narek','Doutor da Igreja','doctor','27 de fevereiro',2,27,10,'draft',0,'https://pt.wikipedia.org/wiki/Greg%C3%B3rio_de_Narek','Monge armênio, poeta místico.'),
  ('ireneu-lyon','Santo Ireneu de Lyon','Doutor da Unidade','doctor','28 de junho',6,28,2,'draft',0,'https://pt.wikipedia.org/wiki/Irineu_de_Lyon','Bispo de Lyon, discípulo de Policarpo.'),
  ('efrem','Santo Efrém, o Sírio','Doutor da Igreja','doctor','9 de junho',6,9,4,'draft',0,'https://pt.wikipedia.org/wiki/Efr%C3%A9m_da_S%C3%ADria','Diácono e hinógrafo sírio.'),
  ('hilario-poitiers','Santo Hilário de Poitiers','Doutor da Igreja','doctor','13 de janeiro',1,13,4,'draft',0,'https://pt.wikipedia.org/wiki/Hil%C3%A1rio_de_Poitiers','Bispo, defensor contra o arianismo.')
ON CONFLICT (id) DO NOTHING;

-- === S2.1.c RPC de transição editorial ===
CREATE OR REPLACE FUNCTION public.saints_advance_editorial_stage(
  _saint_id text,
  _next_status editorial_status_enum,
  _note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current editorial_status_enum;
  _uid uuid := auth.uid();
  _score integer;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'auth_required';
  END IF;

  IF NOT (public.has_role(_uid,'admin') OR public.has_role(_uid,'editor') OR public.has_role(_uid,'moderator')) THEN
    RAISE EXCEPTION 'permission_denied' USING HINT = 'requires editor|moderator|admin role';
  END IF;

  SELECT editorial_status, coalesce(editorial_score,0) INTO _current, _score
  FROM public.saints WHERE id = _saint_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'saint_not_found: %', _saint_id;
  END IF;

  -- Transições válidas
  IF NOT (
    (_current = 'draft'             AND _next_status = 'editorial_review')
    OR (_current = 'editorial_review'  AND _next_status IN ('doctrinal_review','draft'))
    OR (_current = 'doctrinal_review'  AND _next_status IN ('published','draft'))
    OR (_current = 'published'         AND _next_status = 'archived')
    OR (_current IS NULL               AND _next_status = 'editorial_review')
  ) THEN
    RAISE EXCEPTION 'invalid_transition: % -> %', _current, _next_status;
  END IF;

  -- Gate para publicação
  IF _next_status = 'published' AND _score < 85 THEN
    RAISE EXCEPTION 'score_below_threshold: % < 85', _score;
  END IF;

  UPDATE public.saints
     SET editorial_status = _next_status,
         editorial_reviewer = _uid,
         editorial_reviewed_at = now(),
         updated_at = now()
   WHERE id = _saint_id;

  INSERT INTO public.saints_audit (saint_id, action, actor_id, payload)
  VALUES (
    _saint_id,
    'editorial_transition',
    _uid,
    jsonb_build_object('from', _current, 'to', _next_status, 'note', _note, 'score', _score)
  );

  RETURN jsonb_build_object('ok', true, 'from', _current, 'to', _next_status);
END;
$$;

REVOKE ALL ON FUNCTION public.saints_advance_editorial_stage(text, editorial_status_enum, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.saints_advance_editorial_stage(text, editorial_status_enum, text) TO authenticated;
