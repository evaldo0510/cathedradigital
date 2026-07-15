# Sprint B1.1 — Auditoria de Índices (CAT-004)

**Data:** 2026-07-15
**PostgreSQL:** 17.6
**Escopo:** schema `public` (275 índices · 5.5 MB)
**Modo:** somente leitura — nenhuma migration executada.

---

## 1. Sumário executivo

| Métrica | Valor |
|---|---:|
| Índices totais em `public` | 275 |
| Tamanho total | ~5.5 MB |
| **Nunca escaneados** (`idx_scan = 0`, não UNIQUE/PK) | **80** |
| Duplicados exatos (mesmas colunas + mesmo AM, sem `WHERE`) | 0 |
| "Duplicados" com predicado parcial (falsos positivos) | 2 |
| Redundantes por prefixo (composto que cobre outro) | 0 |
| Tabelas com >90% `Seq Scan` | 14 |

**Custo total dos 80 índices ociosos:** ~800 kB de espaço + write amplification em toda `INSERT/UPDATE`. Impacto de leitura hoje: **zero** (nenhum é usado).

**Recomendação global:** remover em ondas, começando pelas 🟢 tabelas de log/analytics/auditoria (sem impacto em UX). Manter tudo relacionado a `bible_*`, `catechism_*`, `journey_*` sob observação adicional antes de tocar (rota crítica do produto).

---

## 2. Inventário — 80 índices nunca escaneados

Fonte: `pg_stat_user_indexes.idx_scan = 0` desde o último `pg_stat_reset()`. Nenhum é UNIQUE nem PK.

### 2.1 🟢 Baixo risco (remoção segura na Fase B1.2) — 47 índices

Tabelas de auditoria, logs, métricas internas, snapshots de scan e diagnósticos. Sem uso em rota de usuário, sem consulta filtrada por essas colunas em código atual.

| Tabela | Índice | Tamanho |
|---|---|---:|
| `analytics_events` | `idx_analytics_events_session_id` | 8 kB |
| `analytics_events` | `idx_analytics_events_created_at` | 8 kB |
| `analytics_events` | `idx_analytics_events_event_name` | 8 kB |
| `audit_logs` | `idx_audit_logs_event_type` | 8 kB |
| `audit_logs` | `idx_audit_logs_created_at` | 8 kB |
| `bible_audit_log_cleanup_runs` | `idx_bible_audit_log_cleanup_runs_created_at` | 8 kB |
| `bible_cache_admin_audit` | `idx_bcaa_created_at` | 8 kB |
| `bible_cache_admin_audit` | `idx_bcaa_action_created` | 8 kB |
| `bible_cache_alerts` | `idx_bca_created_at` | 16 kB |
| `bible_cache_alerts` | `bible_cache_alerts_kind_metric_idx` | 16 kB |
| `bible_cache_metric_events` | `bible_cache_metric_events_l1_phase_idx` | 48 kB |
| `bible_cache_metric_events` | `idx_bible_cache_events_instance_id` | 16 kB |
| `bible_cache_metric_events` | `idx_bible_cache_events_cache_level` | 16 kB |
| `bible_diagnostic_findings` | `idx_bible_diag_findings_type` | 16 kB |
| `bible_diagnostic_findings` | `idx_bible_diag_findings_abbrev` | 16 kB |
| `bible_import_jobs` | `bible_import_jobs_source_status` | 8 kB |
| `bible_integrity_reports` | `idx_bible_integrity_status` | 8 kB |
| `bible_integrity_reports` | `idx_bible_integrity_book_chapter` | 8 kB |
| `cid_compliance_snapshots` | `idx_cid_compliance_snapshots_captured_at` | 8 kB |
| `core_audit_logs` | `idx_core_audit_logs_timestamp` | 8 kB |
| `core_audit_logs` | `idx_core_audit_livro_capitulo` | 8 kB |
| `core_audit_logs` | `idx_core_audit_logs_correlation_id` | 8 kB |
| `governance_audit_log` | `idx_gov_audit_actor` | 8 kB |
| `governance_audit_log` | `idx_gov_audit_pcl_lifecycle` | 8 kB |
| `governance_audit_log` | `idx_gov_audit_occurred_at` | 8 kB |
| `governance_audit_log` | `idx_gov_audit_correlation` | 8 kB |
| `governance_audit_log_archive` | `idx_gov_audit_archive_occurred_at` | 8 kB |
| `governance_audit_log_archive` | `idx_gov_audit_archive_entity` | 8 kB |
| `governance_audit_log_cleanup_runs` | `idx_gov_audit_cleanup_runs_created` | 8 kB |
| `intelligent_notification_logs` | `idx_notification_logs_user_type_sent` | 8 kB |
| `intelligent_notification_logs` | `idx_notification_logs_user_sent` | 8 kB |
| `pg_stat_pending_notifications` | `idx_pg_stat_pending_notif_created` | 16 kB |
| `pg_stat_snapshots` | `idx_pg_stat_snapshots_taken_at` | 8 kB |
| `saints_audit` | `idx_saints_audit_saint_id_changed_at` | 8 kB |
| `saints_audit` | `idx_saints_audit_changed_at` | 8 kB |
| `saints_reimport_runs` | `idx_saints_reimport_runs_created_at` | 16 kB |
| `saints_reimport_runs` | `idx_saints_reimport_runs_status` | 16 kB |
| `security_audit_logs` | `idx_security_audit_logs_event_type` | 16 kB |
| `security_audit_logs` | `idx_security_audit_logs_severity` | 16 kB |
| `vatican_cache` | `vatican_cache_last_attempt_idx` | 16 kB |
| `vatican_cache` | `vatican_cache_status_idx` | 16 kB |
| `visual_regression_snapshots` | `idx_vr_snapshots_run_id` | 8 kB |
| `visual_regression_snapshots` | `idx_vr_snapshots_status` | 8 kB |
| `webhook_logs` | `idx_webhook_logs_provider` | 16 kB |
| `catechism_cache` | `idx_catechism_cache_status` | 16 kB |
| `catechism_execution_logs` | `idx_catechism_logs_status` | 16 kB |
| `bible_cache_l2` | `idx_cache_l2_expires` | 16 kB |

**Total 🟢: ~590 kB**, ~47 índices. Tudo pode ser removido em uma única migration com `DROP INDEX IF EXISTS`.

### 2.2 🟡 Médio risco (revisar caso a caso) — 25 índices

Suportam features vivas mas com uso zero até agora — pode ser query nova ainda não em produção ou índice preventivo. Recomenda-se rodar mais 7 dias de observação antes de decidir.

| Tabela | Índice | Motivo do "médio" |
|---|---|---|
| `profiles` | `idx_profiles_premium_active` | filtro pago; pode ser usado por relatório mensal |
| `profiles` | `idx_profiles_last_active_at` | métrica de engagement |
| `profiles` | `idx_profiles_last_action` | idem |
| `profiles` | `idx_profiles_last_visit` | idem |
| `profiles` | `idx_profiles_mp_subscription` | webhook Mercado Pago |
| `user_roles` | `idx_user_roles_role` | apenas 1 linha hoje; ganha valor quando >1000 usuários |
| `user_notes` | `idx_user_notes_metadata` (GIN?) | busca por metadata futura |
| `user_notes` | `idx_user_notes_context` | idem |
| `colloquium_conversations` | `idx_colloquium_conversations_metadata` | busca metadata |
| `community_posts` | `idx_community_posts_created` | ordenação por data |
| `nexus_relations` | `idx_nexus_relations_type` | filtro por tipo |
| `nexus_relations` | `idx_nexus_relations_source_bible` | join Bible |
| `nexus_relations` | `idx_nexus_relations_target_bible` | idem |
| `nexus_relations` | `idx_nexus_relations_source_ccc` | join CCC |
| `nexus_relations` | `idx_nexus_relations_target_ccc` | idem |
| `nexus_relations` | `idx_nexus_relations_source_ref_gin` | GIN JSONB |
| `nexus_relations` | `idx_nexus_relations_target_ref_gin` | GIN JSONB |
| `bible_connections` | `idx_bible_connections_verse_id` | join versículo |
| `bible_favorites` | `idx_bible_favorites_location` | busca por localização |
| `bible_translation_sources` | `idx_bible_translation_sources_provider` | filtro admin |
| `bible_translation_sources` | `idx_bible_translation_sources_pcl_status` | filtro admin |
| `saints` | `idx_saints_content_hash` | idempotência de import |
| `saints` | `idx_saints_last_scraped_at` | job de refresh |
| `trail_progress` | `idx_trail_progress_trail_id` | join trail |
| `catechism_official` | *(nenhum específico, ver seq_scan)* | — |

### 2.3 🔴 Alto risco (não remover agora) — 8 índices

Índices trigram/GIN de busca textual: aparecem como zero porque a feature de busca fuzzy ainda não subiu, mas removê-los agora significaria recriar (custa CPU + downtime). Manter e revisar após Sprint C.

| Tabela | Índice | Tipo |
|---|---|---|
| `saints` | `idx_saints_name` | trgm/btree ordenação |
| `journeys` | `idx_journeys_title_trgm` | pg_trgm |
| `journeys` | `idx_journeys_description_trgm` | pg_trgm |
| `glossary` | `idx_glossary_term_trgm` | pg_trgm |
| `glossary` | `idx_glossary_definition_trgm` | pg_trgm |
| `community_posts` | `idx_community_posts_title_trgm` | pg_trgm |
| `community_posts` | `idx_community_posts_content_trgm` | pg_trgm |
| `tags` | `idx_tags_label_trgm` / `idx_tags_category_trgm` | pg_trgm |

---

## 3. Duplicatas e sobreposição

### 3.1 Duplicatas exatas

**Nenhuma.**

### 3.2 Falsos positivos (colunas iguais, predicados diferentes)

Ambos casos são **legítimos** — o índice parcial cobre um subconjunto e não deve ser removido:

| Tabela | Par | Veredicto |
|---|---|---|
| `bible_cache_alerts` | `idx_bca_created_at` × `idx_bca_open` (parcial `WHERE resolved_at IS NULL`) | Manter os dois — `idx_bca_open` é hot-path de dashboard. `idx_bca_created_at` está em §2.1 🟢. |
| `reading_marks` | `idx_reading_marks_user_id` × `idx_reading_marks_last_read` (parcial `WHERE is_last_read = true`) | Manter os dois — parcial é otimização de "última leitura". |

### 3.3 Redundância por prefixo

**Nenhum caso detectado.** Não há índice composto `(a,b)` que torne obsoleto `(a)`.

---

## 4. Seq Scan por tabela (top 15)

Ordenado por `seq_scan` absoluto. `seq_pct` = fração de acessos via scan sequencial.

| Tabela | Seq scans | Idx scans | seq % | Linhas | Diagnóstico |
|---|---:|---:|---:|---:|---|
| `user_roles` | 1.994.994 | 9 | 100% | 1 | ✅ **esperado** — 1 linha, planner ignora índice |
| `profiles` | 606.895 | 22.290 | 96.5% | 16 | ✅ tabela pequena; monitorar quando crescer |
| `bible_cache_metadata` | 61.607 | 0 | 100% | 0 | tabela vazia |
| `language_allowlist` | 31.168 | 0 | 100% | 19 | ✅ pequena, lookup total |
| `reading_marks` | 20.469 | 10.114 | 66.9% | 166 | ⚠️ investigar query sem filtro |
| `transactions` | 19.719 | 2.784 | 87.6% | 7 | ✅ pequena |
| `user_notes` | 18.930 | 27.353 | 40.9% | 1 | ✅ mix ok |
| `journeys` | 11.295 | 40.822 | 21.7% | 40 | ✅ ok |
| `spiritual_contents` | 9.683 | 904 | 91.5% | 92 | ⚠️ candidato a índice de listagem |
| `community_posts` | 5.138 | 45 | 99.1% | 1 | tabela quase vazia |
| `pg_stat_pending_notifications` | 3.429 | 626 | 84.6% | 0 | vazia |
| `app_metrics` | 2.711 | 6 | 99.8% | 4.359 | ⚠️ **atenção** — ver §5 |
| `saints` | 2.179 | 2.137 | 50.5% | 872 | ✅ ok |
| `catechism_cache` | 1.860 | 194 | 90.6% | 48 | ✅ pequena |
| `theme_contents` | 821 | 0 | 100% | 217 | ⚠️ leitura sempre full-scan |

**Ação sugerida (fora do escopo B1.1):** validar em B1.3 se `reading_marks`, `spiritual_contents`, `app_metrics` e `theme_contents` merecem índice novo — mas primeiro capturar EXPLAIN das queries reais.

---

## 5. Queries mais caras (pg_stat_statements — schemas de usuário)

Fonte: `supabase--slow_queries`. Top 5 por `total_exec_time`:

| # | Total (ms) | Chamadas | Média (ms) | Query (resumo) |
|---|---:|---:|---:|---|
| 1 | 74.328 | 2.200 | 33.79 | `SELECT metric_type, created_at FROM app_metrics WHERE created_at >= $1 LIMIT ...` (PostgREST) |
| 2 | 27.753 | 2.220 | 12.50 | `SELECT * FROM user_management_stats LIMIT ...` (view materializada) |
| 3 | 18.478 | 28.573 | 0.65 | `SELECT * FROM reading_marks WHERE user_id=$1 ORDER BY updated_at DESC LIMIT ...` |
| 4 | 11.266 | 4.296 | 2.62 | `INSERT INTO app_metrics(metric_type, metadata)` |
| 5 | 10.405 | 561 | 18.55 | `INSERT INTO user_history(route, title, user_id, visited_at)` |

**Observações críticas:**

- Query **#1** já é o alvo declarado das baselines B2 (`app_metrics:window30d`). O baseline atual usa índice sobre `created_at DESC`. Confirmar em B1.3 que o plano ainda usa o índice esperado.
- Query **#3** (`reading_marks`) roda em 0.65 ms mas 28k chamadas — não é gargalo, mas cruza com o "66% seq_pct" de §4. Provável causa: PostgREST faz `SELECT count(*)` sem filtro para paginação.
- Query **#4** (INSERT em `app_metrics`) — cada índice inútil sobre essa tabela custa neste path. **Nenhum dos 80 ociosos está em `app_metrics`** ✅.

---

## 6. Parallel — `cleanup_bible_audit_action_logs` (governança)

**Estado atual:**
- `SECURITY DEFINER` ✅ **necessário** — deleta de `bible_audit_action_logs`, tabela com RLS restrita a admin/service_role.
- `search_path = public` ✅ fixado.
- Guard interno: `IF v_role IS DISTINCT FROM 'service_role' AND NOT public.is_current_user_admin() THEN RAISE 'Access denied'`.
- `EXECUTE` já **revogado** de `anon` e `authenticated` (Sprint B/B2, 2026-07-14 — ver `docs/SECURITY-DEFINER-ALLOWLIST.md`, item 6).

**Veredicto:** manter `SECURITY DEFINER`. O guard duplo (role + `is_current_user_admin`) + revoke público já entrega o modelo correto. **Nenhuma ação adicional necessária** — a entrada da allowlist já está marcada como encerrada. Recomendação: adicionar teste pgTAP confirmando que `EXECUTE` continua negado para `authenticated` (regressão).

---

## 7. Plano da Fase B1.2 (proposta, aguarda homologação)

1. Migration única `drop_unused_indexes_b1_2.sql`:
   - `DROP INDEX IF EXISTS` para os **47** índices 🟢 listados em §2.1.
   - Executar `ANALYZE` nas tabelas afetadas.
2. Rodar `scripts/perf-baseline-snapshot.ts --env=staging` antes e depois.
3. Rodar `scripts/perf-baseline-diff-report.ts` — critério de aceite: **zero regressão** e **zero operador proibido novo**.
4. Publicar `docs/PERFORMANCE-INDEX-AUDIT-v1-RESULTS.md` com antes/depois.

Índices 🟡 (25) e 🔴 (8) **não** entram na B1.2. Reavaliar em B1.4 após 7 dias de novas métricas.

---

## 8. Critério de saída — Fase B1.1 ✅

- [x] Inventário completo (275 índices catalogados)
- [x] 80 índices ociosos identificados e classificados
- [x] Duplicatas e sobreposições analisadas (0 reais, 2 falsos positivos)
- [x] Top 15 Seq Scan levantados
- [x] Top 5 queries caras extraídas de `pg_stat_statements`
- [x] Governança: `cleanup_bible_audit_action_logs` revisada
- [x] **Nenhum índice removido**, **nenhuma migration executada**
