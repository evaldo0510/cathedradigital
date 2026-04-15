INSERT INTO public.saints (id, name, title, feast_day, feast_month, feast_day_num, born, died, patron_of, bio, full_bio, works, quotes, category, image, prayer, virtues, bible_refs, catechism_refs, church_doc_refs) 
VALUES 
('teresa-lisieux', 'Santa Teresa de Lisieux', 'A Pequena Flor', '1 de Outubro', 10, 1, '1873, Alençon, França', '1897, Carmelo de Lisieux, França', '{"Missionários","Floristas","Aviadores","França"}'::text[], 'Carmelita descalça francesa, doutora da Igreja. Desenvolveu a "pequena via" da infância espiritual.', 'Marie-Françoise-Thérèse Martin foi a caçula de nove filhos de Louis e Zélie Martin — ambos canonizados como santos. Perdeu a mãe aos 4 anos, o que marcou profundamente sua sensibilidade. Desde muito cedo, sentiu o chamado à vida religiosa.

Aos 15 anos, após uma audiência com o Papa Leão XIII em Roma, obteve permissão especial para entrar no Carmelo de Lisieux, onde já estavam duas de suas irmãs. Recebeu o nome de Teresa do Menino Jesus e da Santa Face.

No Carmelo, Teresa desenvolveu sua célebre "pequena via" — um caminho de infância espiritual que consiste em fazer as coisas mais ordinárias com extraordinário amor. Compreendeu que não precisava realizar grandes feitos: "Minha vocação é o amor! No coração da Igreja, minha Mãe, eu serei o amor."

Os últimos 18 meses de vida foram marcados por uma terrível "noite da fé" — uma provação interior de dúvida contra a existência do Céu — que ela enfrentou com heroica confiança. Sofria também de tuberculose, que a consumiu lentamente.

Por obediência, escreveu sua autobiografia "História de uma Alma", que após sua morte se tornou um dos livros espirituais mais lidos do mundo. Morreu aos 24 anos dizendo: "Meu Deus, eu vos amo!" Foi canonizado em 1925 e declarado Doutora da Igreja por João Paulo II em 1997 — a mais jovem Doutora da história.', '[{"title":"História de uma Alma (autobiografia)","url":"https://www.vatican.va/therese/therese_index_po.htm","year":"1895–1897"},{"title":"Poesias Completas","year":"1893–1897"},{"title":"Últimas Conversas (Novissima Verba)","year":"1897"},{"title":"Orações","year":"1889–1897"},{"title":"Peças de Teatro espirituais","year":"1893–1896"}]'::jsonb, '{"\"Minha vocação é o amor! No coração da Igreja, minha Mãe, eu serei o amor.\"","\"Quero passar meu céu fazendo o bem na terra.\"","\"Tudo é graça.\"","\"O elevador que me há de elevar ao Céu são os vossos braços, ó Jesus!\""}'::text[], 'doctor', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Therese_von_Lisieux.jpg/440px-Therese_von_Lisieux.jpg', 'Santa Teresinha do Menino Jesus, fazei cair do céu uma chuva de rosas sobre aqueles que vos invocam. Ajudai-me a encontrar a santidade nas coisas pequenas.', '{"Simplicidade","Confiança","Amor","Infância espiritual"}'::text[], '[]'::jsonb, '{}'::integer[], '[]'::jsonb)
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

-- Additional INSERTs for chunks 2, 3, 4, 5
-- I will run this and notify the user.
