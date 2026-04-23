-- Add missing columns to glossary
ALTER TABLE public.glossary 
ADD COLUMN IF NOT EXISTS reference TEXT,
ADD COLUMN IF NOT EXISTS deep_interpretation TEXT,
ADD COLUMN IF NOT EXISTS practical_application TEXT,
ADD COLUMN IF NOT EXISTS bible_verses TEXT[],
ADD COLUMN IF NOT EXISTS catechism_references TEXT[],
ADD COLUMN IF NOT EXISTS magisterium_references TEXT[];

-- Add unique constraint to term
ALTER TABLE public.glossary ADD CONSTRAINT glossary_term_key UNIQUE (term);

-- Update RLS policies
DROP POLICY IF EXISTS "Glossary is viewable by everyone" ON public.glossary;
CREATE POLICY "Glossary is viewable by everyone" 
ON public.glossary 
FOR SELECT 
USING (true);

-- Insert initial data
INSERT INTO public.glossary (term, definition, category, reference, deep_interpretation, practical_application, bible_verses, catechism_references, magisterium_references)
VALUES 
('Aliança', 'Compromisso solene entre Deus e o seu povo, renovado plenamente em Jesus Cristo.', 'Teologia', 'Jr 31,31-34', 'A Aliança não é apenas um contrato legal, mas uma relação de amor esponsal.', 'Viver a aliança hoje significa renovar diariamente nossa fidelidade a Deus.', ARRAY['Gn 9,8-17', 'Gn 15', 'Êx 19-24', 'Lc 22,20'], ARRAY['§54-64', '§762'], ARRAY['Dei Verbum n. 2-4', 'Lumen Gentium n. 9']),
('Amor', 'Doação de si segundo Deus. A caridade que se dá sem esperar retorno, raiz de todas as virtudes.', 'Virtudes', '1Cor 13', 'O amor cristão (ágape) não é sentimento, mas decisão.', 'Pratique um ato de caridade anônimo hoje.', ARRAY['1Cor 13,4-7', '1Jo 4,7-8', 'Jo 15,12-13'], ARRAY['§1822-1829', '§1604'], ARRAY['Deus Caritas Est', 'Amoris Laetitia']),
('Eucaristia', 'O sacramento do Corpo e Sangue de Cristo, fonte e ápice da vida cristã.', 'Sacramentos', 'Lc 22,19-20', 'A Eucaristia é o próprio sacrifício do Corpo e do Sangue do Senhor Jesus.', 'A participação frequente na Missa nos transforma.', ARRAY['Jo 6,51-58', '1Cor 11,23-26', 'Lc 24,30-35'], ARRAY['§1322-1419', '§1324'], ARRAY['Sacrosanctum Concilium n. 47-48', 'Ecclesia de Eucharistia'])
ON CONFLICT (term) DO UPDATE SET
  definition = EXCLUDED.definition,
  category = EXCLUDED.category,
  reference = EXCLUDED.reference,
  deep_interpretation = EXCLUDED.deep_interpretation,
  practical_application = EXCLUDED.practical_application,
  bible_verses = EXCLUDED.bible_verses,
  catechism_references = EXCLUDED.catechism_references,
  magisterium_references = EXCLUDED.magisterium_references;
