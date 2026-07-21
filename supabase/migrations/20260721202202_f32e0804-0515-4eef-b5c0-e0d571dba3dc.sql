
WITH new_prayer AS (
  INSERT INTO public.prayers (
    slug, title, subtitle, kicker, category, content, content_latin,
    explanation, meditation, estimated_seconds, order_index, tags,
    source_ref, related_bible, related_catechism, related_glossary,
    is_published, engine_version, content_status, bible_refs, catechism_refs, meta
  ) VALUES (
    'oracao-pela-sabedoria','Oração pela Sabedoria',
    'Súplica ao Espírito Santo pelo dom que ordena a alma a Deus',
    'Cathedra · Fundamentais','fundamentais',
    E'Ó Deus dos meus pais e Senhor da misericórdia,\nconcedei-me a Sabedoria que assiste ao vosso trono.\nAmém.',
    E'Deus patrum meorum, da mihi Sapientiam. Amen.',
    'Adaptação de Sabedoria 9,1-11.',
    'A sabedoria é o mais alto dos sete dons do Espírito Santo.',
    180, 50,
    ARRAY['espirito-santo','dons','sabedoria','discernimento','fundamentais']::text[],
    'Sb 9,1-11; CIC 1831; ST II-II q.45',
    ARRAY['Sb 9,1-11','1Cor 2,6-16','Tg 1,5']::text[],
    ARRAY[1831,1845,2690]::int[],
    ARRAY['esperanca-crista','discernimento','virtude']::text[],
    true, 2, 'complete'::content_curation_status,
    '[{"ref":"Sb 9,1-11","label":"Oração de Salomão"},{"ref":"Tg 1,5","label":"Peça a Deus"},{"ref":"1Cor 2,6-16","label":"A sabedoria de Deus"}]'::jsonb,
    ARRAY[1831,1845,2690]::int[],
    '{"portal_theme":"church","accent_icon":"Sparkles","estimated_minutes":3}'::jsonb
  )
  RETURNING id
),
new_section AS (
  INSERT INTO public.prayer_sections (prayer_id, slug, title, subtitle, order_index, weekdays, meta)
  SELECT id, 'principal', 'Oração pela Sabedoria', 'Súplica ao Espírito de Sabedoria', 0, ARRAY[]::int[], '{}'::jsonb
  FROM new_prayer
  RETURNING id, prayer_id
),
new_blocks AS (
  INSERT INTO public.prayer_blocks (prayer_id, section_id, type, title, content, repeat_count, order_index, meta)
  SELECT ns.prayer_id, ns.id, b.type, b.title, b.content, 1, b.ord, '{}'::jsonb
  FROM new_section ns
  CROSS JOIN LATERAL (VALUES
    (0,'intro','Introdução','{"text":"Rezemos com Salomão pedindo o dom que ordena todos os outros."}'::jsonb),
    (1,'text','Oração','{"text":"Ó Deus dos meus pais e Senhor da misericórdia, concedei-me a Sabedoria que assiste ao vosso trono. Amém.","latin":"Deus patrum meorum, da mihi Sapientiam. Amen.","source_ref":"Sb 9,1-11"}'::jsonb),
    (2,'meditation','Meditação Logos','{"text":"Santo Tomás ensina que a sabedoria julga as coisas divinas por conaturalidade — porque ama (ST II-II q.45 a.2)."}'::jsonb),
    (3,'reflection','Aplicação','{"text":"Reze antes de decisões importantes, do estudo ou da Escritura."}'::jsonb),
    (4,'closing','Conclusão','{"text":"Em nome do Pai, do Filho e do Espírito Santo. Amém."}'::jsonb)
  ) AS b(ord,type,title,content)
  RETURNING id, order_index
)
INSERT INTO public.prayer_references (block_id, kind, ref, label, order_index)
SELECT nb.id, r.kind, r.ref, r.label, r.ord
FROM new_blocks nb
JOIN (VALUES
  (1,'bible','Sb 9,1-11','Fonte bíblica',0),
  (1,'bible','Tg 1,5','Peça a Deus',1),
  (2,'catechism','1831','CIC 1831 — sete dons',0),
  (2,'catechism','1845','CIC 1845 — dons da graça',1),
  (2,'patristic','ST II-II q.45','Sto. Tomás — sabedoria como dom',2)
) AS r(order_ref,kind,ref,label,ord) ON r.order_ref = nb.order_index;

INSERT INTO public.glossary (
  term, slug, short_definition, definition, deep_interpretation,
  practical_application, logos_meditation, etymology, historical_context,
  category, language, status, editorial_completeness,
  bible_verses, catechism_references, saints_refs, fathers_refs,
  prayer_refs, magisterium_references, liturgy_refs,
  faq, next_steps, bibliography, nexus_refs, version
) VALUES (
  'Esperança Cristã','esperanca-crista',
  'Virtude teologal pela qual desejamos o Reino dos Céus e a vida eterna, confiando nas promessas de Cristo.',
  'A Esperança é a segunda das três virtudes teologais. É a virtude sobrenatural infundida por Deus na vontade, pela qual o cristão deseja a bem-aventurança eterna e confia nos meios que Deus lhe dá para alcançá-la (CIC 1817).',
  'Tem por objeto o próprio Deus enquanto beatitude do homem. Sto. Tomás define quatro elementos: bem futuro, árduo, possível, a partir do auxílio divino (ST II-II q.17 a.1). Opõe-se ao desespero e à presunção.',
  'Não é otimismo. É certeza firme fundada na fidelidade de Deus (Rm 5,3-5). Ancore-se nos sacramentos, penhor da vida eterna.',
  'Bento XVI ensina em Spe Salvi que quem tem esperança vive de modo diferente (§2). É a virtude do peregrino.',
  'Do latim spes, sperare. Traduz o grego elpís (ἐλπίς).',
  'Consolida-se nos Padres (Sto. Agostinho, Enchiridion) e é sistematizada por Sto. Tomás. Bento XVI, Spe Salvi (2007).',
  'virtude-teologal','pt','draft','complete',
  ARRAY['Rm 5,1-5','Rm 8,24-25','Hb 11,1','1Cor 13,13','1Pd 1,3-9','Tt 2,11-13']::text[],
  ARRAY['1817','1818','1819','1820','1821','2090','2091','2092']::text[],
  ARRAY['tomas-de-aquino','agostinho','bento-xvi','teresa-de-avila']::text[],
  ARRAY['agostinho-enchiridion','tomas-suma-ii-ii-q17']::text[],
  ARRAY['ato-de-esperanca','oracao-pela-sabedoria','pai-nosso']::text[],
  ARRAY['spe-salvi-2007','gaudium-et-spes-21']::text[],
  ARRAY['tempo-do-advento','vigilia-pascal']::text[],
  '[{"q":"Esperança é otimismo?","a":"Não. O otimismo é disposição natural; a esperança é virtude teologal infundida por Deus."},{"q":"É pecado perder a esperança?","a":"O desespero é pecado contra o Espírito Santo (CIC 1864)."},{"q":"Como cultivar?","a":"Sacramentos, oração perseverante e Escritura, nossa consolação (Rm 15,4)."}]'::jsonb,
  '[{"label":"Rezar a Oração pela Sabedoria","href":"/oracao/oracao-pela-sabedoria","kind":"prayer"},{"label":"Estudar a virtude da Fé","href":"/glossario/fe","kind":"glossary"},{"label":"Ler Spe Salvi","href":"/magisterio/spe-salvi","kind":"magisterium"}]'::jsonb,
  '[{"author":"São Tomás de Aquino","work":"Summa Theologiae","section":"II-II, q. 17-22"},{"author":"Santo Agostinho","work":"Enchiridion","section":"cap. 8"},{"author":"Bento XVI","work":"Spe Salvi","section":"Encíclica, 2007"},{"author":"CIC","work":"Catecismo","section":"1817-1821"}]'::jsonb,
  '{"bible":[{"ref":"Rm 5,1-5","label":"A esperança não decepciona"},{"ref":"Hb 11,1","label":"Fundamento"}],"catechism":[{"ref":"1817","label":"Definição"},{"ref":"1818","label":"Alma da vida cristã"}],"prayer":[{"slug":"oracao-pela-sabedoria","label":"Oração pela Sabedoria"}]}'::jsonb,
  1
);

INSERT INTO public.nexus_relations (relation_type, source_kind, source_ref, target_kind, target_ref, note, confidence) VALUES
  ('citacao','other', jsonb_build_object('kind','prayer','slug','oracao-pela-sabedoria'), 'bible_verse',         '{"ref":"Sb 9,1-11"}'::jsonb, 'Fonte bíblica direta', 1.00),
  ('citacao','other', jsonb_build_object('kind','prayer','slug','oracao-pela-sabedoria'), 'catechism_paragraph', '{"ref":"1831"}'::jsonb,      'Sete dons do Espírito Santo', 1.00),
  ('comentario','other', jsonb_build_object('kind','prayer','slug','oracao-pela-sabedoria'), 'patristic',        '{"ref":"ST II-II q.45","author":"Tomás de Aquino"}'::jsonb, 'Sabedoria como dom', 0.95),
  ('citacao','other', jsonb_build_object('kind','glossary','slug','esperanca-crista'),    'bible_verse',         '{"ref":"Rm 5,1-5"}'::jsonb,  'Locus classicus', 1.00),
  ('citacao','other', jsonb_build_object('kind','glossary','slug','esperanca-crista'),    'catechism_paragraph', '{"ref":"1817"}'::jsonb,      'Definição magisterial', 1.00),
  ('comentario','other', jsonb_build_object('kind','glossary','slug','esperanca-crista'), 'magisterium_doc',     '{"ref":"spe-salvi","author":"Bento XVI","year":2007}'::jsonb, 'Encíclica sobre a esperança', 1.00),
  ('paralelo','other', jsonb_build_object('kind','glossary','slug','esperanca-crista'),   'other',               jsonb_build_object('kind','prayer','slug','oracao-pela-sabedoria'), 'Sabedoria ordena a esperança', 0.85);
