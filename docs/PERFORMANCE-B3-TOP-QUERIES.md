# Sprint B3 — Top Queries por Tempo e Custo (pg_stat_statements)

**Data:** 2026-07-14
**Fonte:** `supabase--slow_queries` (limit 25), ranking por `total_exec_time` no schema `public`.
**Objetivo:** priorizar alvos de otimização da Sprint B3.

---

## 1. Ranking consolidado (top 25)

| # | Alvo (tabela / operação) | Chamadas | Média (ms) | Máx (ms) | **Total (ms)** | % do total | Status B2 | Prioridade B3 |
|---:|---|---:|---:|---:|---:|---:|---|---|
| 1 | `SELECT app_metrics WHERE created_at >= …` | 2 200 | 33,79 | 227,13 | **74 328,80** | 34,7% | ✅ Índice ótimo | 🟡 Volume/cardinalidade |
| 2 | `SELECT user_management_stats.*` | 2 220 | 12,50 | 220,81 | **27 753,82** | 12,9% | ✅ Sort eliminado (B2) | 🟢 Monitorar |
| 3 | `SELECT reading_marks WHERE user_id ORDER BY updated_at DESC` | 28 397 | 0,63 | 122,38 | **17 812,47** | 8,3% | ✅ Índice OK (B1) | 🟢 Volume alto — cache client |
| 4 | `INSERT app_metrics` (bulk) | 4 296 | 2,62 | 75,68 | **11 266,34** | 5,3% | — | 🔴 **Batching client** |
| 5 | `INSERT user_history` | 561 | 18,55 | 163,27 | **10 405,85** | 4,9% | — | 🔴 **Debounce/batch** |
| 6 | `SELECT app_metrics.* LIMIT/OFFSET` (sem filtro) | 471 | 22,04 | 72,07 | **10 378,71** | 4,8% | — | 🟠 Adicionar filtro obrigatório |
| 7 | `SELECT profiles (subset) LIMIT/OFFSET` | 2 198 | 3,44 | 59,32 | **7 567,24** | 3,5% | — | 🟠 Paginação real |
| 8 | `SELECT saints.* + count` | 758 | 6,91 | 36,15 | **5 238,26** | 2,4% | — | 🟠 Cache HTTP/CDN |
| 9 | `SELECT journey_progress.user_id` (count all) | 2 302 | 2,27 | 51,47 | **5 231,32** | 2,4% | — | 🔴 **Trocar por RPC agregado** |
| 10 | `SELECT journey_progress WHERE completed_at NOT NULL` (count) | 2 302 | 2,17 | 70,16 | **4 985,19** | 2,3% | — | 🔴 **Idem — RPC ou índice parcial** |
| 11 | `UPSERT catechism_paragraphs_read` | 466 | 10,60 | 711,84 | **4 937,30** | 2,3% | — | 🟠 Investigar p95 (711ms) |
| 12 | `SELECT journey_steps.* + count` | 169 | 24,14 | 83,51 | **4 078,90** | 1,9% | — | 🟠 Cache — dados estáticos |
| 13 | `SELECT app_feature_flags WHERE feature_key=?` | 14 277 | 0,28 | 14,65 | **3 953,12** | 1,8% | — | 🟠 Cache in-memory (TTL 60s) |
| 14 | `SELECT journey_progress.journey_id WHERE user_id=?` | 5 853 | 0,61 | 94,59 | **3 591,37** | 1,7% | — | 🟢 OK |
| 15 | `SELECT user_sensitive_data WHERE user_id=?` | 8 986 | 0,39 | 32,06 | **3 509,25** | 1,6% | — | 🟠 Cache sessão |
| 16 | `SELECT profiles.id LIMIT/OFFSET` | 627 | 5,32 | 109,62 | **3 333,12** | 1,6% | — | 🟠 Consulta suspeita — auditar caller |
| 17 | `SELECT public_seo_settings.*` | 529 | 5,81 | 111,03 | **3 071,20** | 1,4% | — | 🟠 Cache HTTP (Cache-Control) |
| 18 | `SELECT view_journeys_with_stats ORDER BY sort_order` | 85 | 33,65 | 96,07 | **2 860,65** | 1,3% | — | 🟠 Materialized view |
| 19 | `SELECT transactions WHERE user_id AND status` | 9 804 | 0,26 | 83,41 | **2 597,37** | 1,2% | — | 🟢 OK |
| 20 | `SELECT bible_chapters_read WHERE user_id ORDER BY read_at DESC` | 2 826 | 0,81 | 41,07 | **2 299,22** | 1,1% | — | 🟠 Índice `(user_id, read_at DESC)` |
| 21 | `SELECT telemetry_settings WHERE key=?` | 268 | 7,99 | 85,93 | **2 141,17** | 1,0% | — | 🟠 Cache in-memory |
| 22 | `SELECT language_allowlist.term` (full table) | 31 164 | 0,06 | 62,94 | **1 986,77** | 0,9% | — | 🔴 **Cache client (dados estáticos)** |
| 23 | `SELECT user_notes.id WHERE user_id=?` (count) | 2 533 | 0,70 | 17,20 | **1 776,53** | 0,8% | — | 🟢 OK |
| 24 | `SELECT user_notes WHERE user_id + content_type + content_id` | 23 231 | 0,07 | 47,06 | **1 713,91** | 0,8% | — | 🟢 OK (índice usado) |
| 25 | `UPDATE profiles SET last_visit, streak WHERE id=?` | 84 | 20,00 | 194,41 | **1 680,35** | 0,8% | — | 🟠 Investigar p95 |

**Total das top 25:** ~216 s de tempo acumulado.

---

## 2. Leitura estratégica

### 2.1 Concentração de custo
- **47,6%** do custo total vem de 2 queries: `app_metrics` (janela 30d) + `user_management_stats`. Ambas já otimizadas em B2 — o custo agora é **volume**, não plano.
- **10,2%** vem de 2 INSERTs (`app_metrics`, `user_history`) — típicos de telemetria sem batching.
- **4,7%** vem de duas queries de `journey_progress` (count all) chamadas 2 302 vezes cada — padrão suspeito de N+1 ou polling.

### 2.2 Alertas de p95/máximo
Queries com **max_ms alarmante** (planner instável ou lock contention):
- `UPSERT catechism_paragraphs_read`: max **711 ms** (média 10 ms). Investigar contenção em `(user_id, paragraph)`.
- `SELECT app_metrics WHERE created_at`: max **227 ms** (média 33 ms). Confirmar warm cache.
- `SELECT reading_marks`: max **122 ms** (média 0,6 ms). Provável cold start.
- `UPDATE profiles.last_visit,streak`: max **194 ms** (média 20 ms). Lock em row hot.

### 2.3 Anti-patterns identificados
1. **Counts sem filtro** (linhas 9, 10): `SELECT user_id FROM journey_progress LIMIT` — usado provavelmente para contagens globais. Trocar por RPC `SELECT count(*) FROM journey_progress`.
2. **`language_allowlist` chamado 31 164×** (linha 22): dado estático (~50 termos). Deveria ser cacheado no client ou vir do bundle.
3. **`app_feature_flags` chamado 14 277×** (linha 13): flags mudam raramente. Cache em memória TTL 60s reduziria 90%+ das chamadas.
4. **`SELECT app_metrics.*` sem filtro** (linha 6): 471 chamadas trazendo tudo até LIMIT. Forçar filtro obrigatório de janela temporal.
5. **`SELECT profiles LIMIT/OFFSET` sem `where`** (linhas 7, 16): auditar caller — possível vazamento em dashboard.

---

## 3. Prioridades sugeridas para B3

### 🔴 P0 — Alto impacto, baixo risco
| Ação | Query alvo | Ganho esperado |
|---|---|---|
| **B3.1** Batching de `INSERT app_metrics` (flush a cada 5s ou 20 eventos) | #4 | −70% chamadas, −7 s/dia |
| **B3.2** Debounce/batch de `INSERT user_history` (agregar por rota) | #5 | −60% chamadas, −6 s/dia |
| **B3.3** Cache client de `language_allowlist` (bundle ou React Query staleTime=∞) | #22 | −99% chamadas |
| **B3.4** RPC agregado para counts de `journey_progress` (retorna total + completed em 1 call) | #9, #10 | −50% dessas 2 queries |

### 🟠 P1 — Médio impacto
| Ação | Query alvo | Ganho esperado |
|---|---|---|
| **B3.5** Cache in-memory (TTL 60s) para `app_feature_flags` | #13 | −90% chamadas |
| **B3.6** Cache HTTP (`Cache-Control: max-age=300`) em `public_seo_settings`, `saints`, `journey_steps` | #8, #12, #17 | Reduz round-trips |
| **B3.7** Índice `bible_chapters_read (user_id, read_at DESC)` | #20 | Elimina Sort |
| **B3.8** Auditar callers de `SELECT app_metrics.*` sem filtro e `SELECT profiles LIMIT` | #6, #7, #16 | Elimina full-scan |
| **B3.9** Investigar p95 do UPSERT `catechism_paragraphs_read` (711 ms) | #11 | Corrige tail latency |

### 🟢 P2 — Monitorar
- `user_management_stats`, `reading_marks`, `transactions`, `user_notes`: já otimizadas. Manter em watchlist.

---

## 4. Critério de aceite proposto para B3

- Reduzir **total_ms das top 5 queries em ≥ 30%** medido 7 dias após deploy.
- Zero regressões funcionais (testes de contrato em `adminDashboardQueries.regression.test.ts` mantidos).
- Nenhum p95 acima de 100 ms nas top 10.
- Documentar delta em `PERFORMANCE-BASELINE-v3.md`.

---

## 5. Próximo passo

Aguardando aprovação para abrir **B3.1 (batching de `app_metrics`)** como primeira frente — é o item de maior custo total (11 s/dia) e menor risco (só toca cliente, sem migração).
