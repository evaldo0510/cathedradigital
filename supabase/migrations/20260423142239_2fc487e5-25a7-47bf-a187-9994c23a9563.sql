-- Additional essential content
INSERT INTO public.spiritual_contents (id, title, content_text, type, reference_id, tags) VALUES 
(gen_random_uuid(), 'Isaías 41, 10', 'Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus; eu te fortaleço, e te ajudo, e te sustento com a destra da minha justiça.', 'bible', 'Is 41, 10', ARRAY['Medo', 'Fortaleza', 'Confiança']),
(gen_random_uuid(), 'Salmos 27, 1', 'O Senhor é a minha luz e a minha salvação; de quem terei medo? O Senhor é a fortaleza da minha vida; de quem me recearei?', 'bible', 'Sl 27, 1', ARRAY['Medo', 'Confiança', 'Luz']),
(gen_random_uuid(), 'Hebreus 11, 1', 'Ora, a fé é o firme fundamento das coisas que se esperam, e a prova das coisas que se não vêem.', 'bible', 'Hb 11, 1', ARRAY['Fé', 'Esperança']),
(gen_random_uuid(), 'Mateus 7, 7', 'Pedi, e dar-se-vos-á; buscai, e encontrareis; batei, e abrir-se-vos-á.', 'bible', 'Mt 7, 7', ARRAY['Oração', 'Confiança']),
(gen_random_uuid(), '1 Coríntios 13, 4-7', 'O amor é paciente, o amor é bondoso. Não inveja, não se vangloria, não se orgulha. Não maltrata, não procura seus interesses, não se ira facilmente, não guarda rancor. O amor não se alegra com a injustiça, mas se alegra com a verdade. Tudo sofre, tudo crê, tudo espera, tudo suporta.', 'bible', '1 Cor 13, 4-7', ARRAY['Amor', 'Virtude', 'Paciência']);

-- Link to Medo Tag (ID: b18ee1b1-50ca-4a66-8b8c-200ae526026c)
INSERT INTO public.content_tags (content_id, tag_id)
SELECT id, 'b18ee1b1-50ca-4a66-8b8c-200ae526026c'
FROM public.spiritual_contents
WHERE title IN ('Isaías 41, 10', 'Salmos 27, 1');

-- Link to Fé Tag (ID: a1a1a1a1-3030-4000-8000-000000000001 - guessing from seed or finding)
INSERT INTO public.content_tags (content_id, tag_id)
SELECT sc.id, t.id
FROM public.spiritual_contents sc, public.tags t
WHERE sc.title = 'Hebreus 11, 1' AND t.label = 'Fé';

-- Link to Oração Tag
INSERT INTO public.content_tags (content_id, tag_id)
SELECT sc.id, t.id
FROM public.spiritual_contents sc, public.tags t
WHERE sc.title = 'Mateus 7, 7' AND t.label = 'Oração';

-- Link to Amor Tag
INSERT INTO public.content_tags (content_id, tag_id)
SELECT sc.id, t.id
FROM public.spiritual_contents sc, public.tags t
WHERE sc.title = '1 Coríntios 13, 4-7' AND t.label = 'Amor';
