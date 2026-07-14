/**
 * Baselines de performance versionados por commit
 * ------------------------------------------------
 *
 * Cada arquivo `<sha>.json` neste diretório é uma captura de
 * `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` das queries críticas
 * da Sprint B / B2, feita **naquele commit** contra o banco de
 * referência (staging).
 *
 * Convenções:
 *
 *   <git-sha-curto>.json     ← snapshot imutável por commit
 *   latest.json              ← cópia da snapshot mais recente
 *   previous.json            ← snapshot anterior (para diff manual)
 *   bench-latest.json        ← última corrida do job de carga (CI)
 *   bench-previous.json      ← baseline vigente do job de carga
 *
 * Scripts:
 *
 *   scripts/perf-baseline-snapshot.ts    gera <sha>.json + latest.json
 *   scripts/perf-baseline-revalidate.ts  diff contra previous.json
 *   scripts/perf-benchmark-app-metrics.ts   corrida de carga (usa bench-*)
 *   scripts/perf-regression-guard.test.ts   guard estrutural em CI
 *
 * Workflow:
 *
 *   1. Mudança de schema / novo índice / ANALYZE grande.
 *   2. Rodar `PG_URL=... PERF_BASELINE=1 bunx tsx scripts/perf-baseline-snapshot.ts`.
 *   3. `mv latest.json previous.json` (se quiser preservar o anterior local).
 *   4. `bunx tsx scripts/perf-baseline-revalidate.ts` reporta drift.
 *   5. Commit do novo `<sha>.json` + `latest.json`.
 *
 * O job `.github/workflows/perf-benchmark.yml` mantém automaticamente
 * `bench-latest.json` / `bench-previous.json` em `main` a partir das
 * corridas diárias contra staging.
 */
