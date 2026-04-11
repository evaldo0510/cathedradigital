-- Add journey_id to glossary
ALTER TABLE public.glossary ADD COLUMN journey_id UUID REFERENCES public.journeys(id);

-- Create some short journeys (3-7 days) for practical application
-- Journey for 'Graça' (Grace)
INSERT INTO public.journeys (id, title, subtitle, description, difficulty, estimated_days, category, is_active, is_premium, sort_order)
VALUES (
  'e7a1b2c3-d4e5-4000-8000-000000000001',
  'Vivendo na Graça',
  'Transformando o dom em ação',
  'Uma jornada de 3 dias para aprender a reconhecer e cooperar com a graça de Deus no cotidiano.',
  'iniciante',
  3,
  'fundamentos',
  true,
  false,
  100
);

-- Steps for 'Vivendo na Graça'
INSERT INTO public.journey_steps (journey_id, title, step_order, step_type, content)
VALUES 
('e7a1b2c3-d4e5-4000-8000-000000000001', 'Reconhecer o Dom', 1, 'reflexão', '{"pch": "A graça é a respiração da alma.", "interpretation": "Deus nos atrai através de Sua graça.", "practical_direction": "Identifique 3 momentos de hoje onde você sentiu a mão de Deus.", "guided_exercise": "Fique em silêncio por 5 minutos.", "final_question": "O que você recebeu hoje sem merecer?"}'::jsonb),
('e7a1b2c3-d4e5-4000-8000-000000000001', 'Abertura de Coração', 2, 'oração', '{"pch": "O coração é o altar do encontro.", "interpretation": "A oração abre as portas para a graça atual.", "practical_direction": "Peça luz para uma decisão difícil que você tem hoje.", "guided_exercise": "Reze um Pai Nosso pausadamente.", "final_question": "Você confia na ajuda de Deus?"}'::jsonb),
('e7a1b2c3-d4e5-4000-8000-000000000001', 'Ser Graça para o Outro', 3, 'ação', '{"pch": "O que recebemos de graça, damos de graça.", "interpretation": "Somos canais da bondade divina.", "practical_direction": "Faça um ato de caridade anônimo.", "guided_exercise": "Ajude alguém que não gosta de você.", "final_question": "Como você pode ser um presente para o mundo?"}'::jsonb);

-- Link 'Graça' term to this journey
UPDATE public.glossary SET journey_id = 'e7a1b2c3-d4e5-4000-8000-000000000001' WHERE term = 'Graça';


-- Journey for 'Eucaristia' (Eucharist)
INSERT INTO public.journeys (id, title, subtitle, description, difficulty, estimated_days, category, is_active, is_premium, sort_order)
VALUES (
  'e7a1b2c3-d4e5-4000-8000-000000000002',
  'Pão da Vida',
  'A prática da comunhão diária',
  '3 dias para aprofundar a devoção eucarística e viver o espírito da Missa fora da Igreja.',
  'intermediario',
  3,
  'oracao',
  true,
  false,
  101
);

-- Steps for 'Pão da Vida'
INSERT INTO public.journey_steps (journey_id, title, step_order, step_type, content)
VALUES 
('e7a1b2c3-d4e5-4000-8000-000000000002', 'O Pão nosso', 1, 'estudo', '{"pch": "Cristo é o alimento que não perece.", "interpretation": "A Eucaristia nos sustenta no deserto da vida.", "practical_direction": "Leia João 6, 22-59.", "guided_exercise": "Imagine-se na beira do mar da Galileia ouvindo Jesus.", "final_question": "Do que sua alma tem fome hoje?"}'::jsonb),
('e7a1b2c3-d4e5-4000-8000-000000000002', 'Adoração breve', 2, 'oração', '{"pch": "Estar com Ele é o bastante.", "interpretation": "O silêncio diante do Santíssimo fala mais que mil palavras.", "practical_direction": "Passe em uma Igreja e fique 5 minutos em silêncio.", "guided_exercise": "Simplesmente olhe para o sacrário.", "final_question": "O que você diria a Jesus se O visse face a face?"}'::jsonb),
('e7a1b2c3-d4e5-4000-8000-000000000002', 'Vida como Oferta', 3, 'ação', '{"pch": "Ide em paz e o Senhor vos acompanhe.", "interpretation": "A missa continua no mundo.", "practical_direction": "Ofereça seu cansaço de hoje pela salvação de alguém.", "guided_exercise": "Faça um ato de paciência heroica.", "final_question": "Como sua vida pode ser pão para os outros?"}'::jsonb);

-- Link 'Eucaristia' term to this journey
UPDATE public.glossary SET journey_id = 'e7a1b2c3-d4e5-4000-8000-000000000002' WHERE term = 'Eucaristia';


-- Journey for 'Oração' (Prayer)
INSERT INTO public.journeys (id, title, subtitle, description, difficulty, estimated_days, category, is_active, is_premium, sort_order)
VALUES (
  'e7a1b2c3-d4e5-4000-8000-000000000003',
  'Coração Inquieto',
  'Primeiros passos no diálogo com Deus',
  '3 dias de exercícios práticos para quem quer começar a rezar mas não sabe como.',
  'iniciante',
  3,
  'oracao',
  true,
  false,
  102
);

-- Steps for 'Coração Inquieto'
INSERT INTO public.journey_steps (journey_id, title, step_order, step_type, content)
VALUES 
('e7a1b2c3-d4e5-4000-8000-000000000003', 'Falar com um Amigo', 1, 'oração', '{"pch": "Rezar é estar a sós com quem nos ama.", "interpretation": "Deus já conhece o que você vai dizer.", "practical_direction": "Fale com Deus como se Ele estivesse sentado ao seu lado.", "guided_exercise": "Escreva uma carta para Deus.", "final_question": "O que você tem medo de dizer a Ele?"}'::jsonb),
('e7a1b2c3-d4e5-4000-8000-000000000003', 'Aprender a Ouvir', 2, 'reflexão', '{"pch": "A oração tem dois lados.", "interpretation": "Deus fala através das circunstâncias e do silêncio.", "practical_direction": "Fique 10 minutos sem celular e sem música.", "guided_exercise": "Preste atenção aos pensamentos que trazem paz.", "final_question": "O que Deus está sussurrando em seu coração?"}'::jsonb),
('e7a1b2c3-d4e5-4000-8000-000000000003', 'Oração do Coração', 3, 'ação', '{"pch": "Rezar sem cessar é amar sem cessar.", "interpretation": "Qualquer tarefa pode ser oração se feita por amor.", "practical_direction": "Escolha uma frase curta (jaculatória) para repetir hoje.", "guided_exercise": "Repita: Jesus, eu confio em Vós.", "final_question": "Como sua oração pode se tornar vida?"}'::jsonb);

-- Link 'Oração' term to this journey
UPDATE public.glossary SET journey_id = 'e7a1b2c3-d4e5-4000-8000-000000000003' WHERE term = 'Oração';
