-- Sprint B / CAT-004 — Remoção de índices duplicados (fase 1)
-- Cada DROP é seguro: em cada par existe outro índice cobrindo a mesma coluna/método.

DROP INDEX IF EXISTS public.idx_bible_books_abbrev;                        -- dup de bible_books_abbrev_key (UNIQUE)
DROP INDEX IF EXISTS public.idx_catechism_cache_paragraph;                 -- dup de catechism_cache_paragraph_key (UNIQUE)
DROP INDEX IF EXISTS public.idx_language_allowlist_term;                   -- dup de language_allowlist_term_key (UNIQUE)
DROP INDEX IF EXISTS public.idx_core_audit_correlation_id;                 -- dup de idx_core_audit_logs_correlation_id
DROP INDEX IF EXISTS public.idx_saints_date;                               -- dup de idx_saints_feast (mesmo (feast_month, feast_day_num))
DROP INDEX IF EXISTS public.bible_cache_metric_events_correlation_id_idx;  -- superset do parcial idx_bcme_correlation_id

-- Atualiza estatísticas nas tabelas afetadas
ANALYZE public.bible_books;
ANALYZE public.catechism_cache;
ANALYZE public.language_allowlist;
ANALYZE public.core_audit_logs;
ANALYZE public.saints;
ANALYZE public.bible_cache_metric_events;