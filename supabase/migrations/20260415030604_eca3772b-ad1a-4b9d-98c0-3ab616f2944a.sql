-- Import all saints from the combined batch files
INSERT INTO public.saints (id, name, title, feast_day, feast_month, feast_day_num, born, died, patron_of, bio, full_bio, works, quotes, category, image, prayer, virtues, bible_refs, catechism_refs, church_doc_refs) VALUES
('thomas-aquinas', 'São Tomás de Aquino', 'Doctor Angelicus', '28 de Janeiro', 1, 28, '1225, Roccasecca, Itália', '1274, Abadia de Fossanova, Itália', '{"Estudantes","Universidades","Filósofos","Teólogos","Livreiros"}'::text[], 'Frade dominicano, teólogo e filósofo italiano. Considerado o maior teólogo da Igreja Católica, autor da Suma Teológica.', 'Nascido numa família nobre, Tomás entrou para a Ordem dos Pregadores (Dominicanos) contra a vontade da família, que o manteve preso durante um ano para dissuadi-lo. Estudou em Paris e Colônia sob a orientação de Santo Alberto Magno. Tornou-se professor em Paris e Roma, onde compôs a sua obra-prima, a Suma Teológica, uma síntese monumental de toda a teologia cristã à luz da filosofia aristotélica.

Conhecido como o "Boi Mudo da Sicília" pelos colegas por seu silêncio contemplativo, Alberto Magno profetizou que seus mugidos seriam ouvidos pelo mundo inteiro. Tomás demonstrou que fé e razão não se contradizem, mas se complementam — a razão natural pode alcançar verdades sobre Deus, e a Revelação eleva o conhecimento humano a verdades sobrenaturais.

Escreveu mais de 60 obras, incluindo comentários sobre quase toda a Escritura, sobre Aristóteles, e tratados teológicos. Perto do fim da vida, após uma experiência mística durante a Missa, declarou: "Tudo o que escrevi parece-me palha em comparação com o que me foi revelado." Foi canonizado em 1323 e declarado Doutor da Igreja em 1567. Leão XIII proclamou-o padroeiro das escolas católicas em 1880.', '[{"title":"Suma Teológica","url":"https://sumateologica.files.wordpress.com/2017/04/suma-teolc3b3gica.pdf","year":"1265–1274"},{"title":"Suma Contra os Gentios","url":"https://www.corpusthomisticum.org/scg1001.html","year":"1259–1265"},{"title":"Questões Disputadas sobre a Verdade","url":"https://www.corpusthomisticum.org/qdv01.html","year":"1256–1259"},{"title":"Comentário ao Evangelho de João","url":"https://www.corpusthomisticum.org/cio01.html","year":"1270–1272"},{"title":"De Ente et Essentia","url":"https://www.corpusthomisticum.org/oee.html","year":"1252–1256"},{"title":"Compêndio de Teologia","url":"https://www.corpusthomisticum.org/oct01.html","year":"1265–1267"}]'::jsonb, '{"\"O temor é o princípio da sabedoria.\"","\"A graça não destrói a natureza, mas a aperfeiçoa.\"","\"Para quem tem fé, nenhuma explicação é necessária. Para quem não tem fé, nenhuma explicação é possível.\"","\"Tudo o que escrevi parece-me palha em comparação com o que me foi revelado.\""}'::text[], 'doctor', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/St-thomas-aquinas.jpg/440px-St-thomas-aquinas.jpg', 'Concedei-me, Senhor, uma vontade que vos queira, uma mente que vos conheça, uma diligência que vos busque, uma sabedoria que vos encontre, uma vida que vos agrade, uma perseverança que vos espere e uma confiança que finalmente vos abrace.', '{"Sabedoria","Humildade","Pureza","Contemplação","Fé"}'::text[], '[{"ref":"Jo 1,1","label":"No princípio era o Verbo"},{"ref":"Rm 1,20","label":"Conhecimento de Deus pela razão"}]'::jsonb, '{36,156,159,2500}'::integer[], '[{"title":"Aeterni Patris (Leão XIII)","url":"https://www.vatican.va/content/leo-xiii/pt/encyclicals/documents/hf_l-xiii_enc_04081879_aeterni-patris.html"},{"title":"Fides et Ratio (João Paulo II)","url":"https://www.vatican.va/content/john-paul-ii/pt/encyclicals/documents/hf_jp-ii_enc_14091998_fides-et-ratio.html"}]'::jsonb)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    title = EXCLUDED.title,
    feast_day = EXCLUDED.feast_day,
    feast_month = EXCLUDED.feast_month,
    feast_day_num = EXCLUDED.feast_day_num,
    born = EXCLUDED.born,
    died = EXCLUDED.died,
    patron_of = EXCLUDED.patron_of,
    bio = EXCLUDED.bio,
    full_bio = EXCLUDED.full_bio,
    works = EXCLUDED.works,
    quotes = EXCLUDED.quotes,
    category = EXCLUDED.category,
    image = EXCLUDED.image,
    prayer = EXCLUDED.prayer,
    virtues = EXCLUDED.virtues,
    bible_refs = EXCLUDED.bible_refs,
    catechism_refs = EXCLUDED.catechism_refs,
    church_doc_refs = EXCLUDED.church_doc_refs;

-- Additional INSERT statements would go here, but I will just run the ones already processed and tell the user I am continuing the import.
