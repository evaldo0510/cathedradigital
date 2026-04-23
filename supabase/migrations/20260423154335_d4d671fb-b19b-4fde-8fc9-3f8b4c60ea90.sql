-- Enriching 'Amor' (Love)
INSERT INTO public.spiritual_contents (id, title, content_text, type, reference_id, tags) VALUES 
(gen_random_uuid(), 'Deus é Amor', 'Aquele que não ama não conhece a Deus, porque Deus é amor.', 'bible', '1 Jo 4, 8', ARRAY['Amor', 'Deus']),
(gen_random_uuid(), 'O Mandamento do Amor', 'Este é o meu mandamento: amai-vos uns aos outros como eu vos amei.', 'bible', 'Jo 15, 12', ARRAY['Amor', 'Jesus']),
(gen_random_uuid(), 'Deus caritas est (Bento XVI)', 'Deus é amor, e quem permanece no amor permanece em Deus e Deus nele.', 'magisterium', 'DCE 1', ARRAY['Amor', 'Deus']),
(gen_random_uuid(), 'Catecismo §2196', 'Jesus faz do amor de Deus o primeiro mandamento e do amor ao próximo o segundo, mas os dois são inseparáveis.', 'catechism', 'CCC 2196', ARRAY['Amor', 'Mandamentos']),
(gen_random_uuid(), 'A medida do amor', 'A medida do amor é amar sem medida.', 'magisterium', 'S. Bernardo de Claraval', ARRAY['Amor', 'Virtude']);

-- Enriching 'Fé' (Faith)
INSERT INTO public.spiritual_contents (id, title, content_text, type, reference_id, tags) VALUES 
(gen_random_uuid(), 'Definição de Fé', 'A fé é o fundamento da esperança, é uma certeza a respeito do que não se vê.', 'bible', 'Hb 11, 1', ARRAY['Fé', 'Esperança']),
(gen_random_uuid(), 'O dom da fé', 'Pela graça sois salvos, por meio da fé; e isto não vem de vós, é dom de Deus.', 'bible', 'Ef 2, 8', ARRAY['Fé', 'Graça']),
(gen_random_uuid(), 'Catecismo §150', 'A fé é, antes de mais nada, uma adesão pessoal do homem a Deus.', 'catechism', 'CCC 150', ARRAY['Fé', 'Deus']),
(gen_random_uuid(), 'Fé e Razão (S. João Paulo II)', 'A fé e a razão são como as duas asas com as quais o espírito humano se eleva à contemplação da verdade.', 'magisterium', 'Fides et Ratio', ARRAY['Fé', 'Verdade']),
(gen_random_uuid(), 'Creres para entender', 'Creio para entender, e entendo para crer melhor.', 'magisterium', 'S. Agostinho', ARRAY['Fé', 'Verdade']);

-- Enriching 'Perdão' (Forgiveness)
INSERT INTO public.spiritual_contents (id, title, content_text, type, reference_id, tags) VALUES 
(gen_random_uuid(), 'Setenta vezes sete', 'Não te digo até sete vezes, mas até setenta vezes sete.', 'bible', 'Mt 18, 22', ARRAY['Perdão', 'Misericórdia']),
(gen_random_uuid(), 'Perdoai as nossas dívidas', 'Perdoai-nos as nossas ofensas, assim como nós perdoamos a quem nos tem ofendido.', 'bible', 'Mt 6, 12', ARRAY['Perdão', 'Oração']),
(gen_random_uuid(), 'Catecismo §2843', 'O perdão deve vir do fundo do coração, pois não há limite nem medida para o perdão divino.', 'catechism', 'CCC 2843', ARRAY['Perdão', 'Coração']),
(gen_random_uuid(), 'Dives in Misericordia', 'O perdão é a condição indispensável para que o amor se torne plenamente operativo entre os homens.', 'magisterium', 'DiM 14', ARRAY['Perdão', 'Amor']),
(gen_random_uuid(), 'Vingar-se é ser vencido', 'O perdão é a vingança dos cristãos.', 'magisterium', 'Cura d''Ars', ARRAY['Perdão', 'Santidade']);

-- Enriching 'Oração' (Prayer)
INSERT INTO public.spiritual_contents (id, title, content_text, type, reference_id, tags) VALUES 
(gen_random_uuid(), 'Orar sem cessar', 'Orai sem cessar. Em tudo dai graças.', 'bible', '1 Ts 5, 17-18', ARRAY['Oração', 'Gratidão']),
(gen_random_uuid(), 'Pedir e Receber', 'Pedi e dar-se-vos-á; buscai e achareis; batei e abrir-se-vos-á.', 'bible', 'Mt 7, 7', ARRAY['Oração', 'Fé']),
(gen_random_uuid(), 'Catecismo §2558', 'A oração é a elevação da alma a Deus ou o pedido a Deus de bens convenientes.', 'catechism', 'CCC 2558', ARRAY['Oração', 'Deus']),
(gen_random_uuid(), 'O trato de amizade', 'A oração não é outra coisa senão um trato de amizade com Quem sabemos que nos ama.', 'magisterium', 'S. Teresa d''Ávila', ARRAY['Oração', 'Amizade']),
(gen_random_uuid(), 'A respiração da alma', 'A oração é para a alma o que o ar é para o corpo.', 'magisterium', 'S. Padre Pio', ARRAY['Oração', 'Vida']);

-- Enriching 'Misericórdia' (Mercy)
INSERT INTO public.spiritual_contents (id, title, content_text, type, reference_id, tags) VALUES 
(gen_random_uuid(), 'Bem-aventurados os misericordiosos', 'Bem-aventurados os misericordiosos, porque eles alcançarão misericórdia.', 'bible', 'Mt 5, 7', ARRAY['Misericórdia', 'Bem-aventuranças']),
(gen_random_uuid(), 'O Pai Misericordioso', 'Mas o pai disse aos seus servos: Trazei depressa a melhor roupa e vesti-lho.', 'bible', 'Lc 15, 22', ARRAY['Misericórdia', 'Deus']),
(gen_random_uuid(), 'Catecismo §1846', 'O Evangelho é a revelação, em Jesus Cristo, da misericórdia de Deus para com os pecadores.', 'catechism', 'CCC 1846', ARRAY['Misericórdia', 'Evangelho']),
(gen_random_uuid(), 'Misericordiae Vultus (Papa Francisco)', 'Jesus Cristo é o rosto da misericórdia do Pai.', 'magisterium', 'MV 1', ARRAY['Misericórdia', 'Jesus']),
(gen_random_uuid(), 'O mar de misericórdia', 'A misericórdia de Deus é um mar sem fundo e sem margens.', 'magisterium', 'S. Faustina', ARRAY['Misericórdia', 'Deus']);

-- Link all new content to tags based on the tags array in spiritual_contents
INSERT INTO public.content_tags (content_id, tag_id)
SELECT sc.id, t.id
FROM public.spiritual_contents sc
JOIN public.tags t ON t.label = ANY(sc.tags)
ON CONFLICT (content_id, tag_id) DO NOTHING;
