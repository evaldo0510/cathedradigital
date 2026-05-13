-- Add new themes
INSERT INTO public.themes (id, slug, name, emoji, category, description)
VALUES 
  (gen_random_uuid(), 'maria', 'Maria', '🌹', 'Divino', 'A Mãe de Deus e nossa Mãe espiritual, modelo de fé e obediência.'),
  (gen_random_uuid(), 'sacramentos', 'Sacramentos', '⛪', 'Fundamentos', 'Os sinais sensíveis e eficazes da graça, instituídos por Cristo e confiados à Igreja.'),
  (gen_random_uuid(), 'igreja', 'Igreja', '⛪', 'Fundamentos', 'O Corpo Místico de Cristo, o Povo de Deus em marcha para a eternidade.'),
  (gen_random_uuid(), 'liturgia', 'Liturgia', '📖', 'Fundamentos', 'A oração pública e oficial da Igreja, especialmente o Santo Sacrifício da Missa.'),
  (gen_random_uuid(), 'purgatorio', 'Purgatório', '🔥', 'Mistério', 'O estado de purificação final para os que morrem na amizade de Deus.'),
  (gen_random_uuid(), 'mandamentos', 'Mandamentos', '📜', 'Vida', 'As dez leis de amor dadas por Deus para orientar a vida humana.'),
  (gen_random_uuid(), 'bem_aventurancas', 'Bem-aventuranças', '🏔️', 'Vida', 'O coração da pregação de Jesus, o caminho da verdadeira felicidade cristã.');

-- Link content to empty themes
-- Culpa
INSERT INTO public.theme_contents (theme_id, content_type, title, text_content, reference)
SELECT id, 'catechism', 'O Perdão dos Pecados', 'Não há pecado algum, por mais grave que seja, que a santa Igreja não possa perdoar.', 'Catecismo §982'
FROM public.themes WHERE slug = 'culpa';

-- Desânimo
INSERT INTO public.theme_contents (theme_id, content_type, title, text_content, reference)
SELECT id, 'bible', 'Força no Cansaço', 'Tudo posso naquele que me fortalece.', 'Filipenses 4,13'
FROM public.themes WHERE slug = 'desanimo';

-- Vazio
INSERT INTO public.theme_contents (theme_id, content_type, title, text_content, reference)
SELECT id, 'catechism', 'O Desejo de Deus', 'O desejo de Deus está inscrito no coração do homem, porque o homem foi criado por Deus e para Deus.', 'Catecismo §27'
FROM public.themes WHERE slug = 'vazio';

-- Solidão
INSERT INTO public.theme_contents (theme_id, content_type, title, text_content, reference)
SELECT id, 'bible', 'Eis que estou convosco', 'Eis que estou convosco todos os dias, até o fim do mundo.', 'Mateus 28,20'
FROM public.themes WHERE slug = 'solidao';

-- Ferida Interior
INSERT INTO public.theme_contents (theme_id, content_type, title, text_content, reference)
SELECT id, 'bible', 'Cura do Coração', 'Ele cura os corações atribulados e enfaixa suas feridas.', 'Salmo 147,3'
FROM public.themes WHERE slug = 'ferida_interior';

-- Relacionamentos
INSERT INTO public.theme_contents (theme_id, content_type, title, text_content, reference)
SELECT id, 'bible', 'O Mandamento do Amor', 'Amai-vos uns aos outros como eu vos amei.', 'João 15,12'
FROM public.themes WHERE slug = 'relacionamentos';

-- Propósito
INSERT INTO public.theme_contents (theme_id, content_type, title, text_content, reference)
SELECT id, 'catechism', 'O fim do homem', 'Deus criou o homem para O conhecer, amá-Lo e servi-Lo neste mundo, e ser feliz com Ele para sempre no outro.', 'Catecismo §1'
FROM public.themes WHERE slug = 'proposito';

-- Disciplina
INSERT INTO public.theme_contents (theme_id, content_type, title, text_content, reference)
SELECT id, 'bible', 'Fruto da Disciplina', 'Nenhuma disciplina parece ser motivo de alegria no momento, mas de tristeza. Mais tarde, porém, produz fruto de justiça.', 'Hebreus 12,11'
FROM public.themes WHERE slug = 'disciplina';

-- Constância
INSERT INTO public.theme_contents (theme_id, content_type, title, text_content, reference)
SELECT id, 'bible', 'Perseverança', 'Aquele que perseverar até o fim, esse será salvo.', 'Mateus 24,13'
FROM public.themes WHERE slug = 'constancia';

-- Add tags to existing spiritual_contents to cross-link
UPDATE public.spiritual_contents 
SET tags = array_append(tags, 'Maria')
WHERE content_text ILIKE '%Maria%' OR content_text ILIKE '%Mãe de Deus%';

UPDATE public.spiritual_contents 
SET tags = array_append(tags, 'Sacramentos')
WHERE content_text ILIKE '%sacramento%' OR content_text ILIKE '%Batismo%' OR content_text ILIKE '%Eucaristia%';

UPDATE public.spiritual_contents 
SET tags = array_append(tags, 'Igreja')
WHERE content_text ILIKE '%Igreja%' OR content_text ILIKE '%Corpo Místico%';

UPDATE public.spiritual_contents 
SET tags = array_append(tags, 'Liturgia')
WHERE content_text ILIKE '%Missa%' OR content_text ILIKE '%Celebração%';
