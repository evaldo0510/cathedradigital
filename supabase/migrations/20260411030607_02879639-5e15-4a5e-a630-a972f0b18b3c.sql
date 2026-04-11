-- 1. Update existing steps for 'Primeiros Passos na Fé' (a1b2c3d4-0001-4000-8000-000000000001)
-- Day 1
UPDATE public.journey_steps SET title = 'O Amor de Deus por Você', content = '{
  "pch": "\"O Amor de Deus não é um prêmio para o bom comportamento...\\né um resgate para o naufrágio da sua alma.\"",
  "interpretation": "Descobrir-se amado é a revolução copernicana da alma: o centro deixa de ser o seu ego, suas falhas ou seus méritos, e passa a ser o Coração de Deus.",
  "practical_direction": "Reserve 15 minutos de silêncio absoluto. Feche os olhos e repita interiormente: \"Pai, eu me deixo amar por Ti agora\".",
  "guided_exercise": "Imagine-se diante de Cristo na Cruz. Ele não olha para você com julgamento, mas com uma sede infinita de sua presença. Permaneça nesse olhar por 5 minutos.",
  "journal_prompt": "Qual é a mentira que você conta a si mesmo sobre quem você é? Como essa mentira mudaria se você aceitasse que é amado infinitamente?",
  "bible_ref": "Jo 3,16"
}' WHERE id = '95b1090e-117c-4fd8-95ab-7b18071641cd';

-- Day 2
UPDATE public.journey_steps SET title = 'Primeira Oração', content = '{
  "pch": "\"Rezar não é informar Deus sobre coisas que Ele já sabe...\\né permitir que a Verdade o habite.\"",
  "interpretation": "Oração é o esforço de permanecer na Presença quando tudo em nós quer fugir para o barulho. É a respiração da alma.",
  "practical_direction": "Escolha 10 minutos hoje. Use a oração do publicano: \"Senhor, tende piedade de mim, que sou pecador\". Repita-a com o ritmo da respiração.",
  "guided_exercise": "Reze o Pai Nosso sílaba por sílaba. Pare no \"Pai\" e sinta o que significa ter um Pai Infinito.",
  "journal_prompt": "O que impede você de conversar com Deus como com um amigo? Medo, vergonha ou distância?",
  "bible_ref": "Mt 6,9-13"
}' WHERE id = 'e6c6deb4-e34a-429d-b30b-b65a615964eb';

-- Day 3
UPDATE public.journey_steps SET title = 'A Palavra que Alimenta', content = '{
  "pch": "\"A Bíblia não é um livro de histórias antigas...\\né o registro do diálogo de Deus com você agora.\"",
  "interpretation": "A Palavra de Deus é viva e eficaz, mais cortante que uma espada de dois gumes. Ela revela quem realmente somos.",
  "practical_direction": "Abra o Salmo 139. Leia-o três vezes: com a mente, com o coração e como oração pessoal.",
  "guided_exercise": "Escolha um único versículo que o incomodou ou consolou e guarde-o no bolso da alma para o resto do dia.",
  "journal_prompt": "Qual palavra de Deus hoje tocou a ferida ou o desejo mais profundo do seu coração?",
  "bible_ref": "Sl 139"
}' WHERE id = 'e8b84e31-8e51-419b-8f12-9c97b5678901';

-- Day 4
UPDATE public.journey_steps SET title = 'O Mistério da Igreja', content = '{
  "pch": "\"A Igreja não é um clube de perfeitos...\\né um hospital de campanha para quem reconhece que precisa de cura.\"",
  "interpretation": "Pertencer à Igreja é entrar em uma família que atravessa os séculos. É o Corpo Místico de Cristo na terra.",
  "practical_direction": "Busque conhecer a vida de um santo que você ainda não conhece hoje. Veja como ele viveu a fé no cotidiano.",
  "guided_exercise": "Imagine-se em uma catedral imensa, cercado por todos os anjos e santos. Reze o Credo sentindo-se parte desta multidão.",
  "journal_prompt": "Como você pode ser um sinal de esperança para alguém da sua comunidade hoje?",
  "bible_ref": "Ef 4,4-6"
}' WHERE id = 'f7c75d42-7f62-42ab-9e23-8d88c4567892';

-- Day 5
UPDATE public.journey_steps SET title = 'A Vida Sacramentada', content = '{
  "pch": "\"Os sacramentos são os canais visíveis...\\nde uma Graça invisível que quer inundar sua vida.\"",
  "interpretation": "Deus usa a matéria — água, pão, vinho, óleo — para nos tocar. Ele quer santificar nossa realidade física.",
  "practical_direction": "Se possível, visite uma igreja hoje e fique 10 minutos diante do Santíssimo Sacramento. Se não puder, faça uma comunhão espiritual.",
  "guided_exercise": "Feche os olhos e agradeça por cada vez que a Graça de Deus o alcançou através de um sacramento (batismo, confissão, eucaristia).",
  "journal_prompt": "Qual sacramento você mais sente falta ou precisa buscar com mais urgência hoje?",
  "bible_ref": "Jo 6,51"
}' WHERE id = 'a9d96e53-6f73-43bc-ae34-7c77d5678903';

-- Add Day 6 and 7 for 'Primeiros Passos na Fé'
INSERT INTO public.journey_steps (id, journey_id, step_order, title, subtitle, duration_minutes, is_free, step_type, content) VALUES
(gen_random_uuid(), 'a1b2c3d4-0001-4000-8000-000000000001', 6, 'O Caminho da Cruz', 'Seguindo os passos do Mestre', 15, true, 'reflection', '{
  "pch": "\"A Cruz não é o fim da história...\\né o preço que o Amor pagou pela sua liberdade.\"",
  "interpretation": "Sofrer com Cristo é transformar a dor em redenção. Não estamos sozinhos em nossas provações; Ele as carregou primeiro.",
  "practical_direction": "Identifique uma dificuldade atual em sua vida e diga: \"Senhor, eu uno esta dor à Tua Cruz\".",
  "guided_exercise": "Medite em uma das estações da Via Sacra. Imagine o peso da cruz nos ombros de Jesus e ofereça seu próprio peso a Ele.",
  "journal_prompt": "O que você tem tentado carregar sozinho que deveria entregar ao pé da Cruz?",
  "bible_ref": "Mt 16,24"
}'),
(gen_random_uuid(), 'a1b2c3d4-0001-4000-8000-000000000001', 7, 'Maria: Mãe e Modelo', 'O Sim que mudou o mundo', 12, true, 'prayer', '{
  "pch": "\"Maria não aponta para si mesma...\\nela é o espelho que reflete a luz de Cristo para nós.\"",
  "interpretation": "Acolher Maria como mãe é encurtar o caminho até Jesus. Ela nos ensina a dizer \"sim\" à vontade de Deus mesmo sem entender tudo.",
  "practical_direction": "Reze uma dezena do Rosário hoje, pedindo a Maria que ensine você a amar o Filho dela como ela amou.",
  "guided_exercise": "Recite o Magnificat devagar. Sinta a alegria de Maria em ser pequena diante da grandeza de Deus.",
  "journal_prompt": "Qual é o \"faça-se\" que Deus está pedindo de você hoje?",
  "bible_ref": "Lc 1,38"
}');

-- Update 'Vida de Oração' (a1b2c3d4-2222-4000-8000-000000000002) - Day 7
INSERT INTO public.journey_steps (id, journey_id, step_order, title, subtitle, duration_minutes, is_free, step_type, content) VALUES
(gen_random_uuid(), 'a1b2c3d4-2222-4000-8000-000000000002', 7, 'A Resposta de Deus', 'Ouvindo o silêncio', 15, true, 'reflection', '{
  "pch": "\"Deus responde sempre...\\nàs vezes com um sim, às vezes com um não, e sempre com a Sua Presença.\"",
  "interpretation": "A oração não é um monólogo. Deus fala no silêncio, nos eventos e na paz interior. Aprender a ouvir é tão importante quanto falar.",
  "practical_direction": "Reserve 5 minutos de silêncio absoluto ao final do dia. Não fale nada. Apenas escute.",
  "guided_exercise": "Faça o Exame de Consciência de Santo Inácio. Onde Deus esteve presente em seu dia?",
  "journal_prompt": "Qual foi a última vez que você sentiu a resposta de Deus em algo pequeno?",
  "bible_ref": "1 Rs 19,12"
}');

-- Update 'Prisão Interior' (a1b2c3d4-0004-4000-8000-000000000004) - Day 7
INSERT INTO public.journey_steps (id, journey_id, step_order, title, subtitle, duration_minutes, is_free, step_type, content) VALUES
(gen_random_uuid(), 'a1b2c3d4-0004-4000-8000-000000000004', 7, 'A Liberdade do Filho', 'Vivendo na luz', 20, true, 'reflection', '{
  "pch": "\"A verdadeira liberdade não é fazer o que se quer...\\né querer o que Deus quer, com alegria.\"",
  "interpretation": "Depois de identificar as prisões, é preciso aprender a caminhar no mundo novo. A liberdade é uma prática diária de escolha pelo Bem.",
  "practical_direction": "Escolha um vício ou hábito pequeno e faça o oposto dele hoje deliberadamente.",
  "guided_exercise": "Imagine Jesus abrindo as portas da sua cela interior e convidando você a sair para o sol. Sinta o calor da graça.",
  "journal_prompt": "O que você faria hoje se não tivesse medo de nada?",
  "bible_ref": "Gl 5,1"
}');

-- Update 'Aprofundamento Místico' (a1b2c3d4-0003-4000-8000-000000000003) - Days 6 and 7
INSERT INTO public.journey_steps (id, journey_id, step_order, title, subtitle, duration_minutes, is_free, step_type, content) VALUES
(gen_random_uuid(), 'a1b2c3d4-0003-4000-8000-000000000003', 6, 'A Noite Escura', 'O deserto que purifica', 25, false, 'reflection', '{
  "pch": "\"O silêncio de Deus não é ausência...\\né a profundidade de um Amor que não precisa de palavras.\"",
  "interpretation": "São João da Cruz nos ensina que o deserto espiritual é o lugar onde Deus limpa nossos sentidos para que possamos amá-Lo por quem Ele é, não pelo que nos dá.",
  "practical_direction": "Hoje, se sentir secura na oração, permaneça nela. Não busque consolo, busque o Deus dos consolos.",
  "guided_exercise": "Medite no abandono de Jesus no Getsêmani. Una sua solidão à dEle.",
  "journal_prompt": "Você ama a Deus ou as sensações que a oração te proporciona?",
  "bible_ref": "Mt 26,39"
}'),
(gen_random_uuid(), 'a1b2c3d4-0003-4000-8000-000000000003', 7, 'União Transformante', 'O matrimônio espiritual', 30, false, 'reflection', '{
  "pch": "\"A alma não se perde em Deus...\\nela se encontra plenamente nEle, como uma gota no oceano que se torna mar.\"",
  "interpretation": "O fim da mística é a união total da vontade humana com a divina. É viver o \"já, mas ainda não\" do céu aqui na terra.",
  "practical_direction": "Tente fazer cada pequena tarefa hoje (lavar louça, trabalhar, caminhar) como se estivesse de mãos dadas com Jesus.",
  "guided_exercise": "Reze a Oração de Entrega de Charles de Foucauld: \"Meu Pai, a Ti me entrego, faz de mim o que quiseres.\"",
  "journal_prompt": "Qual parte da sua vida ainda está \"reservada\" só para você e não para Deus?",
  "bible_ref": "Gl 2,20"
}');

-- Update journeys metadata
UPDATE public.journeys SET estimated_days = 7 WHERE id IN ('a1b2c3d4-0001-4000-8000-000000000001', 'a1b2c3d4-2222-4000-8000-000000000002', 'a1b2c3d4-0004-4000-8000-000000000004', 'a1b2c3d4-1111-4000-8000-000000000001', 'a1b2c3d4-0003-4000-8000-000000000003');
UPDATE public.journeys SET estimated_days = 14 WHERE id IN ('b1b2c3d4-3333-4000-8000-000000000003', 'b1b2c3d4-4444-4000-8000-000000000004');
