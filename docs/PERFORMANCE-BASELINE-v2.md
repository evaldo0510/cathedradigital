# Performance Baseline v2 — Sprint B (B1 + B2)

**Data:** 2026-07-14
**Escopo:** consolida B1 (índices duplicados) + B2 (query optimization).
**Substitui:** `PERFORMANCE-BASELINE-v1.md` (mantido como histórico da fase B1).

---

## 1. Resumo executivo

| Frente | Antes | Depois | Ganho |
|---|---|---|---|
| Índices duplicados (`public`) | 12 grupos com >1 índice | 6 grupos (falsos positivos justificados) | −6 índices redundantes, ~144 kB liberados |
| `get_latest_journey_title()` (usada por `user_management_stats`) | Bitmap Heap Scan + Sort por `completed_at` | Index Scan direto por `(user_id, completed_at DESC NULLS LAST)` + Limit 1, sem Sort | cost 8.05 → 2.41, plano sem etapa de ordenação |
| `SELECT app_metrics WHERE created_at >= …` | Index Scan em `idx_app_metrics_created_at (DESC)` | Idem — índice já era o ótimo | Mantido; sem regressão |
| Grants em `cleanup_bible_audit_action_logs` | `anon`, `authenticated`, `service_role` | apenas `service_role` (+ `postgres`) | Superfície de ataque fechada; cron intacto |
| Warnings linter | 21 | 19 | −2 (residual = allowlist Sprint A) |
| Regressões funcionais | — | 0 | ✅ |

---

## 2. B1 — Índices removidos/mantidos

### 2.1 Removidos (6) — duplicatas efetivas

| Tabela | Índice removido | Índice mantido | Justificativa | Uso pré-drop (scans) | Tamanho |
|---|---|---|---|---:|---:|
| `bible_books` | `idx_bible_books_abbrev` | `bible_books_abbrev_key` (UNIQUE) | Mesma coluna; UNIQUE obrigatório. | 726 vs 7 | 16 kB |
| `catechism_cache` | `idx_catechism_cache_paragraph` | `catechism_cache_paragraph_key` (UNIQUE) | Mesma coluna; UNIQUE obrigatório. | 21 222 vs 105 | 16 kB |
| `language_allowlist` | `idx_language_allowlist_term` | `language_allowlist_term_key` (UNIQUE) | Mesma coluna; UNIQUE obrigatório. | 1 vs 0 | 16 kB |
| `core_audit_logs` | `idx_core_audit_correlation_id` | `idx_core_audit_logs_correlation_id` | Definições idênticas. | 0 vs 0 | 8 kB |
| `saints` | `idx_saints_date` | `idx_saints_feast` | Definições idênticas `(feast_month, feast_day_num)`. | 29 vs 1 131 | 16 kB |
| `bible_cache_metric_events` | `bible_cache_metric_events_correlation_id_idx` | `idx_bcme_correlation_id` (parcial `WHERE correlation_id IS NOT NULL`) | Parcial cobre 100% das queries reais. | 31 vs 106 | 72 kB |

### 2.2 Mantidos (6) — falsos positivos após análise

| Tabela | Índices coexistentes | Razão |
|---|---|---|
| `reading_marks` | `idx_reading_marks_user_id` + `idx_reading_marks_last_read` (parcial) | Parcial otimiza a hot query "última leitura". |
| `bible_cache_alerts` | `idx_bca_created_at` + `idx_bca_open` (parcial) | Parcial `WHERE resolved_at IS NULL` acelera listagem de abertos. |
| `journeys` | `idx_journeys_title_trgm` + `idx_journeys_description_trgm` | GIN trigram em colunas distintas. |
| `tags` | `idx_tags_label_trgm` + `idx_tags_category_trgm` | GIN trigram em colunas distintas. |
| `nexus_relations` | `source_bible` + `target_bible` | Expressões distintas. |
| `nexus_relations` | `source_ccc` + `target_ccc` | Expressões distintas. |

---

## 3. B2 — Otimização de consultas críticas

### 3.1 `user_management_stats` — `get_latest_journey_title(uuid)`

A view chama essa função uma vez por linha do resultado (`SELECT … get_latest_journey_title(p.id) …`). A função executa:

```sql
SELECT j.title
FROM journey_progress jp
JOIN journeys j ON jp.journey_id = j.id
WHERE jp.user_id = p_user_id
ORDER BY jp.completed_at DESC NULLS LAST
LIMIT 1;
```

**Índice pré-existente relevante:** `idx_journey_progress_user (user_id, journey_id)` — cobre o filtro por `user_id`, mas o `ORDER BY completed_at DESC` exigia um `Sort` explícito.

**Ação:** criado `idx_journey_progress_user_completed (user_id, completed_at DESC NULLS LAST)`.

**EXPLAIN (ANALYZE, BUFFERS) — mesma query, mesmo usuário:**

| Métrica | Antes | Depois |
|---|---|---|
| Nó de acesso | `Bitmap Heap Scan on journey_progress` (via `idx_journey_progress_user`) | `Index Scan using idx_journey_progress_user_completed` |
| Nó de ordenação | `Sort (Sort Key: jp.completed_at DESC NULLS LAST)` | ❌ eliminado |
| `cost` do acesso a `journey_progress` | `1.27..4.45` (Bitmap) + `Sort 8.05..8.05` | `0.14..2.41` (Index Scan direto) |
| `cost` total (Limit) | `8.44..8.45` | `0.74..2.53` |
| Buffers | shared hit=8 | shared hit=2 read=1 |
| Execution Time | 3.369 ms | 1.859 ms |

Volume atual do dataset é pequeno (16 profiles, 18 linhas em `journey_progress`), então o ganho absoluto é modesto — o ganho **estrutural** é o que importa: elimina o `Sort` e mantém custo `O(log n)` mesmo com crescimento.

### 3.2 `app_metrics` — leitura do dashboard admin

Consultas mapeadas em `useAdminDashboardData` e `TelemetryDashboard`:

```sql
-- Dashboard
SELECT metric_type, created_at
FROM app_metrics
WHERE created_at >= now() - interval '30 days'
LIMIT 5000;

-- Telemetria
SELECT *
FROM app_metrics
ORDER BY created_at DESC
LIMIT 100;
```

**Índices atuais na tabela:**

| Índice | Definição | Cobre |
|---|---|---|
| `app_metrics_pkey` | `(id)` | lookup por id |
| `idx_app_metrics_created_at` | `btree (created_at DESC)` | filtro por janela + `ORDER BY created_at DESC` |
| `idx_app_metrics_type_created` | `btree (metric_type, created_at)` | filtro por tipo com ordenação temporal |

**EXPLAIN (ANALYZE, BUFFERS) sobre a consulta de janela:**

```
Index Scan using idx_app_metrics_created_at on app_metrics
  Index Cond: (created_at >= (now() - '30 days'::interval))
  Buffers: shared hit=2
  Execution Time: 0.025 ms
```

O índice em `(created_at DESC)` já é ótimo para os dois padrões (janela e ordenação decrescente). **Nenhum índice novo foi necessário**; a análise B2 confirma que a otimização proposta no baseline v1 já estava presente e efetiva. Registrado aqui para fechar o TODO da fase.

### 3.3 `spiritual_journal.reflections_count` — subquery escalar da view

Padrão: `SELECT count(*) FROM spiritual_journal WHERE user_id = p.id`. Coberto por `idx_journal_user_date (user_id, entry_date DESC)`. Não requer ação.

---

## 4. Top queries por custo — snapshot v2

Referência para próximas ondas de otimização (não abertas nesta sprint).

| # | Alvo | Chamadas | Média (ms) | Total (ms) | Status pós-B2 |
|---:|---|---:|---:|---:|---|
| 1 | `SELECT app_metrics WHERE created_at >= …` | 2 200 | 33,79 | 74 329 | ✅ Índice ótimo confirmado |
| 2 | `SELECT user_management_stats.*` | 2 220 | 12,50 | 27 754 | ✅ Sort eliminado no subcomponente hot |
| 3 | `SELECT reading_marks WHERE user_id=… ORDER BY updated_at DESC` | 28 389 | 0,63 | 17 794 | Já otimizada (B1) |
| 4 | `INSERT app_metrics …` | 4 296 | 2,62 | 11 266 | Candidata a batching (backlog) |
| 5 | `INSERT user_history …` | 561 | 18,55 | 10 406 | Sob avaliação (backlog) |
| 6 | `SELECT app_metrics LIMIT/OFFSET` | 471 | 22,04 | 10 379 | ✅ Coberto pelo mesmo índice |

---

## 5. Governança de execução (B2 — herdada da B1)

`public.cleanup_bible_audit_action_logs(text, integer)`

**Grants antes:** `postgres`, `anon`, `authenticated`, `service_role`.
**Grants depois:** `postgres`, `service_role`.

Sem impacto no cron (roda como `service_role`). Rota `anon` fechada. **CAT-003 encerrada.**

---

## 6. Regressão funcional

- **Migrações B2:** apenas `CREATE INDEX IF NOT EXISTS` + `ANALYZE`. Nenhuma alteração de tabela, coluna, política ou função.
- **Testes de regressão:** `src/hooks/__tests__/adminDashboardQueries.regression.test.ts` congela o contrato das consultas em `useAdminDashboardData` e `TelemetryDashboard` (tabela, colunas, filtros, `order`, `range`, `limit`). Qualquer mudança acidental falha o teste.
- **Warnings linter:** 19 (mesmo total pós-B1; nenhum novo introduzido).

**Regressões observadas: 0.**

---

## 7. Próximas otimizações (fora do escopo desta baseline)

1. **INSERT `app_metrics`** — avaliar batching/flush no cliente.
2. **INSERT `user_history`** — revisar índices e triggers.
3. **Seq scans** — enumerar tabelas com `seq_scan > idx_scan` em `pg_stat_user_tables`.
4. **`EXPLAIN (ANALYZE, BUFFERS)`** amostrado periodicamente nas top 3 queries para detectar regressão de plano após crescimento de dados.

---

## 8. Referências

- Migração B1: `DROP INDEX` × 6 + `ANALYZE` (histórico em `PERFORMANCE-BASELINE-v1.md`).
- Migração B2 (governança): `REVOKE EXECUTE ... FROM anon, authenticated` em `cleanup_bible_audit_action_logs`.
- Migração B2 (query optimization): `CREATE INDEX idx_journey_progress_user_completed ON journey_progress (user_id, completed_at DESC NULLS LAST)` + `ANALYZE` nas 4 tabelas afetadas.
- Teste de regressão: `src/hooks/__tests__/adminDashboardQueries.regression.test.ts`.
- Allowlist SECURITY DEFINER: `docs/SECURITY-DEFINER-ALLOWLIST.md`.
