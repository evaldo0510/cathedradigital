-- Insert Bible Verses
INSERT INTO public.spiritual_contents (id, title, content_text, type, reference_id, tags) VALUES 
(gen_random_uuid(), 'Filipenses 4, 6-7', 'Não vos inquieteis com nada; mas apresentai a Deus todas as vossas necessidades pela oração e súplica, acompanhadas de ação de graças. E a paz de Deus, que sobrepuja todo o entendimento, guardará os vossos corações e os vossos pensamentos em Cristo Jesus.', 'bible', 'Fl 4, 6-7', ARRAY['Ansiedade', 'Paz', 'Oração']),
(gen_random_uuid(), 'Mateus 6, 34', 'Não vos inquieteis, pois, pelo dia de amanhã, porque o dia de amanhã cuidará de si mesmo. Basta a cada dia o seu mal.', 'bible', 'Mt 6, 34', ARRAY['Ansiedade', 'Confiança', 'Providência']),
(gen_random_uuid(), '1 Pedro 5, 7', 'Lançai sobre ele toda a vossa ansiedade, porque ele tem cuidado de vós.', 'bible', '1 Pe 5, 7', ARRAY['Ansiedade', 'Humildade', 'Confiança']),
(gen_random_uuid(), 'Salmos 94, 19', 'Quando a ansiedade já me dominava, o teu consolo trouxe alívio à minha alma.', 'bible', 'Sl 94, 19', ARRAY['Ansiedade', 'Consolo', 'Alívio']);

-- Insert Catechism Paragraphs
INSERT INTO public.spiritual_contents (id, title, content_text, type, reference_id, tags) VALUES 
(gen_random_uuid(), 'Catecismo §2830', 'A confiança filial não é uma indiferença passiva, mas uma entrega ativa nas mãos do Pai, que liberta da ansiedade desmedida pelas coisas do mundo.', 'catechism', 'CCC 2830', ARRAY['Ansiedade', 'Confiança', 'Pai Nosso']),
(gen_random_uuid(), 'Catecismo §322', 'Cristo nos convida à entrega filial à providência do Pai celeste, que cuida das menores necessidades de seus filhos.', 'catechism', 'CCC 322', ARRAY['Ansiedade', 'Providência', 'Confiança']);

-- Link to Ansiedade Tag (ID: c87e6b01-840d-4add-a51c-b3b66ae03b6b)
INSERT INTO public.content_tags (content_id, tag_id)
SELECT id, 'c87e6b01-840d-4add-a51c-b3b66ae03b6b'
FROM public.spiritual_contents
WHERE title IN ('Filipenses 4, 6-7', 'Mateus 6, 34', '1 Pedro 5, 7', 'Salmos 94, 19', 'Catecismo §2830', 'Catecismo §322');

-- Link to Medo Tag (ID: b18ee1b1-50ca-4a66-8b8c-200ae526026c) where relevant
INSERT INTO public.content_tags (content_id, tag_id)
SELECT id, 'b18ee1b1-50ca-4a66-8b8c-200ae526026c'
FROM public.spiritual_contents
WHERE title IN ('Filipenses 4, 6-7', '1 Pedro 5, 7');

-- Link to Esperança Tag (ID: 1cc49787-0812-4e8a-af88-e141a3e71414) where relevant
INSERT INTO public.content_tags (content_id, tag_id)
SELECT id, '1cc49787-0812-4e8a-af88-e141a3e71414'
FROM public.spiritual_contents
WHERE title IN ('Salmos 94, 19', 'Catecismo §2830');
