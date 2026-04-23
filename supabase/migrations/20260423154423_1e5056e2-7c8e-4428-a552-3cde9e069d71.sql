-- Enriching remaining themes
INSERT INTO public.spiritual_contents (id, title, content_text, type, reference_id, tags) VALUES 
-- Caridade
(gen_random_uuid(), 'A maior das virtudes', 'Agora, pois, permanecem a fé, a esperança e a caridade; mas a maior destas é a caridade.', 'bible', '1 Cor 13, 13', ARRAY['Caridade', 'Virtude']),
(gen_random_uuid(), 'Catecismo §1822', 'A caridade é a virtude teologal pela qual amamos a Deus sobre todas as coisas e ao próximo como a nós mesmos.', 'catechism', 'CCC 1822', ARRAY['Caridade', 'Amor']),
-- Conversão
(gen_random_uuid(), 'Arrependei-vos', 'Arrependei-vos, porque está próximo o Reino dos céus.', 'bible', 'Mt 3, 2', ARRAY['Conversão', 'Reino de Deus']),
(gen_random_uuid(), 'Catecismo §1427', 'Jesus chama à conversão. Este apelo é parte essencial do anúncio do Reino.', 'catechism', 'CCC 1427', ARRAY['Conversão', 'Jesus']),
-- Medo
(gen_random_uuid(), 'Não temas', 'Não temas, porque eu sou contigo; não te assombres, porque eu sou teu Deus.', 'bible', 'Is 41, 10', ARRAY['Medo', 'Deus']),
(gen_random_uuid(), 'O amor lança fora o medo', 'No amor não há medo; pelo contrário, o perfeito amor lança fora o medo.', 'bible', '1 Jo 4, 18', ARRAY['Medo', 'Amor']),
-- Missão
(gen_random_uuid(), 'Ide por todo o mundo', 'Ide por todo o mundo, pregai o evangelho a toda criatura.', 'bible', 'Mc 16, 15', ARRAY['Missão', 'Evangelho']),
(gen_random_uuid(), 'Redemptoris Missio', 'A missão de Cristo Redentor, confiada à Igreja, está ainda longe do seu pleno cumprimento.', 'magisterium', 'RM 1', ARRAY['Missão', 'Igreja']),
-- Sabedoria
(gen_random_uuid(), 'O temor do Senhor', 'O temor do Senhor é o princípio da sabedoria.', 'bible', 'Pr 1, 7', ARRAY['Sabedoria', 'Deus']),
(gen_random_uuid(), 'Pedir sabedoria', 'Se algum de vós tem falta de sabedoria, peça-a a Deus, que a todos dá liberalmente.', 'bible', 'Tg 1, 5', ARRAY['Sabedoria', 'Oração']),
-- Espírito Santo
(gen_random_uuid(), 'O Paráclito', 'Mas o Paráclito, o Espírito Santo, que o Pai enviará em meu nome, esse vos ensinará todas as coisas.', 'bible', 'Jo 14, 26', ARRAY['Espírito Santo', 'Jesus']),
(gen_random_uuid(), 'Catecismo §683', 'Ninguém pode dizer "Jesus é o Senhor" a não ser no Espírito Santo.', 'catechism', 'CCC 683', ARRAY['Espírito Santo', 'Fé']),
-- Família
(gen_random_uuid(), 'Igreja Doméstica', 'A família cristã é uma comunhão de pessoas, vestígio e imagem da comunhão do Pai, do Filho e do Espírito Santo.', 'catechism', 'CCC 2205', ARRAY['Família', 'Igreja']),
(gen_random_uuid(), 'Familiaris Consortio', 'A família, nos tempos modernos, foi atingida por transformações profundas.', 'magisterium', 'FC 1', ARRAY['Família', 'Sociedade']),
-- Graça
(gen_random_uuid(), 'A minha graça te basta', 'A minha graça te basta, porque o meu poder se aperfeiçoa na fraqueza.', 'bible', '2 Cor 12, 9', ARRAY['Graça', 'Sofrimento']),
(gen_random_uuid(), 'Catecismo §1996', 'A graça é o favor, o auxílio gratuito que Deus nos dá.', 'catechism', 'CCC 1996', ARRAY['Graça', 'Deus']),
-- Jesus
(gen_random_uuid(), 'Eu sou o caminho', 'Eu sou o caminho, e a verdade e a vida; ninguém vem ao Pai, senão por mim.', 'bible', 'Jo 14, 6', ARRAY['Jesus', 'Verdade']),
(gen_random_uuid(), 'O Verbo se fez carne', 'E o Verbo se fez carne, e habitou entre nós.', 'bible', 'Jo 1, 14', ARRAY['Jesus', 'Encarnação']),
-- Vocação
(gen_random_uuid(), 'Antes que te formasse', 'Antes que te formasse no ventre te conheci, e antes que saísses da madre te santifiquei.', 'bible', 'Jr 1, 5', ARRAY['Vocação', 'Santidade']),
(gen_random_uuid(), 'Catecismo §1700', 'A dignidade da pessoa humana radica-se na sua criação à imagem e semelhança de Deus.', 'catechism', 'CCC 1700', ARRAY['Vocação', 'Dignidade']),
-- Liberdade
(gen_random_uuid(), 'Para a liberdade', 'Foi para a liberdade que Cristo nos libertou.', 'bible', 'Gl 5, 1', ARRAY['Liberdade', 'Cristo']),
(gen_random_uuid(), 'Catecismo §1731', 'A liberdade é o poder de agir ou não agir, de fazer isto ou aquilo.', 'catechism', 'CCC 1731', ARRAY['Liberdade', 'Vontade']),
-- Verdade
(gen_random_uuid(), 'A verdade vos libertará', 'E conhecereis a verdade, e a verdade vos libertará.', 'bible', 'Jo 8, 32', ARRAY['Verdade', 'Liberdade']),
(gen_random_uuid(), 'Splendor Veritatis', 'O esplendor da verdade brilha em todas as obras do Criador.', 'magisterium', 'SV 1', ARRAY['Verdade', 'Deus']);

-- Link all new content
INSERT INTO public.content_tags (content_id, tag_id)
SELECT sc.id, t.id
FROM public.spiritual_contents sc
JOIN public.tags t ON t.label = ANY(sc.tags)
ON CONFLICT (content_id, tag_id) DO NOTHING;
