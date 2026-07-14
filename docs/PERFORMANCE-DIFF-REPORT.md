# Diff de baseline · rotina de relatório

Este documento é **gerado** por `scripts/perf-baseline-diff-report.ts`
a partir de dois snapshots produzidos por `scripts/perf-baseline-snapshot.ts`.

O conteúdo real é escrito a cada corrida em `.perf/diff.md` (CI) ou no
caminho passado em `--out=`. Este arquivo em `docs/` serve como página
fixa que descreve o formato do relatório e onde encontrá-lo.

## Estrutura do relatório

1. **Cabeçalho** — commits, timestamps e `catalog_hash` dos dois snapshots.
   Se `catalog_hash` divergir, um aviso explícito é impresso porque diffs
   de custo/tempo passam a ser lidos junto com a mudança de schema.
2. **Resumo por query** — tabela com Δ custo, Δ tempo, índices perdidos,
   índices ganhos e operadores proibidos que apareceram (`Seq Scan on
   app_metrics`, `Seq Scan on journey_progress`, `Sort`).
3. **🚨 Alertas** — lista consolidada quando qualquer:
   - índice esperado sumiu,
   - operador proibido apareceu,
   - custo cresceu > 30 %,
   - tempo cresceu > 50 %.
4. **Assinaturas completas** — plano `Before/After` por query, para
   inspeção manual.

## Onde ele aparece

- **PR** — `.github/workflows/perf-pr-guard.yml` roda o script e cola o
  `.perf/diff.md` no PR via `sticky-pull-request-comment`. Se houver
  alertas, o job falha e bloqueia o merge (a regra de branch protection
  é responsabilidade da configuração do repo).
- **Benchmark diário** — `.github/workflows/perf-benchmark.yml` gera o
  próprio comparativo (throughput/p95) e faz upload dos artefatos.
- **Investigação sob demanda** — `scripts/perf-explain-from-trace.ts`
  produz um relatório equivalente para uma única trace OTLP.

## Como reproduzir localmente

```bash
# 1. Snapshot da branch atual contra shadow DB.
PG_URL=$STAGING_PG_URL PERF_BASELINE=1 \
  bunx tsx scripts/perf-baseline-snapshot.ts --env=ci
cp docs/perf-baselines/ci/latest.json .perf/current-baseline.json

# 2. Diff contra o baseline de referência do ambiente alvo.
bunx tsx scripts/perf-baseline-diff-report.ts \
  --baseline=docs/perf-baselines/staging/latest.json \
  --current=.perf/current-baseline.json \
  --out=.perf/diff.md

# 3. Abrir .perf/diff.md.
```

## Interpretação rápida

| Ícone | Significado |
|---|---|
| 🟢 melhora | Δ < −10 % |
| ⚪ estável | −10 % ≤ Δ ≤ 10 % |
| 🟡 leve   | 10 % < Δ ≤ 30 % (custo) ou 50 % (tempo) |
| 🟠 alta   | acima do limite, abaixo do dobro |
| 🔴 crítica | > 100 % (custo) ou > 200 % (tempo) |

**Índices perdidos** e **operadores proibidos novos** sempre viram alerta,
independentemente do delta numérico — porque a regressão é *estrutural* e
tende a explodir com o crescimento dos dados mesmo que hoje ainda pareça
barata.
