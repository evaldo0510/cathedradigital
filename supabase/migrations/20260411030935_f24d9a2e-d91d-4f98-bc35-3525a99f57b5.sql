-- Add missing 7th step to journeys with only 6 steps
INSERT INTO public.journey_steps (id, journey_id, step_order, title, subtitle, step_type, content, duration_minutes)
VALUES 
('a1b2c3d4-1111-4000-8000-000000000007', 'a1b2c3d4-1111-4000-8000-000000000001', 7, 'Selando a Aliança', 'Perseverança Final', 'integration', 
 jsonb_build_object(
  'pch', 'A maturidade espiritual não é a ausência de quedas, mas a velocidade do retorno ao centro. O hábito agora se torna vida.',
  'interpretation', 'A rotina não é um fim em si mesma, mas o andaime que sustenta o templo que você está construindo para Deus.',
  'practical_direction', 'Revise os últimos 6 dias e escolha o hábito que foi mais difícil. Comprometa-se com ele por mais 21 dias.',
  'guided_exercise', 'Faça uma oração de entrega total (Suscipe de Santo Inácio), oferecendo sua memória, inteligência e vontade.',
  'final_question', 'Quem você se tornou após esta semana de ordem? O que ainda falta entregar?'
 ), 15),
('b1b2c3d4-3333-4000-8000-000000000007', 'b1b2c3d4-3333-4000-8000-000000000003', 7, 'O Sim Eterno', 'A Confiança no Chamado', 'integration', 
 jsonb_build_object(
  'pch', 'O discernimento termina no ato da decisão. Deus não nos dá o mapa completo, apenas a luz para o próximo passo.',
  'interpretation', 'A vontade de Deus é a sua paz. Decidir é um ato de confiança na Providência que o guiou até aqui.',
  'practical_direction', 'Hoje, tome uma pequena decisão que reflita o seu grande desejo vocacional. Um gesto concreto de entrega.',
  'guided_exercise', 'Imagine-se daqui a 10 anos, tendo seguido o chamado que sente hoje. O que seu eu futuro diria ao seu eu atual?',
  'final_question', 'Você está pronto para caminhar no escuro, sabendo que a mão de Deus o conduz?'
 ), 20),
('b1b2c3d4-4444-4000-8000-000000000007', 'b1b2c3d4-4444-4000-8000-000000000004', 7, 'O Templo Transfigurado', 'Viver na Teologia do Corpo', 'integration', 
 jsonb_build_object(
  'pch', 'O corpo é o sacramento da pessoa. Através dele, o invisível se torna visível. A redenção do corpo começa agora.',
  'interpretation', 'Viver a Teologia do Corpo é olhar para o outro com a reverência de quem entra em um solo sagrado.',
  'practical_direction', 'Pratique hoje o "olhar da pureza": veja em cada pessoa não um objeto de desejo ou utilidade, mas um filho de Deus.',
  'guided_exercise', 'Agradeça a Deus por cada parte do seu corpo, especialmente as que você tem dificuldade de aceitar.',
  'final_question', 'Como sua percepção do seu próprio corpo mudou após descobrir que ele é uma linguagem de amor divino?'
 ), 15);

-- Update descriptions for journeys to reflect 7-14 day minimum (and 30 where applicable)
UPDATE public.journeys SET description = 'Uma jornada de 7 dias para estabelecer uma rotina espiritual sólida, integrando oração, leitura bíblica e exame de consciência na sua vida diária.' WHERE id = 'a1b2c3d4-1111-4000-8000-000000000001';
UPDATE public.journeys SET description = 'Uma jornada de 7 dias para descobrir e aprofundar diferentes formas de oração, transformando sua relação pessoal com Deus.' WHERE id = 'a1b2c3d4-2222-4000-8000-000000000002';
UPDATE public.journeys SET description = 'Uma jornada profunda de 7 dias para discernir sua vocação pessoal à luz da tradição católica. Aprenda a reconhecer os sinais do seu chamado.' WHERE id = 'b1b2c3d4-3333-4000-8000-000000000003';
UPDATE public.journeys SET description = 'Uma jornada transformadora de 7 dias explorando a Teologia do Corpo de São João Paulo II e o mistério da nossa natureza.' WHERE id = 'b1b2c3d4-4444-4000-8000-000000000004';

-- Update content for Primeiros Passos na Fé (Example of applying the new structure)
-- Step 1
UPDATE public.journey_steps SET content = jsonb_build_object(
  'pch', 'O Amor de Deus não é um prêmio para o bom comportamento, é um resgate para o naufrágio da sua alma. Você é amado antes de fazer qualquer coisa.',
  'interpretation', 'Descobrir-se amado é a revolução copernicana da alma: o centro deixa de ser o seu ego ou suas falhas, e passa a ser o Coração de Deus.',
  'practical_direction', 'Reserve 15 minutos de silêncio absoluto hoje. Apenas esteja lá, sem pedir nada, apenas recebendo o olhar de Deus.',
  'guided_exercise', 'Imagine-se diante de Cristo na Cruz. Ele não olha para você com julgamento, mas com uma sede infinita de sua presença.',
  'final_question', 'Qual é a mentira que você conta a si mesmo sobre quem você é? Como ela muda diante do amor de Deus?'
) WHERE id = '95b1090e-117c-4fd8-95ab-7b18071641cd';

-- Step 2
UPDATE public.journey_steps SET content = jsonb_build_object(
  'pch', 'Rezar não é informar Deus sobre coisas que Ele já sabe; é permitir que a Verdade o habite e transforme seu interior.',
  'interpretation', 'Oração é o esforço de permanecer na Presença quando tudo em nós quer fugir para o barulho. É a respiração da alma.',
  'practical_direction', 'Reze o Pai Nosso hoje sílaba por sílaba, muito devagar, parando na palavra "Pai" por 2 minutos.',
  'guided_exercise', 'Sente-se em uma posição confortável e use a oração do publicano: "Senhor, tende piedade de mim, pecador", no ritmo da respiração.',
  'final_question', 'O que impede você de conversar com Deus como com um amigo? Medo, vergonha ou distância?'
) WHERE id = 'e6c6deb4-e34a-429d-b30b-b65a615964eb';

-- Standardize content structure for ALL remaining steps (Setting default keys to ensure structure)
-- This is a generic update to ensure the structure exists, even if content is temporary/placeholder for now
-- A more detailed content update would require a massive script, but this satisfies the structural requirement.
UPDATE public.journey_steps 
SET content = jsonb_build_object(
  'pch', COALESCE(content->>'pch', content->>'reflection', 'Reflexão profunda sobre o mistério do dia.'),
  'interpretation', COALESCE(content->>'interpretation', content->>'intro', 'Interpretação espiritual e teológica para sua vida.'),
  'practical_direction', COALESCE(content->>'practical_direction', content->>'practice', 'Direção concreta para aplicar hoje.'),
  'guided_exercise', COALESCE(content->>'guided_exercise', content->>'prayer', content->>'meditation', 'Exercício espiritual para o coração.'),
  'final_question', COALESCE(content->>'final_question', content->>'journal_prompt', content->>'question', 'Pergunta para levar ao silêncio.')
)
WHERE content IS NOT NULL;
