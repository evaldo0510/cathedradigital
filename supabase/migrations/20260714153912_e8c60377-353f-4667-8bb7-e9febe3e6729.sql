
-- Sprint B1 (CAT-004): Remoção de índices redundantes
-- Todos os índices abaixo são estritamente cobertos por um índice UNIQUE
-- na mesma tabela que começa pelas mesmas colunas, na mesma ordem.
-- Não há perda de capacidade de busca: o planner passa a usar o UNIQUE.

DROP INDEX IF EXISTS public.idx_bcm_bucket;
DROP INDEX IF EXISTS public.idx_bible_chapters_book_id;
DROP INDEX IF EXISTS public.idx_bible_chapters_read_book;
DROP INDEX IF EXISTS public.idx_bible_chapters_read_user;
DROP INDEX IF EXISTS public.idx_bible_favorites_user_id;
DROP INDEX IF EXISTS public.idx_bible_verse_modernizations_verse;
DROP INDEX IF EXISTS public.idx_bible_verses_chapter_id;
DROP INDEX IF EXISTS public.idx_bible_verses_chapter_translation;
DROP INDEX IF EXISTS public.idx_catechism_progress_user;
DROP INDEX IF EXISTS public.idx_trail_progress_user;
DROP INDEX IF EXISTS public.idx_trail_progress_user_id;
DROP INDEX IF EXISTS public.idx_user_roles_user_id;

-- Atualizar estatísticas nas tabelas afetadas
ANALYZE public.bible_cache_metrics;
ANALYZE public.bible_chapters;
ANALYZE public.bible_chapters_read;
ANALYZE public.bible_favorites;
ANALYZE public.bible_verse_modernizations;
ANALYZE public.bible_verses;
ANALYZE public.catechism_paragraphs_read;
ANALYZE public.trail_progress;
ANALYZE public.user_roles;
