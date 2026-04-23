-- More content for Ansiedade
INSERT INTO public.spiritual_contents (id, title, content_text, type, reference_id, tags) VALUES 
(gen_random_uuid(), 'Confissões (S. Agostinho)', 'Fizeste-nos, Senhor, para Ti, e o nosso coração está inquieto enquanto não descansar em Ti.', 'magisterium', 'Confissões I, 1', ARRAY['Ansiedade', 'Descanso', 'Deus']),
(gen_random_uuid(), 'Gaudium et Spes', 'As alegrias e as esperanças, as tristezas e as angústias dos homens de hoje, sobretudo dos pobres e de todos aqueles que sofrem, são também as alegrias e as esperanças, as tristezas e as angústias dos discípulos de Cristo.', 'magisterium', 'GS 1', ARRAY['Ansiedade', 'Igreja', 'Sofrimento']),
(gen_random_uuid(), 'Catecismo §2736', 'Nossa oração é ouvida porque pedimos o que Deus quer nos dar. Se estamos ansiosos, é porque ainda não confiamos plenamente que o que Ele nos dá é o melhor.', 'catechism', 'CCC 2736', ARRAY['Ansiedade', 'Oração', 'Confiança']);

-- Link to Ansiedade Tag (ID: c87e6b01-840d-4add-a51c-b3b66ae03b6b)
INSERT INTO public.content_tags (content_id, tag_id)
SELECT id, 'c87e6b01-840d-4add-a51c-b3b66ae03b6b'
FROM public.spiritual_contents
WHERE title IN ('Confissões (S. Agostinho)', 'Gaudium et Spes', 'Catecismo §2736');
