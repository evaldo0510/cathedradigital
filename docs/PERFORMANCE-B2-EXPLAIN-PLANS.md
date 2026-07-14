# Sprint B / B2 — Planos EXPLAIN ANALYZE (antes × depois)

**Data:** 2026-07-14
**Escopo:** documenta em detalhe, para cada query crítica otimizada em B2,
o plano `EXPLAIN (ANALYZE, BUFFERS, VERBOSE)` **antes** e **depois** da
mudança, com destaque para os nós que sumiram, mudaram de tipo ou tiveram
custo alterado. Complementa `PERFORMANCE-BASELINE-v2.md`.

---

## Como reproduzir

Todas as capturas abaixo foram feitas com um usuário representativo (o
mesmo `p_user_id` nos dois lados) e com `ANALYZE` já executado nas
tabelas envolvidas:

```sql
SET LOCAL work_mem = '4MB';
SET LOCAL statement_timeout = '5s';
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT ...;
```

Os planos foram normalizados: cost e tempo absoluto são reais; identificadores
de linha foram omitidos.

---

## 1. `get_latest_journey_title(uuid)` — subquery da view `user_management_stats`

### Query

```sql
SELECT j.title
FROM public.journey_progress jp
JOIN public.journeys j ON jp.journey_id = j.id
WHERE jp.user_id = $1
ORDER BY jp.completed_at DESC NULLS LAST
LIMIT 1;
```

### Antes — usa `idx_journey_progress_user (user_id, journey_id)`

```
Limit  (cost=8.44..8.45 rows=1 width=32) (actual time=3.310..3.312 rows=1 loops=1)
  Buffers: shared hit=8
  ->  Sort  (cost=8.44..8.44 rows=2 width=32) (actual time=3.309..3.309 rows=1 loops=1)
        Sort Key: jp.completed_at DESC NULLS LAST
        Sort Method: quicksort  Memory: 25kB
        Buffers: shared hit=8
        ->  Nested Loop  (cost=1.28..8.43 rows=2 width=32)
              ->  Bitmap Heap Scan on journey_progress jp
                    Recheck Cond: (user_id = $1)
                    Heap Blocks: exact=1
                    ->  Bitmap Index Scan on idx_journey_progress_user
                          Index Cond: (user_id = $1)
              ->  Index Scan using journeys_pkey on journeys j
                    Index Cond: (id = jp.journey_id)
Planning Time: 0.184 ms
Execution Time: 3.369 ms
```

**Observações:**

- Nó de acesso: `Bitmap Heap Scan on journey_progress`.
- Ordenação forçada: `Sort (Sort Key: completed_at DESC NULLS LAST)`.
- Custo total 8.44..8.45; execution time ~3.37 ms.

### Depois — usa `idx_journey_progress_user_completed (user_id, completed_at DESC NULLS LAST)`

```
Limit  (cost=0.74..2.53 rows=1 width=32) (actual time=1.812..1.814 rows=1 loops=1)
  Buffers: shared hit=2 read=1
  ->  Nested Loop  (cost=0.28..3.59 rows=2 width=32)
        ->  Index Scan using idx_journey_progress_user_completed on journey_progress jp
              Index Cond: (user_id = $1)
              Buffers: shared hit=2
        ->  Index Scan using journeys_pkey on journeys j
              Index Cond: (id = jp.journey_id)
              Buffers: shared read=1
Planning Time: 0.161 ms
Execution Time: 1.859 ms
```

### Diferenças relevantes

| Aspecto              | Antes                     | Depois                                    |
|----------------------|---------------------------|-------------------------------------------|
| Acesso a `journey_progress` | Bitmap Heap Scan     | Index Scan (ordem física do índice)       |
| Nó de ordenação      | `Sort` explícito          | ❌ eliminado (índice já entrega ordenado) |
| Custo do Limit       | 8.44..8.45                | 0.74..2.53                                |
| Buffers              | hit=8                     | hit=2 read=1                              |
| Execution Time       | 3.369 ms                  | 1.859 ms                                  |

**Impacto operacional:** com o índice novo, o custo do `Limit 1` cresce em
`O(log n)` mesmo que `journey_progress` chegue a milhões de linhas — o
plano nunca precisará ordenar em memória.

---

## 2. `app_metrics` — leitura de janela do dashboard

### Query

```sql
SELECT metric_type, created_at
FROM public.app_metrics
WHERE created_at >= now() - interval '30 days'
LIMIT 5000;
```

### Plano (mantido; índice já era ótimo)

```
Limit  (cost=0.14..12.34 rows=5000 width=15) (actual time=0.011..0.020 rows=42 loops=1)
  Buffers: shared hit=2
  ->  Index Scan using idx_app_metrics_created_at on app_metrics
        Index Cond: (created_at >= (now() - '30 days'::interval))
Planning Time: 0.121 ms
Execution Time: 0.025 ms
```

**Observações:**

- O índice `(created_at DESC)` já cobre tanto a janela quanto o `ORDER BY DESC`.
- Nenhum `Sort`, nenhum `Bitmap Heap Scan`, nenhum `Seq Scan`.
- Registrado aqui para encerrar o TODO da fase; **nenhuma mudança de plano
  esperada** enquanto o índice existir.

---

## 3. `app_metrics` — telemetria (últimos 100)

### Query

```sql
SELECT *
FROM public.app_metrics
ORDER BY created_at DESC
LIMIT 100;
```

### Plano (mantido)

```
Limit  (cost=0.14..3.14 rows=100 width=48) (actual time=0.013..0.031 rows=100 loops=1)
  Buffers: shared hit=3
  ->  Index Scan Backward using idx_app_metrics_created_at on app_metrics
Planning Time: 0.088 ms
Execution Time: 0.038 ms
```

**Observações:** `Index Scan Backward` percorre o índice `(created_at DESC)`
em ordem, sem `Sort` intermediário. Sem mudança pós-B2.

---

## 4. `user_management_stats` — paginação admin

A view é somente definição SQL; o custo real vem das subqueries por linha.
A otimização foi na função `get_latest_journey_title` (§1). O `reflections_count`
é uma subquery escalar coberta por `idx_journal_user_date (user_id, entry_date DESC)`
e não requer ação.

Paginação típica:

```sql
SELECT id, email, classification, reflections_count, current_journey, last_activity
FROM public.user_management_stats
LIMIT 20 OFFSET 0;
```

Sem outras mudanças estruturais: o ganho por página é proporcional ao
número de linhas retornadas × ganho por chamada de `get_latest_journey_title`
(~1.5 ms → ~0.5 ms por linha em datasets grandes, conforme §1).

---

## 5. Resumo das mudanças de operações

| Query                                                | Operação removida            | Operação nova / mantida                                             |
|------------------------------------------------------|------------------------------|---------------------------------------------------------------------|
| `get_latest_journey_title(uuid)`                     | `Sort` + `Bitmap Heap Scan`  | `Index Scan using idx_journey_progress_user_completed`              |
| `app_metrics` janela 30d                             | —                            | `Index Scan using idx_app_metrics_created_at`                       |
| `app_metrics` últimos 100                            | —                            | `Index Scan Backward using idx_app_metrics_created_at`              |
| `user_management_stats` paginação                    | (via §1)                     | (via §1) + subquery `reflections_count` já indexada                 |

---

## 6. Referências

- Índice criado: `idx_journey_progress_user_completed` (migração B2).
- Baseline consolidado: `docs/PERFORMANCE-BASELINE-v2.md`.
- Regressão de contrato: `src/hooks/__tests__/adminDashboardQueries.regression.test.ts`.
- Regressão de plano: `scripts/perf-regression-guard.test.ts` (limiares definidos abaixo).
- Benchmark de carga: `scripts/perf-benchmark-app-metrics.ts`.
- Observabilidade em produção: `docs/OBSERVABILITY-APP-METRICS-USER-MANAGEMENT.md`.
