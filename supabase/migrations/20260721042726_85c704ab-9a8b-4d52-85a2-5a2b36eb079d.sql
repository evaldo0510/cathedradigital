CREATE TABLE public.liturgy_hours_offices (
  iso_date            date NOT NULL,
  hour_slug           text NOT NULL,
  readings_hash       text NOT NULL,
  prompt_hash         text NOT NULL,
  version             integer NOT NULL DEFAULT 1,
  antiphon_opening    text,
  psalmody            jsonb NOT NULL DEFAULT '[]'::jsonb,
  brief_reading_ref   text,
  brief_reading_text  text,
  responsory          text,
  gospel_canticle     jsonb,
  intercessions       jsonb NOT NULL DEFAULT '[]'::jsonb,
  concluding_prayer   text NOT NULL,
  season_note         text,
  model               text,
  provider            text,
  generated_at        timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (iso_date, hour_slug)
);

GRANT SELECT ON public.liturgy_hours_offices TO anon;
GRANT SELECT ON public.liturgy_hours_offices TO authenticated;
GRANT ALL ON public.liturgy_hours_offices TO service_role;

ALTER TABLE public.liturgy_hours_offices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Liturgy hours offices are publicly readable"
  ON public.liturgy_hours_offices
  FOR SELECT
  USING (true);

CREATE INDEX idx_liturgy_hours_offices_generated_at
  ON public.liturgy_hours_offices (generated_at DESC);

DO $$
DECLARE
  v_prayer_id uuid;
  v_section_id uuid;
BEGIN
  INSERT INTO public.prayers (
    slug, title, subtitle, kicker, category, content, content_latin,
    explanation, estimated_seconds, order_index, is_published,
    content_status, engine_version, tags
  )
  VALUES (
    'liturgia-das-horas',
    'Liturgia das Horas',
    'A oração da Igreja que santifica o dia',
    'Officium Divinum',
    'momentos_do_dia'::prayer_category,
    'A Liturgia das Horas é a oração pública e universal da Igreja, distribuída em sete horas canônicas ao longo do dia, para que a jornada humana inteira seja consagrada ao louvor de Deus.',
    'Liturgia Horarum',
    'Também chamada de Ofício Divino ou Breviário. Cristo, cabeça da Igreja, continua orando no seu Corpo pela voz dos que a rezam.',
    2400, 50, true, 'complete'::content_curation_status, 2,
    ARRAY['liturgia','oficio-divino','breviario']
  )
  ON CONFLICT (slug) DO UPDATE
     SET engine_version = 2, is_published = true,
         content_status = 'complete'::content_curation_status,
         title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, kicker = EXCLUDED.kicker,
         content = EXCLUDED.content, content_latin = EXCLUDED.content_latin,
         explanation = EXCLUDED.explanation, category = EXCLUDED.category, tags = EXCLUDED.tags
  RETURNING id INTO v_prayer_id;

  DELETE FROM public.prayer_blocks WHERE prayer_id = v_prayer_id;

  -- 1) Ofício das Leituras
  INSERT INTO public.prayer_sections (prayer_id, slug, title, subtitle, order_index, weekdays, meta)
  VALUES (v_prayer_id, 'oficio', 'Ofício das Leituras', 'Officium Lectionis', 1, ARRAY[0,1,2,3,4,5,6],
          '{"time":"Qualquer hora","latin":"Officium Lectionis"}'::jsonb)
  ON CONFLICT (prayer_id, slug) DO UPDATE
     SET title=EXCLUDED.title, subtitle=EXCLUDED.subtitle,
         order_index=EXCLUDED.order_index, weekdays=EXCLUDED.weekdays, meta=EXCLUDED.meta
  RETURNING id INTO v_section_id;

  INSERT INTO public.prayer_blocks (prayer_id, section_id, mystery_id, type, title, content, repeat_count, order_index) VALUES
    (v_prayer_id, v_section_id, NULL, 'intro', 'Invitatório',
     jsonb_build_object('text','V. Deus, vinde em meu auxílio.'||E'\n'||'R. Senhor, apressai-vos em socorrer-me.'||E'\n\n'||'Glória ao Pai e ao Filho e ao Espírito Santo, como era no princípio, agora e sempre. Amém.',
                        'latin','V. Deus, in adiutorium meum intende.'||E'\n'||'R. Domine, ad adiuvandum me festina.'||E'\n\n'||'Gloria Patri, et Filio, et Spiritui Sancto. Sicut erat in principio, et nunc, et semper, et in saecula saeculorum. Amen.'),
     1, 1),
    (v_prayer_id, v_section_id, NULL, 'prayer', 'Hino',
     jsonb_build_object('text','Aeterne rerum Conditor — Eterno Criador de todas as coisas, que governas a noite e o dia e dás a cada tempo a sua medida.',
                        'latin','Aeterne rerum Conditor, noctem diemque qui regis, et temporum das tempora, ut alleves fastidium.',
                        'rubric','Cantado ou recitado com atenção. Pode-se usar outro hino conforme o tempo litúrgico.'),
     1, 2),
    (v_prayer_id, v_section_id, NULL, 'prayer', 'Oração conclusiva',
     jsonb_build_object('text','Ó Deus, que iluminastes esta noite com o esplendor da verdadeira luz, concedei que, iluminados na terra pela mesma luz, alcancemos no céu a plenitude da sua alegria. Por nosso Senhor Jesus Cristo, vosso Filho, na unidade do Espírito Santo. Amém.'),
     1, 3),
    (v_prayer_id, v_section_id, NULL, 'closing', 'Conclusão',
     jsonb_build_object('text','V. Bendigamos o Senhor. R. Graças a Deus.',
                        'latin','V. Benedicamus Domino. R. Deo gratias.'),
     1, 4);

  -- 2) Laudes
  INSERT INTO public.prayer_sections (prayer_id, slug, title, subtitle, order_index, weekdays, meta)
  VALUES (v_prayer_id, 'laudes', 'Laudes', 'Laudes Matutinae', 2, ARRAY[0,1,2,3,4,5,6],
          '{"time":"06:00","latin":"Laudes Matutinae"}'::jsonb)
  ON CONFLICT (prayer_id, slug) DO UPDATE
     SET title=EXCLUDED.title, subtitle=EXCLUDED.subtitle,
         order_index=EXCLUDED.order_index, weekdays=EXCLUDED.weekdays, meta=EXCLUDED.meta
  RETURNING id INTO v_section_id;

  INSERT INTO public.prayer_blocks (prayer_id, section_id, mystery_id, type, title, content, repeat_count, order_index) VALUES
    (v_prayer_id, v_section_id, NULL, 'intro', 'Invitatório',
     jsonb_build_object('text','V. Senhor, abri os meus lábios. R. E a minha boca anunciará o vosso louvor.'||E'\n\n'||'Glória ao Pai e ao Filho e ao Espírito Santo, como era no princípio, agora e sempre. Amém.',
                        'latin','V. Domine, labia mea aperies. R. Et os meum annuntiabit laudem tuam.'),
     1, 1),
    (v_prayer_id, v_section_id, NULL, 'prayer', 'Hino',
     jsonb_build_object('text','Iam lucis orto sidere — Agora que a estrela da manhã se levanta, supliquemos humildemente a Deus que nos guarde de todo mal durante este dia.',
                        'latin','Iam lucis orto sidere, Deum precemur supplices, ut in diurnis actibus nos servet a nocentibus.'),
     1, 2),
    (v_prayer_id, v_section_id, NULL, 'prayer', 'Oração conclusiva',
     jsonb_build_object('text','Senhor, nosso Deus, Rei do céu e da terra, dignai-vos dirigir e santificar, reger e governar hoje os nossos corações e os nossos corpos, os nossos pensamentos, as nossas palavras e as nossas ações, na observância da vossa lei. Por Cristo, nosso Senhor. Amém.'),
     1, 3),
    (v_prayer_id, v_section_id, NULL, 'closing', 'Bênção e conclusão',
     jsonb_build_object('text','V. O Senhor nos abençoe, nos livre de todo mal e nos conduza à vida eterna. R. Amém.',
                        'rubric','Sacerdotes e diáconos podem usar a fórmula de bênção sacerdotal.'),
     1, 4);

  -- 3) Tércia
  INSERT INTO public.prayer_sections (prayer_id, slug, title, subtitle, order_index, weekdays, meta)
  VALUES (v_prayer_id, 'tercia', 'Hora Tércia', 'Tertia', 3, ARRAY[0,1,2,3,4,5,6],
          '{"time":"09:00","latin":"Tertia"}'::jsonb)
  ON CONFLICT (prayer_id, slug) DO UPDATE
     SET title=EXCLUDED.title, subtitle=EXCLUDED.subtitle,
         order_index=EXCLUDED.order_index, weekdays=EXCLUDED.weekdays, meta=EXCLUDED.meta
  RETURNING id INTO v_section_id;

  INSERT INTO public.prayer_blocks (prayer_id, section_id, mystery_id, type, title, content, repeat_count, order_index) VALUES
    (v_prayer_id, v_section_id, NULL, 'intro', 'Invitatório',
     jsonb_build_object('text','V. Deus, vinde em meu auxílio. R. Senhor, apressai-vos em socorrer-me. Glória ao Pai...'),
     1, 1),
    (v_prayer_id, v_section_id, NULL, 'prayer', 'Hino',
     jsonb_build_object('text','Nunc Sancte nobis Spiritus — Vinde agora, Espírito Santo, uno com o Pai e o Filho, dignai-vos habitar em nossos corações.',
                        'latin','Nunc Sancte nobis Spiritus, unum Patri cum Filio, dignare promptus ingeri nostro refusus pectori.',
                        'rubric','Hora da descida do Espírito Santo sobre os Apóstolos (At 2,15).'),
     1, 2),
    (v_prayer_id, v_section_id, NULL, 'prayer', 'Oração conclusiva',
     jsonb_build_object('text','Senhor Deus todo-poderoso, que nos fizestes chegar ao meio deste dia, concedei-nos a vossa graça para o restante dele e protegei-nos com a vossa misericórdia. Por Cristo, nosso Senhor. Amém.'),
     1, 3),
    (v_prayer_id, v_section_id, NULL, 'closing','Conclusão',
     jsonb_build_object('text','V. Bendigamos o Senhor. R. Graças a Deus.'),
     1, 4);

  -- 4) Sexta
  INSERT INTO public.prayer_sections (prayer_id, slug, title, subtitle, order_index, weekdays, meta)
  VALUES (v_prayer_id, 'sexta', 'Hora Sexta', 'Sexta', 4, ARRAY[0,1,2,3,4,5,6],
          '{"time":"12:00","latin":"Sexta"}'::jsonb)
  ON CONFLICT (prayer_id, slug) DO UPDATE
     SET title=EXCLUDED.title, subtitle=EXCLUDED.subtitle,
         order_index=EXCLUDED.order_index, weekdays=EXCLUDED.weekdays, meta=EXCLUDED.meta
  RETURNING id INTO v_section_id;

  INSERT INTO public.prayer_blocks (prayer_id, section_id, mystery_id, type, title, content, repeat_count, order_index) VALUES
    (v_prayer_id, v_section_id, NULL, 'intro', 'Invitatório',
     jsonb_build_object('text','V. Deus, vinde em meu auxílio. R. Senhor, apressai-vos em socorrer-me. Glória ao Pai...'),
     1, 1),
    (v_prayer_id, v_section_id, NULL, 'prayer', 'Hino',
     jsonb_build_object('text','Rector potens, verax Deus — Regedor poderoso, Deus verdadeiro, que moderais os tempos e as estações, iluminando a manhã e acendendo o fogo do meio-dia.',
                        'latin','Rector potens, verax Deus, qui temperas rerum vices, splendore mane instruis et ignibus meridiem.',
                        'rubric','Hora em que Cristo foi pregado na Cruz (Jo 19,14).'),
     1, 2),
    (v_prayer_id, v_section_id, NULL, 'prayer', 'Oração conclusiva',
     jsonb_build_object('text','Ó Deus, que pela hora sexta subistes à Cruz para a redenção do mundo, concedei-nos que, unidos à vossa Paixão, sejamos sempre gratos pela vossa caridade. Por Cristo, nosso Senhor. Amém.'),
     1, 3),
    (v_prayer_id, v_section_id, NULL, 'closing','Conclusão',
     jsonb_build_object('text','V. Bendigamos o Senhor. R. Graças a Deus.'),
     1, 4);

  -- 5) Nona
  INSERT INTO public.prayer_sections (prayer_id, slug, title, subtitle, order_index, weekdays, meta)
  VALUES (v_prayer_id, 'noa', 'Hora Nona', 'Nona', 5, ARRAY[0,1,2,3,4,5,6],
          '{"time":"15:00","latin":"Nona"}'::jsonb)
  ON CONFLICT (prayer_id, slug) DO UPDATE
     SET title=EXCLUDED.title, subtitle=EXCLUDED.subtitle,
         order_index=EXCLUDED.order_index, weekdays=EXCLUDED.weekdays, meta=EXCLUDED.meta
  RETURNING id INTO v_section_id;

  INSERT INTO public.prayer_blocks (prayer_id, section_id, mystery_id, type, title, content, repeat_count, order_index) VALUES
    (v_prayer_id, v_section_id, NULL, 'intro', 'Invitatório',
     jsonb_build_object('text','V. Deus, vinde em meu auxílio. R. Senhor, apressai-vos em socorrer-me. Glória ao Pai...'),
     1, 1),
    (v_prayer_id, v_section_id, NULL, 'prayer', 'Hino',
     jsonb_build_object('text','Rerum, Deus, tenax vigor — Ó Deus, força constante de todas as coisas, que permaneceis em vós mesmo imutável e governais o curso das horas do dia.',
                        'latin','Rerum, Deus, tenax vigor, immotus in te permanens, lucis diurnae tempora successibus determinans.',
                        'rubric','Hora em que Cristo entregou o espírito na Cruz (Mt 27,46).'),
     1, 2),
    (v_prayer_id, v_section_id, NULL, 'prayer', 'Oração conclusiva',
     jsonb_build_object('text','Senhor Jesus Cristo, que à hora nona entregastes o espírito ao Pai e abris as portas do paraíso ao ladrão arrependido, abri também as portas da vossa misericórdia a nós, pecadores. Vós que viveis e reinais pelos séculos dos séculos. Amém.'),
     1, 3),
    (v_prayer_id, v_section_id, NULL, 'closing','Conclusão',
     jsonb_build_object('text','V. Bendigamos o Senhor. R. Graças a Deus.'),
     1, 4);

  -- 6) Vésperas
  INSERT INTO public.prayer_sections (prayer_id, slug, title, subtitle, order_index, weekdays, meta)
  VALUES (v_prayer_id, 'vesperas', 'Vésperas', 'Vesperae', 6, ARRAY[0,1,2,3,4,5,6],
          '{"time":"18:00","latin":"Vesperae"}'::jsonb)
  ON CONFLICT (prayer_id, slug) DO UPDATE
     SET title=EXCLUDED.title, subtitle=EXCLUDED.subtitle,
         order_index=EXCLUDED.order_index, weekdays=EXCLUDED.weekdays, meta=EXCLUDED.meta
  RETURNING id INTO v_section_id;

  INSERT INTO public.prayer_blocks (prayer_id, section_id, mystery_id, type, title, content, repeat_count, order_index) VALUES
    (v_prayer_id, v_section_id, NULL, 'intro', 'Invitatório',
     jsonb_build_object('text','V. Deus, vinde em meu auxílio. R. Senhor, apressai-vos em socorrer-me. Glória ao Pai...'),
     1, 1),
    (v_prayer_id, v_section_id, NULL, 'prayer', 'Hino',
     jsonb_build_object('text','Lucis Creator optime — Ó ótimo Criador da luz, que fizestes brilhar a luminosidade dos dias, estabelecendo os princípios do mundo pela primeira luz criada.',
                        'latin','Lucis Creator optime, lucem dierum proferens, primordiis lucis novae mundi parans originem.'),
     1, 2),
    (v_prayer_id, v_section_id, NULL, 'prayer', 'Cântico Evangélico — Magnificat',
     jsonb_build_object('text','A minha alma engrandece o Senhor, e o meu espírito se alegra em Deus, meu Salvador... (Lc 1,46-55)',
                        'rubric','Faz-se o sinal da cruz no início do cântico. Todos se põem de pé.'),
     1, 3),
    (v_prayer_id, v_section_id, NULL, 'prayer', 'Oração conclusiva',
     jsonb_build_object('text','Ouvi, Senhor, a nossa oração vespertina e concedei que, seguindo os vestígios da vossa Paixão, alcancemos a glória da Ressurreição. Vós que viveis e reinais pelos séculos dos séculos. Amém.'),
     1, 4),
    (v_prayer_id, v_section_id, NULL, 'closing','Bênção e conclusão',
     jsonb_build_object('text','V. O Senhor nos abençoe, nos livre de todo mal e nos conduza à vida eterna. R. Amém.'),
     1, 5);

  -- 7) Completas
  INSERT INTO public.prayer_sections (prayer_id, slug, title, subtitle, order_index, weekdays, meta)
  VALUES (v_prayer_id, 'completas', 'Completas', 'Completorium', 7, ARRAY[0,1,2,3,4,5,6],
          '{"time":"21:00","latin":"Completorium"}'::jsonb)
  ON CONFLICT (prayer_id, slug) DO UPDATE
     SET title=EXCLUDED.title, subtitle=EXCLUDED.subtitle,
         order_index=EXCLUDED.order_index, weekdays=EXCLUDED.weekdays, meta=EXCLUDED.meta
  RETURNING id INTO v_section_id;

  INSERT INTO public.prayer_blocks (prayer_id, section_id, mystery_id, type, title, content, repeat_count, order_index) VALUES
    (v_prayer_id, v_section_id, NULL, 'intro', 'Exame de consciência',
     jsonb_build_object('text','V. Deus, vinde em meu auxílio. R. Senhor, apressai-vos em socorrer-me. Glória ao Pai...'||E'\n\n'||'Faz-se breve exame de consciência, seguido do ato penitencial.',
                        'rubric','Momento de silêncio antes de recitar o Confesso a Deus.'),
     1, 1),
    (v_prayer_id, v_section_id, NULL, 'prayer', 'Hino',
     jsonb_build_object('text','Te lucis ante terminum — Antes do fim da luz, vos suplicamos, ó Criador de todas as coisas, que pela vossa clemência sejais nosso protetor e guarda.',
                        'latin','Te lucis ante terminum, rerum Creator, poscimus, ut solita clementia sis praesul ad custodiam.'),
     1, 2),
    (v_prayer_id, v_section_id, NULL, 'prayer', 'Cântico Evangélico — Nunc Dimittis',
     jsonb_build_object('text','Agora, Senhor, podeis deixar o vosso servo partir em paz, segundo a vossa palavra... (Lc 2,29-32)',
                        'rubric','Faz-se o sinal da cruz no início do cântico.'),
     1, 3),
    (v_prayer_id, v_section_id, NULL, 'prayer', 'Oração conclusiva',
     jsonb_build_object('text','Visitai, Senhor, esta morada e afastai dela todas as insídias do inimigo. Que os vossos santos anjos nela habitem para nos guardar em paz, e a vossa bênção esteja sempre conosco. Por Cristo, nosso Senhor. Amém.'),
     1, 4),
    (v_prayer_id, v_section_id, NULL, 'prayer', 'Antífona Mariana Final',
     jsonb_build_object('text','Salve, Rainha, Mãe de misericórdia... (ou antífona própria do tempo litúrgico: Alma Redemptoris Mater, Ave Regina Caelorum, Regina Caeli, Salve Regina).',
                        'rubric','Escolhe-se a antífona conforme o tempo do ano litúrgico.'),
     1, 5),
    (v_prayer_id, v_section_id, NULL, 'closing','Bênção da noite',
     jsonb_build_object('text','V. O Senhor todo-poderoso nos conceda uma noite tranquila e uma morte santa. R. Amém.'),
     1, 6);
END$$;