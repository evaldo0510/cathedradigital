# Performance Baseline v1 — Sprint B (2026-07-14)

Referência oficial da Sprint B. Consolida o estado do banco após:

- **B1 / CAT-004** — Remoção de índices redundantes cobertos por UNIQUE.
- **B2** — Saneamento de `SECURITY DEFINER` residual.

Migrações:

- `20260714153922_*` — DROP de 12 índices + `ANALYZE`.
- `20260714154015_*` — `REVOKE EXECUTE` em 4 funções.

---

## 1. Escopo e método

- Alvo: schema `public`. Schemas do Supabase (`auth`, `storage`, `realtime`, `supabase_functions`, `vault`) fora do escopo.
- Fonte: `pg_index`, `pg_stat_user_indexes`, `pg_proc`, `pg_class`, `pg_am`, `EXPLAIN (ANALYZE, BUFFERS)`.
- Critério de "redundante": índice B com colunas-prefixo idênticas a A (mesma ordem, mesmo `amname`, sem `WHERE` partial) onde A é UNIQUE — a leitura serve para qualquer padrão de acesso que B cobria.
- Critério de "não removido apesar de 0 scans": ligado a feature ativa (busca fuzzy) com valor esperado quando volume de dados crescer.

---

## 2. Índices removidos (12)

| Tabela | Índice | Cols | Coberto por | Scans hist. | Tamanho |
|---|---|---|---|---:|---:|
| `bible_cache_metrics` | `idx_bcm_bucket` | (bucket_start) | PK unique (bucket_start, …) | 5424 | 16 kB |
| `bible_chapters` | `idx_bible_chapters_book_id` | (book_id) | unique (book_id, number) | 63 | 16 kB |
| `bible_chapters_read` | `idx_bible_chapters_read_book` | (user_id, book_abbr) | unique (user_id, book_abbr, chapter) | 6923 | 16 kB |
| `bible_chapters_read` | `idx_bible_chapters_read_user` | (user_id) | unique (user_id, book_abbr, chapter) | 0 | 16 kB |
| `bible_favorites` | `idx_bible_favorites_user_id` | (user_id) | unique (user_id, book_abbr, chapter, verse_number) | 0 | 8 kB |
| `bible_verse_modernizations` | `idx_bible_verse_modernizations_verse` | (verse_id) | unique (verse_id, modernization_version) | 0 | 8 kB |
| `bible_verses` | `idx_bible_verses_chapter_id` | (chapter_id) | unique (chapter_id, translation, number) | 76 | 16 kB |
| `bible_verses` | `idx_bible_verses_chapter_translation` | (chapter_id, translation) | unique (chapter_id, translation, number) | 14 | 16 kB |
| `catechism_paragraphs_read` | `idx_catechism_progress_user` | (user_id) | unique (user_id, paragraph) | 1015 | 16 kB |
| `trail_progress` | `idx_trail_progress_user` | (user_id, trail_id) | unique (user_id, trail_id, step_index) | 51 | 8 kB |
| `trail_progress` | `idx_trail_progress_user_id` | (user_id) | unique (user_id, trail_id, step_index) | 0 | 8 kB |
| `user_roles` | `idx_user_roles_user_id` | (user_id) | unique (user_id, role) | 0 | 16 kB |

**Total liberado:** ~160 kB (dado; ganho real de manutenção supera muito o de disco — cada INSERT/UPDATE nessas 9 tabelas passa a atualizar 1 índice a menos).

---

## 3. Índices mantidos apesar de 0 scans (revisão futura)

| Tabela | Índice | Motivo |
|---|---|---|
| `saints` | `idx_saints_name` | Suporte a `search_saints_fuzzy` — validar em B2 se realmente pega no plano |
| `journeys` | `idx_journeys_description_trgm`, `idx_journeys_title_trgm` | Trigram usado por `search_journeys_fuzzy` (ILIKE/similarity) — provável ganho quando dataset crescer |
| `glossary` | `idx_glossary_definition_trgm` | Trigram — mesma razão |
| `bible_cache_metric_events` | `bible_cache_metric_events_l1_phase_idx` | Único índice em `l1_phase`; usado por dashboards de cache que podem estar dormentes |

**Ação recomendada em B2 (query optimization):** rodar `EXPLAIN` real dos hooks de busca fuzzy e confirmar uso; se não pegar, planejar remoção ou reformulação.

---

## 4. Governança SECURITY DEFINER

| Função | Antes | Depois | Motivo |
|---|---|---|---|
| `cleanup_bible_audit_action_logs(text, int)` | (já saneada em A) | service_role | Auditoria cron; nenhum cliente chama |
| `enforce_bible_source_sprint1_gate()` | anon+auth+public | service_role | Trigger — só engine |
| `enforce_pcl_active_requires_admin()` | anon+auth+public | service_role | Trigger — só engine |
| `saints_audit_trg()` | anon+auth+public | service_role | Trigger — só engine |
| `get_correlation_trail(text, bool)` | anon+auth+public | authenticated, service_role | Guard admin interno mantido; anon removido para reduzir fingerprint |

**Anon-exec restante (allowlist formal):** `bible_read_gate_status`, `bible_source_sprint1_passed`, `bible_translation_readable`, `bible_translation_ready`, `bible_translations_readiness` — documentadas em `docs/SECURITY-DEFINER-ALLOWLIST.md`. Necessárias para a rota pública `/bible` funcionar sem login. Todas retornam apenas booleanos ou readiness pública.

**Linter Supabase:** 21 warnings → 14 (queda de 33%). Os 14 restantes cobrem as 5 funções da allowlist × 2 papéis (anon+authenticated) + variações — todos intencionais e documentados.

---

## 5. EXPLAIN antes × depois (amostra crítica)

### `bible_chapters_read` — leitura por (user_id, book_abbr)

**Antes:**
```
Index Only Scan using idx_bible_chapters_read_book
  Buffers: shared hit=1
Planning Buffers: shared hit=141
Planning Time: 6.425 ms
Execution Time: 0.713 ms
```

**Depois:**
```
Seq Scan on bible_chapters_read       (tabela com 4 linhas — planner correto)
  Buffers: shared hit=1
Planning Buffers: shared hit=110
Planning Time: 3.545 ms
Execution Time: 0.716 ms
```

**Análise:** planner escolheu `Seq Scan` porque a tabela é minúscula (4 linhas em ambiente dev). O UNIQUE (user_id, book_abbr, chapter) está disponível e será usado assim que a cardinalidade justificar. **Planning Buffers caiu 141 → 110 (-22%)** — menos metadados de índice a carregar para o planner considerar. Execution Time inalterado (esperado; ganho é em manutenção, não em SELECT dessa consulta).

---

## 6. Top consultas por custo — a coletar em B2

`pg_stat_statements` não foi consultado nesta baseline (fora do escopo declarado de B1/B2 governança). Será o primeiro passo da próxima etapa da Sprint B.

Preparar em B2:

1. `SELECT * FROM extensions.pg_stat_statements ORDER BY total_exec_time DESC LIMIT 20;`
2. Para cada uma no top 5: `EXPLAIN (ANALYZE, BUFFERS)` e comparar com este baseline.
3. Registrar delta em `docs/PERFORMANCE-BASELINE-v2.md` (ainda não criado).

---

## 7. Próximas otimizações (fora do escopo desta baseline)

Não executar antes de aprovação explícita:

- **B3 — Query Optimization:** revisar top 5 slow queries (`pg_stat_statements`), aplicar EXPLAIN, adicionar índices direcionados ou reescrever cláusulas.
- **B4 — Retenção `bible_cache_metric_events`:** confirmar política; tabela cresce rápido, considerar partitioning ou aggregation-on-write.
- **B5 — Fuzzy search:** validar índices trigram em `journeys`, `glossary`, `saints`; remover se planner não usar.
- **B6 — `bible_verses`:** avaliar índice `(translation, chapter_id, number INCLUDE text)` para eliminar heap fetch em leitura sequencial.

Explicitamente **fora** desta sprint (aguardando baseline v2):

- Reescrita de queries
- Alteração de cache L1/L2
- Tuning de Edge Functions
- Mudanças no React Query
- `bible-text` Edge Function
- Service Worker

---

## 8. Critério de aceite — status

- [x] Nenhuma regressão funcional (planos de execução preservados ou melhorados).
- [x] Nenhum índice removido sem comprovação objetiva de redundância (todos cobertos por UNIQUE prefixo).
- [x] Ganho mensurável de manutenção (12 índices a menos em 9 tabelas de escrita).
- [x] Zero funções `SECURITY DEFINER` públicas sem justificativa formal (allowlist atualizada).

---

**Status:** ✅ Sprint B1+B2 concluídas. Sprint B3 (query optimization) aguardando aprovação.
