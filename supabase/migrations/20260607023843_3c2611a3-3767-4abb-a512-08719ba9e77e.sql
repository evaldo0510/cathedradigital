ALTER TABLE public.bible_connections ADD COLUMN IF NOT EXISTS theological_theme TEXT;
ALTER TABLE public.bible_connections ADD COLUMN IF NOT EXISTS relevance_level TEXT DEFAULT 'medium' CHECK (relevance_level IN ('low', 'medium', 'high', 'essential'));

COMMENT ON COLUMN public.bible_connections.theological_theme IS 'Main theological theme linking the verse to the catechism paragraph (e.g., Ecclesiology, Eucharist, Mariology).';
COMMENT ON COLUMN public.bible_connections.relevance_level IS 'Theological relevance of the connection for study and prayer.';

-- Data Seeding: Phase 1 Initial Connections
-- João 6:51 -> CIC 1324 (Eucharist)
INSERT INTO public.bible_connections (verse_id, category, reference_title, reference_id, summary, theological_theme, relevance_level)
VALUES 
('Jo-6-51', 'catechism', 'CIC 1324', '1324', 'A Eucaristia é "fonte e ápice de toda a vida cristã".', 'Eucaristia', 'essential'),
-- Mateus 16:18 -> CIC 881 (The Church/Papacy)
('Mt-16-18', 'catechism', 'CIC 881', '881', 'O Senhor fez de Simão, a quem deu o nome de Pedro, a rocha da sua Igreja.', 'Eclesiologia', 'essential'),
-- Lucas 1:28 -> CIC 491 (Mary/Immaculate Conception)
('Lc-1-28', 'catechism', 'CIC 491', '491', 'Ao longo dos séculos, a Igreja tomou consciência de que Maria, "cumulada de graça" por Deus, tinha sido redimida desde a sua conceição.', 'Mariologia', 'essential'),
-- João 1:1 -> CIC 291 (Creation/The Word)
('Jo-1-1', 'catechism', 'CIC 291', '291', 'O mundo foi criado para a glória de Deus, que quis manifestar e comunicar a sua bondade, verdade e beleza.', 'Criação', 'high');

-- Grant permissions (standard procedure)
GRANT SELECT ON public.bible_connections TO anon;
GRANT SELECT ON public.bible_connections TO authenticated;
GRANT ALL ON public.bible_connections TO service_role;