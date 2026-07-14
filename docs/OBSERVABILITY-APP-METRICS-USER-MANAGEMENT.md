# Observabilidade — `app_metrics` e `user_management_stats`

**Data:** 2026-07-14
**Escopo:** define os painéis e alertas mínimos para detectar cedo qualquer
regressão nas queries otimizadas em Sprint B / B2, sem depender de retesta
manual dos planos.

---

## 1. Fontes de dados

| Fonte                                    | Uso                                                      |
|------------------------------------------|----------------------------------------------------------|
| `pg_stat_statements`                     | latência média/p95, chamadas, `total_exec_time`, cache hit ratio |
| `pg_stat_user_tables`                    | `seq_scan` vs `idx_scan` por tabela (regressão de plano) |
| `pg_stat_activity`                       | filas de espera, locks, sessões long-running             |
| `app_metrics` (aplicação)                | latência ponta-a-ponta observada pelo cliente            |
| `bible_cache_metric_events`              | comparativo com fluxos já instrumentados                 |

---

## 2. Painel — "DB Perf: app_metrics & user_management_stats"

Cinco widgets, todos filtrando por `queryid` estável de `pg_stat_statements`:

| # | Widget                                              | Consulta base                                                                 | Alvo                                    |
|---|-----------------------------------------------------|-------------------------------------------------------------------------------|-----------------------------------------|
| 1 | Latência média (ms) — série temporal 24h            | `mean_exec_time` por `queryid`                                                | ≤ 40 ms `app_metrics`, ≤ 20 ms `ums`    |
| 2 | p95 (ms) — série temporal 24h                       | `pg_stat_statements` snapshot 5 min + delta                                   | ≤ 150 ms                                |
| 3 | Chamadas por minuto                                 | `delta(calls)`                                                                | linha de base ± 3σ                      |
| 4 | Índice vs seq scan (tabelas alvo)                   | `pg_stat_user_tables` — `idx_scan / (idx_scan+seq_scan)`                      | ≥ 0.98                                  |
| 5 | Cardinalidade média retornada                       | `rows / calls` por `queryid`                                                  | `app_metrics` janela ≤ 5000; `ums` = 20 |

Widget adicional (fila / saturação):

| # | Widget                              | Consulta                                                                                       | Alvo         |
|---|-------------------------------------|------------------------------------------------------------------------------------------------|--------------|
| 6 | Conexões esperando I/O ou lock      | `SELECT count(*) FROM pg_stat_activity WHERE wait_event_type IN ('IO','Lock')`                 | ≤ 5 sustentado |

---

## 3. Alertas

Todos os alertas são **ativos em produção** e **silenciados em preview**
(via label `env=production`). Janela padrão: 15 min. Cooldown: 30 min.

| ID     | Condição                                                                                              | Severidade | Ação                                             |
|--------|-------------------------------------------------------------------------------------------------------|------------|--------------------------------------------------|
| PERF-1 | `mean_exec_time(app_metrics:window30d)` > 80 ms por 15 min                                            | warning    | abrir issue automática, anexar plano atual       |
| PERF-2 | `p95(app_metrics:window30d)` > 250 ms por 15 min                                                      | critical   | página on-call + revisar `idx_app_metrics_created_at` |
| PERF-3 | `mean_exec_time(user_management_stats)` > 60 ms por 15 min                                            | warning    | conferir `idx_journey_progress_user_completed`   |
| PERF-4 | `seq_scan / (seq_scan+idx_scan)` em `app_metrics` ou `journey_progress` > 5 % em 30 min               | critical   | plano regrediu → rodar `EXPLAIN` e ver índice ausente |
| PERF-5 | `rows/call` em `app_metrics:window30d` > 10 000 em 15 min                                             | warning    | possível query sem `LIMIT` no cliente            |
| PERF-6 | `pg_stat_activity` com wait `IO`/`Lock` > 10 conexões por 10 min                                      | warning    | investigar contenção (long tx, VACUUM, backup)   |
| PERF-7 | Erro no benchmark de carga (job diário) — regressão de p95 > 20 % vs baseline salvo                   | warning    | issue com diff de plano vs baseline anterior     |

---

## 4. Instrumentação no cliente

Os hooks já emitem métricas em `app_metrics`:

- `useAdminDashboardData` → `metric_type = 'admin.dashboard.load_ms'`.
- `TelemetryDashboard` → `metric_type = 'admin.telemetry.load_ms'`.

Adicionar em cada consumidor (fora do escopo desta entrega, backlog):
tagging por rota + `p95` semanal no relatório de saúde.

---

## 5. Verificação periódica de plano (defesa em profundidade)

Job diário (cron `0 4 * * *`) via edge function admin:

1. Executa `EXPLAIN (ANALYZE, BUFFERS)` nas 4 queries alvo (`app_metrics:window30d`,
   `app_metrics:latest100`, `get_latest_journey_title`, `user_management_stats:page0`).
2. Compara com a assinatura salva em `docs/PERFORMANCE-B2-EXPLAIN-PLANS.md`
   (índice usado, presença/ausência de `Sort`, cost total).
3. Se qualquer assinatura mudar, insere linha em `bible_audit_alerts`
   com `severity = 'warning'` e detalhes do delta.

---

## 6. Referências

- Baseline de custo/tempo: `docs/PERFORMANCE-BASELINE-v2.md`.
- Planos detalhados: `docs/PERFORMANCE-B2-EXPLAIN-PLANS.md`.
- Guarda de regressão automatizada: `scripts/perf-regression-guard.test.ts`.
- Benchmark de carga: `scripts/perf-benchmark-app-metrics.ts`.
