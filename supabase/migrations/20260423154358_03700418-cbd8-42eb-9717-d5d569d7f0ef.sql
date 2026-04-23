-- Enriching 'Santidade' (Holiness)
INSERT INTO public.spiritual_contents (id, title, content_text, type, reference_id, tags) VALUES 
(gen_random_uuid(), 'Sede santos', 'Sede santos, porque eu sou santo.', 'bible', '1 Pe 1, 16', ARRAY['Santidade', 'Deus']),
(gen_random_uuid(), 'A vontade de Deus', 'Pois esta é a vontade de Deus: a vossa santificação.', 'bible', '1 Ts 4, 3', ARRAY['Santidade', 'Vontade de Deus']),
(gen_random_uuid(), 'Catecismo §2013', 'Todos os fiéis cristãos são chamados à plenitude da vida cristã e à perfeição da caridade.', 'catechism', 'CCC 2013', ARRAY['Santidade', 'Caridade']),
(gen_random_uuid(), 'Gaudete et Exsultate', 'O Senhor pede tudo e, em troca, oferece a vida verdadeira, a felicidade para a qual fomos criados.', 'magisterium', 'GE 1', ARRAY['Santidade', 'Felicidade']),
(gen_random_uuid(), 'Fazer o comum extraordinariamente', 'A santidade consiste em fazer a vontade de Deus com alegria, nas pequenas coisas do dia a dia.', 'magisterium', 'S. Madre Teresa', ARRAY['Santidade', 'Rotina']);

-- Enriching 'Sofrimento' (Suffering)
INSERT INTO public.spiritual_contents (id, title, content_text, type, reference_id, tags) VALUES 
(gen_random_uuid(), 'O sofrimento presente', 'Os sofrimentos do tempo presente não têm proporção com a glória que há de ser revelada em nós.', 'bible', 'Rm 8, 18', ARRAY['Sofrimento', 'Glória']),
(gen_random_uuid(), 'Consolo na tribulação', 'Ele nos consola em todas as nossas tribulações, para que possamos consolar os que estão em qualquer angústia.', 'bible', '2 Cor 1, 4', ARRAY['Sofrimento', 'Consolo']),
(gen_random_uuid(), 'Salvifici Doloris', 'O sofrimento humano atingiu o seu auge na paixão de Cristo.', 'magisterium', 'SD 18', ARRAY['Sofrimento', 'Cristo']),
(gen_random_uuid(), 'Catecismo §1505', 'Cristo não curou todos os doentes. Suas curas eram sinais da vinda do Reino de Deus.', 'catechism', 'CCC 1505', ARRAY['Sofrimento', 'Cura']),
(gen_random_uuid(), 'O valor da cruz', 'Sem a cruz, não há santidade.', 'magisterium', 'S. João da Cruz', ARRAY['Sofrimento', 'Santidade']);

-- Enriching 'Humildade' (Humility)
INSERT INTO public.spiritual_contents (id, title, content_text, type, reference_id, tags) VALUES 
(gen_random_uuid(), 'Exaltar e Humilhar', 'Quem se exalta será humilhado, e quem se humilha será exaltado.', 'bible', 'Mt 23, 12', ARRAY['Humildade', 'Virtude']),
(gen_random_uuid(), 'O exemplo de Cristo', 'Aprendei de mim, que sou manso e humilde de coração.', 'bible', 'Mt 11, 29', ARRAY['Humildade', 'Jesus']),
(gen_random_uuid(), 'Catecismo §2559', 'A humildade é o fundamento da oração. Só o que é humilde pode receber o dom de Deus.', 'catechism', 'CCC 2559', ARRAY['Humildade', 'Oração']),
(gen_random_uuid(), 'A verdade sobre si mesmo', 'A humildade é andar na verdade.', 'magisterium', 'S. Teresa d''Ávila', ARRAY['Humildade', 'Verdade']),
(gen_random_uuid(), 'O caminho da santidade', 'Se me perguntais qual o primeiro caminho para a santidade, responderei: a humildade.', 'magisterium', 'S. Agostinho', ARRAY['Humildade', 'Santidade']);

-- Enriching 'Esperança' (Hope)
INSERT INTO public.spiritual_contents (id, title, content_text, type, reference_id, tags) VALUES 
(gen_random_uuid(), 'Esperança que não decepciona', 'A esperança não nos decepciona, porque o amor de Deus foi derramado em nossos corações.', 'bible', 'Rm 5, 5', ARRAY['Esperança', 'Amor']),
(gen_random_uuid(), 'Âncora da alma', 'Essa esperança é para nós como uma âncora da alma, segura e firme.', 'bible', 'Hb 6, 19', ARRAY['Esperança', 'Fé']),
(gen_random_uuid(), 'Catecismo §1817', 'A esperança é a virtude teologal pela qual desejamos o Reino dos céus e a vida eterna.', 'catechism', 'CCC 1817', ARRAY['Esperança', 'Vida Eterna']),
(gen_random_uuid(), 'Spe Salvi', 'Na esperança fomos salvos.', 'magisterium', 'Spe Salvi 1', ARRAY['Esperança', 'Salvação']),
(gen_random_uuid(), 'O sol da manhã', 'A esperança é o sol que afasta as sombras do desespero.', 'magisterium', 'S. João Paulo II', ARRAY['Esperança', 'Luz']);

-- Enriching 'Pecado' (Sin)
INSERT INTO public.spiritual_contents (id, title, content_text, type, reference_id, tags) VALUES 
(gen_random_uuid(), 'O salário do pecado', 'O salário do pecado é a morte, mas o dom gratuito de Deus é a vida eterna.', 'bible', 'Rm 6, 23', ARRAY['Pecado', 'Morte']),
(gen_random_uuid(), 'Se dissermos que não temos pecado', 'Se dissermos que não temos pecado, enganamo-nos a nós mesmos e a verdade não está em nós.', 'bible', '1 Jo 1, 8', ARRAY['Pecado', 'Verdade']),
(gen_random_uuid(), 'Catecismo §1849', 'O pecado é uma falta contra a razão, a verdade e a consciência reta.', 'catechism', 'CCC 1849', ARRAY['Pecado', 'Razão']),
(gen_random_uuid(), 'Reconciliatio et Paenitentia', 'O pecado é um ato pessoal: um ato de liberdade por parte de uma pessoa individual.', 'magisterium', 'ReP 16', ARRAY['Pecado', 'Liberdade']),
(gen_random_uuid(), 'O maior mal', 'Não há maior mal do que o pecado, pois ele nos separa de Deus.', 'magisterium', 'S. Tomás de Aquino', ARRAY['Pecado', 'Deus']);

-- Link all new content to tags
INSERT INTO public.content_tags (content_id, tag_id)
SELECT sc.id, t.id
FROM public.spiritual_contents sc
JOIN public.tags t ON t.label = ANY(sc.tags)
ON CONFLICT (content_id, tag_id) DO NOTHING;
