# Performance Baseline v1 — Sprint B (B1 + B2)

**Data:** 2026-07-14
**Escopo:** CAT-004 (índices duplicados) + governança `cleanup_bible_audit_action_logs`.
**Metodologia:** inventário via `pg_indexes` + `pg_stat_user_indexes`, análise via `pg_stat_statements` (`supabase.slow_queries`).

---

## 1. Índices duplicados — inventário

Cruzamento `(table_name, indkey, method)` no schema `public` retornou **12 grupos com >1 índice**. Após inspeção manual das definições, **6 grupos** são duplicatas efetivas e **6 grupos** são falsos positivos (colunas distintas, expressões distintas ou índices parciais complementares).

### 1.1 Índices removidos (6)

| Tabela | Índice removido | Índice mantido | Justificativa | Uso pré-drop (scans) | Tamanho |
|---|---|---|---|---:|---:|
| `bible_books` | `idx_bible_books_abbrev` | `bible_books_abbrev_key` (UNIQUE) | Mesma coluna `abbrev`; UNIQUE cobre o mesmo lookup e é obrigatório pela constraint. | 726 vs 7 | 16 kB |
| `catechism_cache` | `idx_catechism_cache_paragraph` | `catechism_cache_paragraph_key` (UNIQUE) | Mesma coluna `paragraph`; UNIQUE obrigatório. | 21 222 vs 105 | 16 kB |
| `language_allowlist` | `idx_language_allowlist_term` | `language_allowlist_term_key` (UNIQUE) | Mesma coluna `term`; UNIQUE obrigatório. | 1 vs 0 | 16 kB |
| `core_audit_logs` | `idx_core_audit_correlation_id` | `idx_core_audit_logs_correlation_id` | Definições idênticas. | 0 vs 0 | 8 kB |
| `saints` | `idx_saints_date` | `idx_saints_feast` | Definições idênticas `(feast_month, feast_day_num)`. | 29 vs 1 131 | 16 kB |
| `bible_cache_metric_events` | `bible_cache_metric_events_correlation_id_idx` (full) | `idx_bcme_correlation_id` (parcial `WHERE correlation_id IS NOT NULL`) | Parcial é subset e cobre 100% das queries reais (todas filtram por CID específico). | 31 vs 106 | 72 kB |

**Ganho total:** ~144 kB de espaço de índice + redução proporcional de custo de INSERT/UPDATE nessas 6 tabelas.

### 1.2 Falsos positivos — mantidos por análise (6)

| Tabela | Índices | Razão para manter |
|---|---|---|
| `reading_marks` | `idx_reading_marks_user_id` + `idx_reading_marks_last_read` | Segundo é parcial `WHERE is_last_read=true` — otimiza query hot "última leitura do usuário". |
| `bible_cache_alerts` | `idx_bca_created_at` + `idx_bca_open` | Segundo é parcial `WHERE resolved_at IS NULL` — otimiza listagem de alertas abertos. |
| `journeys` | `idx_journeys_title_trgm` + `idx_journeys_description_trgm` | GIN trigram sobre colunas distintas (title vs description). |
| `tags` | `idx_tags_label_trgm` + `idx_tags_category_trgm` | GIN trigram sobre colunas distintas (label vs category). |
| `nexus_relations` | `idx_nexus_relations_source_bible` + `idx_nexus_relations_target_bible` | Expressões diferentes (`source_ref` vs `target_ref`). |
| `nexus_relations` | `idx_nexus_relations_source_ccc` + `idx_nexus_relations_target_ccc` | Idem. |

---

## 2. Top queries por custo (baseline)

Snapshot `pg_stat_statements` no momento do fechamento da Sprint A. Referência para comparações futuras.

| # | Alvo | Chamadas | Média (ms) | Total (ms) | Observação |
|---:|---|---:|---:|---:|---|
| 1 | `SELECT app_metrics WHERE created_at >= …` | 2 200 | 33,79 | 74 329 | Candidata a índice `(created_at DESC)` em B2. |
| 2 | `SELECT user_management_stats.*` | 2 220 | 12,50 | 27 754 | View — avaliar materialização. |
| 3 | `SELECT reading_marks WHERE user_id=… ORDER BY updated_at DESC` | 28 389 | 0,63 | 17 794 | Já otimizada, alta cardinalidade. |
| 4 | `INSERT app_metrics …` | 4 296 | 2,62 | 11 266 | Volume alto — considerar batch/flush. |
| 5 | `INSERT user_history …` | 561 | 18,55 | 10 406 | Verificar índices na tabela. |
| 6 | `SELECT app_metrics LIMIT/OFFSET` | 471 | 22,04 | 10 379 | Paginação sem WHERE — provavelmente admin. |

**Alvos prioritários da próxima fase (B2 — Query Optimization):** `app_metrics` (top 1, 4 e 6 → mesmo hotspot), `user_management_stats` (view), `user_history` (INSERT).

---

## 3. Governança SECURITY DEFINER (B2)

### `public.cleanup_bible_audit_action_logs(text, integer)`

**Antes:**
```
postgres=X/postgres
anon=X/postgres
authenticated=X/postgres
service_role=X/postgres
```

**Depois:**
```
postgres=X/postgres
service_role=X/postgres
```

**Efeito prático:** cron continua funcionando (usa `service_role`). Rota `anon` fechada. Chamadas administrativas manuais agora precisam passar pelo service-role — comportamento já assumido pela função (`v_role IS DISTINCT FROM 'service_role' AND NOT is_current_user_admin()` bloqueia).

**Warnings do linter:** 21 → 19 (as 2 remoções foram efetivas — restantes são pré-existentes da allowlist Sprint A).

**Dívida técnica CAT-003 residual: encerrada.**

---

## 4. Tabelas críticas identificadas

| Tabela | Volume relativo | Papel | Ação futura |
|---|---|---|---|
| `app_metrics` | muito alto (INSERTs + SELECTs) | telemetria | índice em `(created_at DESC)`, TTL de purga |
| `reading_marks` | alto (28k+ scans) | UX bíblia | já OK |
| `bible_cache_metric_events` | alto | observabilidade | índices revisados |
| `user_history` | médio | trilha | avaliar índices |
| `governance_audit_log` | baixo mas crítico | auditoria | mantido |

---

## 5. Regressões observadas

**Nenhuma.** As 6 remoções são de índices duplicados ou parciais que sobrepõem outro índice cobrindo o mesmo caso de uso. `ANALYZE` executado nas 6 tabelas afetadas.

---

## 6. Próximas otimizações (Sprint B — pós-baseline)

1. **B2 Query Optimization** (autorizado somente após esta baseline):
   - Índice `app_metrics (created_at DESC)` + política de retenção.
   - Análise de plano de `user_management_stats` (view/materialização).
   - Revisão de `user_history` (INSERT lento).
2. **B3 Seq scans:** identificar tabelas grandes com `seq_scan > idx_scan` via `pg_stat_user_tables`.
3. **B4 Buffers:** amostrar `EXPLAIN (ANALYZE, BUFFERS)` nas top 3 queries antes/depois de novas otimizações.

---

## 7. Referências

- Migração B1: `DROP INDEX` × 6 + `ANALYZE`.
- Migração B2: `REVOKE EXECUTE ... FROM anon, authenticated` em `cleanup_bible_audit_action_logs`.
- Allowlist atualizada: `docs/SECURITY-DEFINER-ALLOWLIST.md`.
