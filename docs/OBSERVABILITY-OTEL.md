# Observabilidade — OpenTelemetry nos endpoints críticos

**Data:** 2026-07-14
**Escopo:** define como instrumentar os endpoints de leitura pesada
(`app_metrics`, `user_management_stats`) com OpenTelemetry para
correlacionar **latência de UI** ↔ **chamada Supabase** ↔ **plano
`EXPLAIN ANALYZE`** capturado em `docs/perf-baselines/`.

Adoção incremental: os arquivos de plumbing existem, mas a
instrumentação só é ativada quando `VITE_OTEL_ENABLED=1` — assim CI e
preview não pagam custo sem opt-in.

---

## 1. Modelo de tracing

Cada consulta gera uma trace com este shape:

```
route:/admin/dashboard         (span raiz — navegação)
└── hook:useAdminDashboardData (span de dados agregados)
    ├── db:app_metrics:window30d       ← attrs: query_id, rows, ms
    ├── db:transactions:last100
    ├── db:journey_progress.count
    └── db:user_management_stats:page0
```

**Atributos padrão em cada span `db:*`:**

| Atributo             | Origem                                             |
|----------------------|----------------------------------------------------|
| `db.system`          | `postgresql`                                       |
| `db.query_id`        | id lógico igual ao usado em `perf-alerts.config.yaml` |
| `db.rows_returned`   | `data?.length ?? count`                            |
| `db.expected_index`  | valor de `plan_signature.must_use_index` (quando houver) |
| `perf.baseline_ms`   | valor de `execution_ms` no `docs/perf-baselines/latest.json` |
| `perf.baseline_sha`  | `commit` do baseline usado como referência         |

Com esses atributos, qualquer trace lento no APM já traz o número
esperado ao lado do medido — o operador não precisa abrir outra tela.

---

## 2. Setup no frontend

Dependências (adicionar apenas se `VITE_OTEL_ENABLED=1`):

```
@opentelemetry/api
@opentelemetry/sdk-trace-web
@opentelemetry/exporter-trace-otlp-http
@opentelemetry/instrumentation-fetch
@opentelemetry/instrumentation-xml-http-request
```

Bootstrap único em `src/lib/otel.ts` (helper opcional criado nesta
entrega). Chamar `initOtel()` em `src/main.tsx` **antes** de qualquer
`supabase.from(...)`.

Variáveis:

| Env                              | Uso                                   |
|----------------------------------|---------------------------------------|
| `VITE_OTEL_ENABLED`              | `1` liga o SDK                        |
| `VITE_OTEL_ENDPOINT`             | URL do collector OTLP/HTTP            |
| `VITE_OTEL_SERVICE_NAME`         | default `cathedra-web`                |
| `VITE_OTEL_SAMPLE_RATE`          | 0.0–1.0 (default `0.1` em prod)       |

---

## 3. Spans de DB — padrão de uso

```ts
import { traceDb } from '@/lib/otel';

const { data } = await traceDb('app_metrics:window30d', async () =>
  supabase
    .from('app_metrics')
    .select('metric_type, created_at')
    .gte('created_at', iso30)
    .limit(5000),
);
```

`traceDb` é no-op quando OTel está desligado — não altera dados nem
comportamento. Custa 1 span quando ligado.

---

## 4. Correlação com EXPLAIN

Fluxo de investigação quando um alerta dispara:

1. APM mostra trace lenta com `db.query_id = app_metrics:window30d`,
   `duration = 480 ms`, `perf.baseline_ms = 25 ms`, `perf.baseline_sha = abc123`.
2. Time abre `docs/perf-baselines/abc123.json` → confirma qual plano
   estava aprovado nesse commit.
3. Roda `PG_URL=... PERF_BASELINE=1 bunx tsx scripts/perf-baseline-snapshot.ts`
   → captura plano atual.
4. `bunx tsx scripts/perf-baseline-revalidate.ts docs/perf-baselines/abc123.json`
   → diff estrutural (índice sumiu? `Sort` apareceu?).
5. Fix (rebuild index / ANALYZE / novo índice) → nova snapshot → merge.

---

## 5. O que **não** foi feito nesta entrega

- Não religa hooks existentes (`useAdminDashboardData`,
  `TelemetryDashboard`) automaticamente. A adoção é opt-in por chamada
  para preservar o contrato validado pelos testes de regressão.
- Não instala as libs `@opentelemetry/*`. Elas entram no `package.json`
  apenas quando o time decidir ativar em produção — evitam bundle inflado
  para usuários sem OTel.
- Backend (edge functions) usa `correlation_id` próprio (`_shared/correlation.ts`).
  Ponte OTLP ↔ CID fica no backlog.
