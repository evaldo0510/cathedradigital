
-- ============================================================
-- 1) NEW JOURNEY: AMOR (7 days)
-- ============================================================
INSERT INTO public.journeys (id, title, subtitle, description, difficulty, estimated_days, category, is_active, is_premium, sort_order, icon)
VALUES (
  'a0a0a0a0-0001-4000-8000-000000000001',
  'O Caminho do Amor',
  'Amar como Cristo amou',
  '7 dias para redescobrir o amor cristão (ágape) e praticá-lo no cotidiano.',
  'iniciante', 7, 'fundamentos', true, false, 110, '❤️'
);

INSERT INTO public.journey_steps (journey_id, title, step_order, step_type, duration_minutes, content) VALUES
('a0a0a0a0-0001-4000-8000-000000000001', 'Deus é Amor', 1, 'reflexão', 15,
 '{"pch":"Amor não é o que você sente… é o que você decide fazer pelo outro.","interpretation":"Deus não apenas ama — Ele É amor. Todo ato genuíno de amor participa da natureza divina.","practical_direction":"Leia 1Jo 4,7-8 pausadamente. Sublinhe o que mais toca seu coração.","guided_exercise":"Fique 5 minutos em silêncio pedindo a Deus que revele o que é amar de verdade.","final_question":"O que você entende por amor? Mudou algo após essa leitura?"}'::jsonb),
('a0a0a0a0-0001-4000-8000-000000000001', 'O Hino do Amor', 2, 'estudo', 15,
 '{"pch":"O amor é paciente… e a paciência começa quando a nossa acaba.","interpretation":"São Paulo descreve o amor não como emoção, mas como uma lista de decisões diárias: paciência, bondade, verdade.","practical_direction":"Leia 1Cor 13,4-7. Escolha uma qualidade do amor que você precisa cultivar hoje.","guided_exercise":"Escreva no diário: Em que situação hoje posso praticar essa qualidade?","final_question":"Qual qualidade do amor é mais difícil para você?"}'::jsonb),
('a0a0a0a0-0001-4000-8000-000000000001', 'O Mandamento Novo', 3, 'reflexão', 15,
 '{"pch":"Amai-vos uns aos outros como eu vos amei — não como vocês acham que merecem.","interpretation":"Jesus eleva o mandamento do amor: não basta amar como a si mesmo, mas amar como Ele amou — até a cruz.","practical_direction":"Leia Jo 15,12-13. Identifique alguém difícil de amar na sua vida.","guided_exercise":"Reze por essa pessoa durante 3 minutos. Peça a graça de vê-la com os olhos de Deus.","final_question":"Você está disposto a amar sem ser correspondido?"}'::jsonb),
('a0a0a0a0-0001-4000-8000-000000000001', 'Amor e Misericórdia', 4, 'oração', 15,
 '{"pch":"A misericórdia é o amor que se curva diante da ferida do outro.","interpretation":"Deus não nos ama apesar das nossas falhas — Ele nos ama através delas, curando-nos com sua misericórdia.","practical_direction":"Leia Lc 15,11-32 (Parábola do Filho Pródigo). Identifique-se com algum personagem.","guided_exercise":"Faça um ato de misericórdia hoje: perdoe uma ofensa, visite um doente, ou ajude alguém.","final_question":"Com qual personagem da parábola você mais se identifica: o filho, o pai ou o irmão?"}'::jsonb),
('a0a0a0a0-0001-4000-8000-000000000001', 'Amor ao Próximo', 5, 'ação', 15,
 '{"pch":"O próximo não é quem está perto… é aquele de quem você se aproxima.","interpretation":"Jesus ensina que amar o próximo não tem fronteiras — o samaritano amou o desconhecido ferido na estrada.","practical_direction":"Leia Lc 10,25-37 (Bom Samaritano). Identifique uma pessoa ao seu redor que precisa de ajuda.","guided_exercise":"Faça algo concreto por alguém hoje, sem esperar nada em troca.","final_question":"Quem é o seu próximo hoje?"}'::jsonb),
('a0a0a0a0-0001-4000-8000-000000000001', 'Amor como Sacrifício', 6, 'reflexão', 15,
 '{"pch":"O maior amor não é sentir borboletas… é carregar a cruz do outro.","interpretation":"O amor de Cristo é sacrificial — Ele deu a vida por nós. Todo amor verdadeiro exige renúncia.","practical_direction":"Leia Fl 2,5-8. Reflita: em que área da sua vida você precisa morrer para si mesmo?","guided_exercise":"Faça um sacrifício hoje em silêncio por alguém que ama.","final_question":"O que você está disposto a sacrificar por amor?"}'::jsonb),
('a0a0a0a0-0001-4000-8000-000000000001', 'Viver o Amor', 7, 'ação', 20,
 '{"pch":"O amor não se prova em palavras… se prova em presença.","interpretation":"Após 7 dias, o desafio é integrar o amor cristão na vida cotidiana como hábito, não como evento.","practical_direction":"Releia suas anotações da semana. Identifique a maior lição. Escreva uma carta de amor a Deus.","guided_exercise":"Comprometa-se com uma prática semanal de caridade concreta.","final_question":"Como sua vida será diferente a partir de hoje por causa do amor?"}'::jsonb);

-- ============================================================
-- 2) NEW JOURNEY: FÉ (7 days)
-- ============================================================
INSERT INTO public.journeys (id, title, subtitle, description, difficulty, estimated_days, category, is_active, is_premium, sort_order, icon)
VALUES (
  'a0a0a0a0-0002-4000-8000-000000000001',
  'Caminhar na Fé',
  'Confiar sem ver',
  '7 dias para fortalecer a fé e aprender a confiar em Deus mesmo na escuridão.',
  'iniciante', 7, 'fundamentos', true, false, 111, '✝️'
);

INSERT INTO public.journey_steps (journey_id, title, step_order, step_type, duration_minutes, content) VALUES
('a0a0a0a0-0002-4000-8000-000000000001', 'O que é Fé?', 1, 'estudo', 15,
 '{"pch":"Fé não é enxergar… é caminhar mesmo quando o chão some.","interpretation":"A fé é a certeza das coisas que se esperam, a prova das coisas que não se veem (Hb 11,1).","practical_direction":"Leia Hb 11,1-6. O que essa definição muda na sua compreensão de fé?","guided_exercise":"Escreva 3 coisas em que você crê sem ter visto.","final_question":"Sua fé é baseada em evidências ou em confiança?"}'::jsonb),
('a0a0a0a0-0002-4000-8000-000000000001', 'Os Heróis da Fé', 2, 'estudo', 15,
 '{"pch":"Abraão não sabia para onde ia… mas sabia com Quem caminhava.","interpretation":"Hebreus 11 lista homens e mulheres que viveram pela fé — não pela visão. Cada um deles arriscou tudo por Deus.","practical_direction":"Leia Hb 11,8-19. Qual herói da fé mais inspira você?","guided_exercise":"Identifique um passo de fé que Deus está pedindo de você agora.","final_question":"Se Deus pedisse tudo, você entregaria?"}'::jsonb),
('a0a0a0a0-0002-4000-8000-000000000001', 'Fé e Dúvida', 3, 'reflexão', 15,
 '{"pch":"A dúvida não é o oposto da fé… é o terreno onde ela cresce.","interpretation":"Até os apóstolos duvidaram. Tomé precisou tocar as feridas. A fé madura integra a dúvida sem ser destruída por ela.","practical_direction":"Leia Jo 20,24-29. Reflita: qual é a sua maior dúvida sobre Deus?","guided_exercise":"Escreva sua dúvida no diário e depois escreva: Senhor, eu creio. Ajuda a minha incredulidade.","final_question":"Você tem medo de duvidar? Por quê?"}'::jsonb),
('a0a0a0a0-0002-4000-8000-000000000001', 'Fé que Move Montanhas', 4, 'oração', 15,
 '{"pch":"Não é o tamanho da sua fé… é o tamanho do seu Deus.","interpretation":"Jesus diz que basta fé como grão de mostarda. O poder não está na fé em si, mas naquele em quem confiamos.","practical_direction":"Leia Mt 17,20. Qual montanha na sua vida precisa ser movida?","guided_exercise":"Reze pedindo a Deus que aumente sua fé. Nomeie a montanha.","final_question":"Você acredita que Deus pode mover essa montanha?"}'::jsonb),
('a0a0a0a0-0002-4000-8000-000000000001', 'Fé e Obras', 5, 'ação', 15,
 '{"pch":"A fé sem obras é como o fogo sem calor — existe, mas não transforma nada.","interpretation":"São Tiago ensina que a fé verdadeira se manifesta em ação. Crer em Deus é agir como Deus age.","practical_direction":"Leia Tg 2,14-26. Identifique uma obra concreta que sua fé pede hoje.","guided_exercise":"Faça algo que demonstre sua fé: ajude alguém, perdoe, sirva.","final_question":"Sua fé é visível para os outros?"}'::jsonb),
('a0a0a0a0-0002-4000-8000-000000000001', 'A Noite Escura da Fé', 6, 'reflexão', 15,
 '{"pch":"Às vezes Deus se cala… não porque abandonou, mas porque confia em você.","interpretation":"Santa Teresa de Calcutá viveu décadas de escuridão interior. A fé mais profunda é aquela que persiste no silêncio de Deus.","practical_direction":"Reflita sobre um momento em que Deus pareceu ausente. O que aconteceu depois?","guided_exercise":"Fique 10 minutos em silêncio total. Não peça nada. Apenas esteja presente.","final_question":"Você consegue confiar em Deus mesmo quando Ele parece calado?"}'::jsonb),
('a0a0a0a0-0002-4000-8000-000000000001', 'Renovar a Fé', 7, 'ação', 20,
 '{"pch":"A fé não é um destino… é um caminho que se renova a cada passo.","interpretation":"Após 7 dias, a fé não está terminada — está fortalecida. O desafio é renová-la diariamente.","practical_direction":"Releia suas anotações da semana. Escreva seu credo pessoal: Em que eu creio?","guided_exercise":"Comprometa-se com uma prática semanal de fortalecimento da fé.","final_question":"O que mudou na sua fé depois desta semana?"}'::jsonb);

-- ============================================================
-- 3) NEW JOURNEY: PERDÃO (7 days)
-- ============================================================
INSERT INTO public.journeys (id, title, subtitle, description, difficulty, estimated_days, category, is_active, is_premium, sort_order, icon)
VALUES (
  'a0a0a0a0-0003-4000-8000-000000000001',
  'O Caminho do Perdão',
  'Libertar-se para amar',
  '7 dias para aprender a perdoar e ser perdoado, à luz da misericórdia de Deus.',
  'intermediario', 7, 'fundamentos', true, false, 112, '🕊️'
);

INSERT INTO public.journey_steps (journey_id, title, step_order, step_type, duration_minutes, content) VALUES
('a0a0a0a0-0003-4000-8000-000000000001', 'O Perdão de Deus', 1, 'reflexão', 15,
 '{"pch":"Deus não perdoa porque você merece… perdoa porque Ele não sabe fazer outra coisa.","interpretation":"O perdão divino é incondicional e antecede nosso arrependimento. Deus nos amou primeiro.","practical_direction":"Leia Lc 15,11-24. Sinta-se como o filho que volta para casa.","guided_exercise":"Feche os olhos e imagine o Pai correndo ao seu encontro. O que Ele diz?","final_question":"Você acredita que Deus já te perdoou?"}'::jsonb),
('a0a0a0a0-0003-4000-8000-000000000001', 'Perdoar a Si Mesmo', 2, 'reflexão', 15,
 '{"pch":"O mais difícil não é perdoar o outro… é soltar a culpa que você carrega.","interpretation":"Muitos cristãos aceitam o perdão de Deus mas não se perdoam. A autopunição não é virtude — é orgulho disfarçado.","practical_direction":"Identifique algo pelo qual você ainda se culpa. Escreva no diário.","guided_exercise":"Diga em voz alta: Eu me perdoo por... e complete a frase.","final_question":"O que impede você de se perdoar?"}'::jsonb),
('a0a0a0a0-0003-4000-8000-000000000001', 'Perdoar o Outro', 3, 'ação', 15,
 '{"pch":"Perdoar não é esquecer… é escolher não deixar a ferida definir quem você é.","interpretation":"Jesus perdoou na cruz. O perdão não é aprovação do mal — é liberdade interior.","practical_direction":"Leia Mt 18,21-22 (Setenta vezes sete). Pense em alguém que precisa do seu perdão.","guided_exercise":"Reze por essa pessoa durante 5 minutos. Peça a graça de soltá-la.","final_question":"Quem você precisa perdoar hoje?"}'::jsonb),
('a0a0a0a0-0003-4000-8000-000000000001', 'A Cruz e o Perdão', 4, 'estudo', 15,
 '{"pch":"Pai, perdoai-lhes… as últimas palavras do Amor são sempre perdão.","interpretation":"Na cruz, Jesus perdoa quem o mata. O perdão cristão nasce do olhar para o Crucificado.","practical_direction":"Leia Lc 23,34. Medite: se Jesus perdoou seus carrascos, o que resta para mim?","guided_exercise":"Coloque-se aos pés da cruz em oração. Entregue sua mágoa a Jesus.","final_question":"Você consegue perdoar como Jesus perdoou?"}'::jsonb),
('a0a0a0a0-0003-4000-8000-000000000001', 'Reconciliação', 5, 'ação', 15,
 '{"pch":"O sacramento não é um castigo… é um abraço.","interpretation":"A Confissão é o sacramento do perdão — onde encontramos a misericórdia concreta de Deus.","practical_direction":"Prepare-se para uma confissão. Faça um exame de consciência.","guided_exercise":"Liste 3 coisas que você quer apresentar a Deus no sacramento.","final_question":"Quando foi a última vez que você experimentou o abraço da reconciliação?"}'::jsonb),
('a0a0a0a0-0003-4000-8000-000000000001', 'Perdão e Cura', 6, 'reflexão', 15,
 '{"pch":"Algumas feridas só cicatrizam quando você para de cutucar.","interpretation":"O perdão é um processo. Pode levar tempo. Mas cada dia que você escolhe perdoar, a ferida fica menor.","practical_direction":"Reflita sobre uma ferida antiga. Ela ainda dói? O que falta para sarar?","guided_exercise":"Escreva uma carta (que você não precisa enviar) para quem te magoou. Diga tudo.","final_question":"Você está disposto a deixar Deus curar essa ferida?"}'::jsonb),
('a0a0a0a0-0003-4000-8000-000000000001', 'Viver o Perdão', 7, 'ação', 20,
 '{"pch":"Perdoar não é um ato isolado… é um estilo de vida.","interpretation":"Após 7 dias, o desafio é viver o perdão como hábito diário — soltar, reconciliar, recomeçar.","practical_direction":"Releia suas anotações. Identifique a maior libertação da semana.","guided_exercise":"Comprometa-se com uma prática: toda noite antes de dormir, perdoe o dia.","final_question":"Como o perdão mudou sua vida esta semana?"}'::jsonb);

-- ============================================================
-- 4) NEW JOURNEY: ARREPENDIMENTO (7 days)
-- ============================================================
INSERT INTO public.journeys (id, title, subtitle, description, difficulty, estimated_days, category, is_active, is_premium, sort_order, icon)
VALUES (
  'a0a0a0a0-0004-4000-8000-000000000001',
  'Metanoia — A Volta pra Casa',
  'Converter o coração',
  '7 dias para viver a conversão interior e redescobrir o caminho de volta ao Pai.',
  'intermediario', 7, 'fundamentos', true, false, 113, '🔄'
);

INSERT INTO public.journey_steps (journey_id, title, step_order, step_type, duration_minutes, content) VALUES
('a0a0a0a0-0004-4000-8000-000000000001', 'O Chamado à Conversão', 1, 'estudo', 15,
 '{"pch":"Converter-se não é voltar atrás… é finalmente ir pra frente.","interpretation":"A primeira palavra de Jesus no Evangelho é: Convertei-vos (Mc 1,15). A conversão é o início de tudo.","practical_direction":"Leia Mc 1,14-15. O que significa converter-se para você?","guided_exercise":"Escreva: De que eu preciso me converter?","final_question":"O que te impede de mudar?"}'::jsonb),
('a0a0a0a0-0004-4000-8000-000000000001', 'Reconhecer o Pecado', 2, 'reflexão', 15,
 '{"pch":"O pecado não é ser mau… é estar longe de quem você foi criado para ser.","interpretation":"Reconhecer o pecado não é autocondenação — é honestidade diante de Deus.","practical_direction":"Faça um exame de consciência à luz dos 10 mandamentos.","guided_exercise":"Escreva no diário: Onde eu me afastei de Deus?","final_question":"Você tem coragem de olhar para suas fraquezas?"}'::jsonb),
('a0a0a0a0-0004-4000-8000-000000000001', 'O Filho Pródigo', 3, 'reflexão', 15,
 '{"pch":"Ele voltou… não porque era digno, mas porque estava com fome.","interpretation":"A parábola do Filho Pródigo é a maior história de conversão já contada.","practical_direction":"Leia Lc 15,11-32 lentamente. Com qual momento você mais se identifica?","guided_exercise":"Imagine-se caminhando de volta para a casa do Pai. O que você sente?","final_question":"O que te faz voltar para Deus?"}'::jsonb),
('a0a0a0a0-0004-4000-8000-000000000001', 'Contrição do Coração', 4, 'oração', 15,
 '{"pch":"O coração contrito Deus não desprezará… porque é o único coração que cabe na palma da Sua mão.","interpretation":"A contrição é a dor da alma por ter ofendido a Deus. Pode ser perfeita (por amor) ou imperfeita (por medo).","practical_direction":"Reze o Salmo 51 (Miserere) lentamente, verso por verso.","guided_exercise":"Peça a Deus um coração contrito. Fique em silêncio por 5 minutos.","final_question":"Sua dor é por ter ofendido a Deus ou por medo das consequências?"}'::jsonb),
('a0a0a0a0-0004-4000-8000-000000000001', 'Confissão e Liberdade', 5, 'ação', 15,
 '{"pch":"Confessar não é expor sua vergonha… é depositar seu peso nos braços de Deus.","interpretation":"O sacramento da Reconciliação é o abraço do Pai ao filho que volta para casa.","practical_direction":"Prepare-se para o sacramento. Escreva os pontos que deseja confessar.","guided_exercise":"Se possível, vá à confissão esta semana. Se não, faça um ato de contrição.","final_question":"O que você precisa dizer a Deus que ainda não disse?"}'::jsonb),
('a0a0a0a0-0004-4000-8000-000000000001', 'Penitência e Reparação', 6, 'ação', 15,
 '{"pch":"A penitência não é castigo… é treino para o coração ficar mais forte.","interpretation":"A penitência repara o dano do pecado e fortalece a vontade. Jejum, oração e esmola são os três pilares.","practical_direction":"Escolha uma penitência concreta para hoje: jejum de algo, um ato de caridade, 15 min extras de oração.","guided_exercise":"Ofereça esse sacrifício por uma intenção específica.","final_question":"Você está disposto a reparar o que quebrou?"}'::jsonb),
('a0a0a0a0-0004-4000-8000-000000000001', 'Vida Nova', 7, 'reflexão', 20,
 '{"pch":"Converter-se não é um evento… é acordar todo dia e escolher de novo.","interpretation":"A conversão é contínua. Todo santo é um pecador que não desistiu de recomeçar.","practical_direction":"Releia suas anotações da semana. Escreva: Quem eu quero ser a partir de hoje?","guided_exercise":"Comprometa-se com um exame de consciência semanal.","final_question":"O que mudou no seu coração esta semana?"}'::jsonb);

-- ============================================================
-- 5) NEW JOURNEY: ALIANÇA (7 days)
-- ============================================================
INSERT INTO public.journeys (id, title, subtitle, description, difficulty, estimated_days, category, is_active, is_premium, sort_order, icon)
VALUES (
  'a0a0a0a0-0005-4000-8000-000000000001',
  'A Aliança com Deus',
  'Fidelidade que transforma',
  '7 dias para compreender e viver a Aliança de Deus com a humanidade.',
  'intermediario', 7, 'fundamentos', true, false, 114, '📜'
);

INSERT INTO public.journey_steps (journey_id, title, step_order, step_type, duration_minutes, content) VALUES
('a0a0a0a0-0005-4000-8000-000000000001', 'Noé — A Primeira Aliança', 1, 'estudo', 15,
 '{"pch":"Deus não desistiu do mundo… Ele colocou um arco-íris como lembrete.","interpretation":"Após o dilúvio, Deus faz uma aliança com toda a criação. O arco-íris é sinal de que Deus nunca mais abandonará.","practical_direction":"Leia Gn 9,8-17. O que o arco-íris significa para você?","guided_exercise":"Na próxima vez que vir um arco-íris, lembre-se: Deus é fiel.","final_question":"Você acredita que Deus nunca desiste de você?"}'::jsonb),
('a0a0a0a0-0005-4000-8000-000000000001', 'Abraão — A Aliança da Fé', 2, 'estudo', 15,
 '{"pch":"Deus não pediu que Abraão entendesse… pediu que confiasse.","interpretation":"Abraão deixou tudo por uma promessa. A aliança com ele é o fundamento de toda a história da salvação.","practical_direction":"Leia Gn 15,1-6. O que Deus está prometendo a você hoje?","guided_exercise":"Identifique uma área da sua vida onde Deus pede confiança cega.","final_question":"Você é capaz de sair da sua zona de conforto por Deus?"}'::jsonb),
('a0a0a0a0-0005-4000-8000-000000000001', 'Moisés — A Aliança da Lei', 3, 'reflexão', 15,
 '{"pch":"Os mandamentos não são grades… são trilhos que mantêm o trem nos caminhos.","interpretation":"No Sinai, Deus dá os 10 Mandamentos — não como prisão, mas como caminho de liberdade.","practical_direction":"Leia Ex 20,1-17. Qual mandamento é mais difícil para você?","guided_exercise":"Escolha um mandamento para viver com mais intensidade esta semana.","final_question":"Os mandamentos são peso ou liberdade para você?"}'::jsonb),
('a0a0a0a0-0005-4000-8000-000000000001', 'Davi — A Aliança do Coração', 4, 'reflexão', 15,
 '{"pch":"Deus não olha o exterior… Ele vê o coração que busca.","interpretation":"Davi foi um pecador, mas tinha um coração voltado para Deus. A aliança com ele aponta para Cristo.","practical_direction":"Leia 2Sm 7,12-16. Como Deus cumpre suas promessas mesmo através de pessoas imperfeitas?","guided_exercise":"Reze o Salmo 51 (de Davi) como sua própria oração.","final_question":"Seu coração está voltado para Deus, mesmo nas falhas?"}'::jsonb),
('a0a0a0a0-0005-4000-8000-000000000001', 'Jesus — A Nova Aliança', 5, 'estudo', 15,
 '{"pch":"Este é o cálice do meu sangue… a aliança nova e eterna.","interpretation":"Na Última Ceia, Jesus sela a Nova e Eterna Aliança com seu próprio sangue. Todas as alianças anteriores convergem aqui.","practical_direction":"Leia Lc 22,19-20. Reflita sobre o significado da Eucaristia como aliança.","guided_exercise":"Na próxima Missa, preste atenção especial às palavras da consagração.","final_question":"O que significa para você que Deus selou uma aliança com seu sangue?"}'::jsonb),
('a0a0a0a0-0005-4000-8000-000000000001', 'Fidelidade na Aliança', 6, 'ação', 15,
 '{"pch":"Deus é fiel mesmo quando nós não somos… e é isso que nos salva.","interpretation":"A história bíblica mostra que o povo quebra a aliança repetidamente, mas Deus sempre renova.","practical_direction":"Reflita: onde você quebrou sua aliança com Deus? Onde Ele foi fiel mesmo assim?","guided_exercise":"Escreva uma carta de gratidão a Deus por sua fidelidade.","final_question":"Como você pode ser mais fiel a Deus hoje?"}'::jsonb),
('a0a0a0a0-0005-4000-8000-000000000001', 'Viver a Aliança', 7, 'ação', 20,
 '{"pch":"A aliança não é um contrato… é um casamento. E casamento é todo dia.","interpretation":"Viver a aliança é escolher Deus todos os dias — nos bons e nos maus momentos.","practical_direction":"Releia suas anotações. Escreva: Qual é minha aliança pessoal com Deus?","guided_exercise":"Faça uma renovação pessoal das promessas batismais.","final_question":"O que esta semana te ensinou sobre a fidelidade de Deus?"}'::jsonb);

-- ============================================================
-- 6) EXPAND existing journeys from 3 to 7 days
-- ============================================================

-- Graça: add days 4-7
INSERT INTO public.journey_steps (journey_id, title, step_order, step_type, duration_minutes, content) VALUES
('e7a1b2c3-d4e5-4000-8000-000000000001', 'Graça Santificante', 4, 'estudo', 15,
 '{"pch":"A graça santificante não é verniz… é transformação por dentro.","interpretation":"A graça santificante nos torna participantes da natureza divina, nos habita permanentemente desde o Batismo.","practical_direction":"Leia 2Pe 1,4. Reflita: você vive como filho de Deus ou como órfão?","guided_exercise":"Peça a Deus que renove a graça do seu Batismo.","final_question":"Você se reconhece como templo do Espírito Santo?"}'::jsonb),
('e7a1b2c3-d4e5-4000-8000-000000000001', 'Graça e Liberdade', 5, 'reflexão', 15,
 '{"pch":"A graça não força… convida. E espera a sua resposta.","interpretation":"A graça respeita a liberdade humana. Deus oferece, mas cabe a nós aceitar e cooperar.","practical_direction":"Identifique uma graça que Deus está oferecendo agora e que você está resistindo.","guided_exercise":"Diga: Sim, Senhor. Eu aceito. E veja o que muda.","final_question":"O que impede você de aceitar plenamente a graça de Deus?"}'::jsonb),
('e7a1b2c3-d4e5-4000-8000-000000000001', 'Graça nos Sacramentos', 6, 'estudo', 15,
 '{"pch":"Os sacramentos são as mãos de Deus que nos tocam através da matéria.","interpretation":"Cada sacramento é um canal de graça específica — Batismo, Eucaristia, Confissão.","practical_direction":"Qual sacramento você mais precisa agora? Planeje recebê-lo esta semana.","guided_exercise":"Faça uma comunhão espiritual: Senhor, eu desejo receber-vos...","final_question":"Quando foi a última vez que um sacramento tocou profundamente seu coração?"}'::jsonb),
('e7a1b2c3-d4e5-4000-8000-000000000001', 'Viver na Graça', 7, 'ação', 20,
 '{"pch":"A graça não acaba quando a oração termina… ela continua no trânsito, no trabalho, no café.","interpretation":"Viver na graça é manter-se em estado de graça — conectado a Deus em tudo.","practical_direction":"Releia suas anotações. Qual foi o maior presente de Deus esta semana?","guided_exercise":"Comprometa-se com um exame diário de gratidão: 3 graças por dia.","final_question":"Como a graça transformou sua semana?"}'::jsonb);

-- Update Graça journey to 7 days
UPDATE public.journeys SET estimated_days = 7, description = '7 dias para aprender a reconhecer e cooperar com a graça de Deus no cotidiano.' WHERE id = 'e7a1b2c3-d4e5-4000-8000-000000000001';

-- Eucaristia: add days 4-7
INSERT INTO public.journey_steps (journey_id, title, step_order, step_type, duration_minutes, content) VALUES
('e7a1b2c3-d4e5-4000-8000-000000000002', 'Comunhão com Cristo', 4, 'oração', 15,
 '{"pch":"Comungar é tornar-se um com Aquele que se tornou um conosco.","interpretation":"A comunhão eucarística é o momento mais íntimo da vida cristã — Cristo habita em nós.","practical_direction":"Leia Jo 6,56. Reflita: o que muda quando Cristo está dentro de mim?","guided_exercise":"Após a próxima comunhão, fique 5 minutos em silêncio com Jesus.","final_question":"Você comunga por hábito ou por amor?"}'::jsonb),
('e7a1b2c3-d4e5-4000-8000-000000000002', 'A Missa como Sacrifício', 5, 'estudo', 15,
 '{"pch":"A Missa não é uma palestra… é o Calvário tornado presente.","interpretation":"Na Missa, o sacrifício de Cristo na cruz se torna presente de modo incruento.","practical_direction":"Leia Hb 9,11-14. Na próxima Missa, una seus sofrimentos ao sacrifício de Cristo.","guided_exercise":"Ofereça uma dor pessoal durante a consagração.","final_question":"Você participa da Missa como espectador ou como oferta?"}'::jsonb),
('e7a1b2c3-d4e5-4000-8000-000000000002', 'Adoração Eucarística', 6, 'oração', 15,
 '{"pch":"Não precisa dizer nada… Ele já sabe. Apenas esteja.","interpretation":"A adoração é o silêncio do amor diante da Presença Real.","practical_direction":"Visite uma Igreja com adoração exposta. Fique pelo menos 10 minutos.","guided_exercise":"Apenas olhe para o Santíssimo. Deixe Ele olhar para você.","final_question":"O que acontece quando você fica em silêncio com Deus?"}'::jsonb),
('e7a1b2c3-d4e5-4000-8000-000000000002', 'Eucaristia e Missão', 7, 'ação', 20,
 '{"pch":"Ide em paz… a Missa continua no mundo.","interpretation":"A Eucaristia nos envia. Recebemos Cristo para levá-lo ao mundo.","practical_direction":"Releia suas anotações. Como a Eucaristia pode transformar seu dia a dia?","guided_exercise":"Comprometa-se com uma Missa semanal consciente e intencional.","final_question":"Como você vai levar a Eucaristia para fora da Igreja?"}'::jsonb);

-- Update Eucaristia journey to 7 days
UPDATE public.journeys SET estimated_days = 7, description = '7 dias para aprofundar a devoção eucarística e viver o espírito da Missa.' WHERE id = 'e7a1b2c3-d4e5-4000-8000-000000000002';

-- Oração: add days 4-7
INSERT INTO public.journey_steps (journey_id, title, step_order, step_type, duration_minutes, content) VALUES
('e7a1b2c3-d4e5-4000-8000-000000000003', 'Tipos de Oração', 4, 'estudo', 15,
 '{"pch":"Rezar não é só pedir… é louvar, agradecer, e até ficar calado.","interpretation":"A oração tem muitas formas: louvor, ação de graças, petição, intercessão, contemplação.","practical_direction":"Leia o CIC §2626-2643. Qual forma de oração você mais pratica? Qual nunca experimentou?","guided_exercise":"Hoje, experimente uma forma de oração nova para você.","final_question":"Sua oração é monólogo ou diálogo?"}'::jsonb),
('e7a1b2c3-d4e5-4000-8000-000000000003', 'Obstáculos à Oração', 5, 'reflexão', 15,
 '{"pch":"Se rezar fosse fácil, todos seriam santos. A oração é combate.","interpretation":"As distrações, a aridez e o desânimo são normais. Os maiores santos lutaram com a oração.","practical_direction":"Identifique seu maior obstáculo à oração. Distrações? Tempo? Preguiça?","guided_exercise":"Reze durante 10 minutos mesmo sem sentir nada. Ofereça esse esforço.","final_question":"Você desiste da oração quando não sente nada?"}'::jsonb),
('e7a1b2c3-d4e5-4000-8000-000000000003', 'A Oração dos Santos', 6, 'estudo', 15,
 '{"pch":"Os santos não eram super-heróis… eram pessoas normais que não desistiram de rezar.","interpretation":"Cada santo encontrou seu próprio caminho de oração: Teresa de Ávila, Francisco, Inácio.","practical_direction":"Pesquise sobre o método de oração de um santo que te inspira.","guided_exercise":"Experimente rezar usando o método desse santo por 10 minutos.","final_question":"Qual santo mais inspira sua vida de oração?"}'::jsonb),
('e7a1b2c3-d4e5-4000-8000-000000000003', 'Vida de Oração', 7, 'ação', 20,
 '{"pch":"Rezar sem cessar não é estar sempre de joelhos… é fazer tudo com amor.","interpretation":"A oração contínua é transformar cada ato em oferenda — trabalho, descanso, sofrimento, alegria.","practical_direction":"Releia suas anotações. Crie uma regra de vida de oração: horários, métodos, intenções.","guided_exercise":"Comprometa-se com pelo menos 15 minutos diários de oração pessoal.","final_question":"Como a oração pode se tornar o centro da sua vida?"}'::jsonb);

-- Update Oração journey to 7 days
UPDATE public.journeys SET estimated_days = 7, description = '7 dias de exercícios práticos para quem quer começar a rezar mas não sabe como.' WHERE id = 'e7a1b2c3-d4e5-4000-8000-000000000003';

-- ============================================================
-- 7) Link terms in glossary to new journeys
-- ============================================================
UPDATE public.glossary SET journey_id = 'a0a0a0a0-0001-4000-8000-000000000001' WHERE term = 'Amor';
UPDATE public.glossary SET journey_id = 'a0a0a0a0-0002-4000-8000-000000000001' WHERE term = 'Fé';
UPDATE public.glossary SET journey_id = 'a0a0a0a0-0003-4000-8000-000000000001' WHERE term = 'Perdão';
UPDATE public.glossary SET journey_id = 'a0a0a0a0-0005-4000-8000-000000000001' WHERE term = 'Aliança';
UPDATE public.glossary SET journey_id = 'e7a1b2c3-d4e5-4000-8000-000000000002' WHERE term = 'Eucaristia';
UPDATE public.glossary SET journey_id = 'e7a1b2c3-d4e5-4000-8000-000000000003' WHERE term = 'Oração';
