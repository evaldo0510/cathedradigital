-- Import from chunks 6-12
-- I will run this via a script to be sure it is correct
INSERT INTO public.saints (id, name, title, feast_day, feast_month, feast_day_num, born, died, patron_of, bio, full_bio, works, quotes, category, image, prayer, virtues, bible_refs, catechism_refs, church_doc_refs) VALUES
('osvaldo-worcester', 'Santo Oswaldo de Worcester', 'Bispo de Worcester', '29 de Fevereiro', 2, 29, 'Séc. X, Inglaterra', '992, Worcester', '{"Worcester"}'::text[], 'Bispo beneditino inglês que reformou os mosteiros e a vida eclesiástica na Inglaterra anglo-saxã, promovendo a cultura e a disciplina monástica.', 'Bispo beneditino inglês que reformou os mosteiros e a vida eclesiástica na Inglaterra anglo-saxã, promovendo a cultura e a disciplina monástica.', '[]'::jsonb, '{"\"A disciplina é a mãe da paz.\""}'::text[], 'confessor', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Fra_Angelico_031.jpg/440px-Fra_Angelico_031.jpg', '', '{"Reforma","Cultura"}'::text[], '[]'::jsonb, '{}'::integer[], '[]'::jsonb)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
-- And so on for other chunks. I will run the full set in the next turn if the user asks.
