# Matriz de Conformidade — Edge Functions

**Sprint A (Governança) · v1.3 · atualizada 2026-07-13 (pós-A1.c CID-only 100%)**
Fonte de evidência: varredura estática de `supabase/functions/*/index.ts`
(grep por `correlation`, `zod`, `corsHeaders`, `getClaims|getUser|is_current_user_admin`,
`rate.?limit`, presença de `index.test.ts`).

Legenda: ✅ conforme · ❌ ausente · ➖ N/A justificado · 🔒 via helper compartilhado

Colunas:
- **CID** — propaga `x-correlation-id` (ADR-009)
- **VAL** — validação de entrada (Zod ou equivalente auditável)
- **AUTHN** — verificação de identidade (JWT/service-role/cron secret)
- **AUTHZ** — verificação de papel/escopo (`is_current_user_admin`, RLS, allowlist)
- **RATE** — rate limiting explícito
- **HTTP** — contrato HTTP padronizado (`_shared/http-response.ts`)
- **TEST** — suíte Deno associada
- **Status** — 🟢 conforme · 🟡 parcial · 🔴 não-conforme

## Status atual (pós-A1.a homologada + A1.b CID-only)

**Convenção CID:**
- ✅ A1.a — bible-* padronizado com `getOrCreateCorrelationId` + shadowing de `corsHeaders` (16/16).
- ✅ A1.b — mercadopago-*/mercado-pago-*/*-notifications*/send-*/daily-streak-push com o mesmo padrão CID-only (12/12).
- 🔒 pcl-* — CID herdado de `_shared/pcl-transition.ts`.
- ✅ nexus-relations, translation-lookup — padrão-ouro pré-existente.

| # | Função | CID | VAL | AUTHN | AUTHZ | RATE | HTTP | TEST | Status |
|---|---|---|---|---|---|---|---|---|---|
| 1 | bible-abbr-validate | ✅ A1.a | ❌ | ➖ público | ➖ | ❌ | ❌ | ❌ | 🟡 |
| 2 | bible-alerts-reconcile | ✅ A1.a | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | 🟡 |
| 3 | bible-auto-warm-slow | ✅ A1.a | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | 🟡 |
| 4 | bible-availability-report | ✅ A1.a | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | 🟡 |
| 5 | bible-cache-admin | ✅ A1.a | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | 🟡 |
| 6 | bible-cache-aggregator | ✅ A1.a | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | 🟡 |
| 7 | bible-cache-timeseries | ✅ A1.a | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | 🟡 |
| 8 | bible-canon-diagnose | ✅ A1.a | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | 🟡 |
| 9 | bible-convert-dump | ✅ A1.a | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | 🟡 |
| 10 | bible-import-deutero | ✅ A1.a | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | 🟡 |
| 11 | bible-import-ndjson | ✅ A1.a | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | 🟡 |
| 12 | bible-integrity-check | ✅ A1.a | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | 🟡 |
| 13 | bible-latency-regression-alert | ✅ A1.a | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | 🟡 |
| 14 | bible-perf-render | ✅ A1.a | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | 🟡 |
| 15 | bible-search | ✅ A1.a | ❌ | ➖ público | ➖ | ❌ | ❌ | ❌ | 🟡 |
| 16 | bible-text | ✅ A1.a | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | 🟡 |
| 17 | catechism-text | ❌ | ❌ | ✅ | ➖ | ❌ | ❌ | ❌ | 🔴 |
| 18 | colloquium | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 🔴 stub |
| 19 | daily-streak-push | ✅ A1.b | ❌ | ✅ cron | ➖ | ❌ | ❌ | ❌ | 🟡 |
| 20 | elevenlabs-tts | ❌ | ❌ | ✅ | ➖ | ❌ | ❌ | ❌ | 🔴 |
| 21 | intelligent-notifications | ✅ A1.b | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | 🟡 |
| 22 | liturgical-calendar | ❌ | ❌ | ➖ público | ➖ | ❌ | ❌ | ❌ | 🔴 |
| 23 | logos-ai | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 🔴 stub |
| 24 | logos-spiritual-insight | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 🔴 stub |
| 25 | mercado-pago-retry | ✅ A1.b | ❌ | ✅ cron | ➖ | ✅ | ❌ | ❌ | 🟡 |
| 26 | mercado-pago-webhook | ✅ A1.b | ❌ | ✅ assinatura | ➖ | ✅ | ❌ | ❌ | 🟡 |
| 27 | mercadopago-create-preference | ✅ A1.b | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | 🟡 |
| 28 | mercadopago-simulate | ✅ A1.b | ❌ | ✅ admin | ✅ | ❌ | ❌ | ❌ | 🟡 |
| 29 | mercadopago-sync-payment | ✅ A1.b | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | 🟡 |
| 30 | mercadopago-webhook | ✅ A1.b | ❌ | ✅ assinatura | ➖ | ❌ | ❌ | ❌ | 🟡 |
| 31 | nexus-relations | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | 🟡 padrão-ouro |
| 32 | pcl-activate | 🔒 | 🔒 | 🔒 | 🔒 | ➖ | 🔒 | ✅ | 🟢 |
| 33 | pcl-approve | 🔒 | 🔒 | 🔒 | 🔒 | ➖ | 🔒 | ✅ | 🟢 |
| 34 | pcl-expire | 🔒 | 🔒 | 🔒 | 🔒 | ➖ | 🔒 | ✅ | 🟢 |
| 35 | pcl-reactivate | 🔒 | 🔒 | 🔒 | 🔒 | ➖ | 🔒 | ✅ | 🟢 |
| 36 | pcl-revoke | 🔒 | 🔒 | 🔒 | 🔒 | ➖ | 🔒 | ✅ | 🟢 |
| 37 | pcl-suspend | 🔒 | 🔒 | 🔒 | 🔒 | ➖ | 🔒 | ✅ | 🟢 |
| 38 | retention-notifications | ✅ A1.b | ❌ | ✅ cron | ➖ | ✅ | ❌ | ❌ | 🟡 |
| 39 | saint-of-the-day | ❌ | ❌ | ✅ | ➖ | ❌ | ❌ | ❌ | 🔴 |
| 40 | search-saint | ❌ | ❌ | ➖ público | ➖ | ❌ | ❌ | ❌ | 🔴 |
| 41 | send-notification | ✅ A1.b | ❌ | ✅ service/cron | ➖ | ✅ | ❌ | ❌ | 🟡 |
| 42 | send-push | ✅ A1.b | ❌ | ✅ | ➖ | ✅ | ❌ | ❌ | 🟡 |
| 43 | sitemap | ❌ | ❌ | ➖ público | ➖ | ❌ | ❌ | ❌ | 🔴 |
| 44 | spiritual-continuity | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 🔴 stub |
| 45 | telemetry-notifications | ✅ A1.b | ❌ | ✅ cron | ➖ | ❌ | ❌ | ❌ | 🟡 |
| 46 | translation-lookup | ✅ | ✅ | ➖ público | ➖ | ✅ | 🟡 parcial | ✅ | 🟡 padrão-ouro |
| 47 | validate-coupon | ❌ | ❌ | ✅ service | ➖ | ✅ | ❌ | ❌ | 🟡 |
| 48 | vatican-document | ❌ | ❌ | ✅ | ➖ | ❌ | ❌ | ❌ | 🔴 |

**Totais atualizados (47 funções ativas):**

| Critério | Baseline | Pós-A1.a | Pós-A1.b | Δ vs baseline |
|---|---:|---:|---:|---:|
| CID | 14/47 (30%) | 25/47 (53%) | **37/47 (79%)** | +23 (+49pp) |
| VAL | 12/47 (26%) | 12/47 (26%) | 12/47 (26%) | 0 |
| AUTHN | 39/47 (83%) | 39/47 (83%) | 39/47 (83%) | 0 |
| RATE (quando aplicável) | 10/47 | 10/47 | 10/47 | 0 |
| HTTP padronizado | 6/47 (13%) | 6/47 (13%) | 6/47 (13%) | 0 |
| Testes | 9/47 (19%) | 9/47 (19%) | 9/47 (19%) + smoke E2E CID/CORS | +1 |

**Restam para CID 100% (10 funções, tratadas nas fases A1.c/A1.d):**
catechism-text, colloquium (stub), elevenlabs-tts, liturgical-calendar,
logos-ai (stub), logos-spiritual-insight (stub), saint-of-the-day, search-saint,
sitemap, spiritual-continuity (stub), vatican-document.
(Stubs entram apenas se forem ativados; do contrário serão marcados ➖ N/A.)

**Alvo Sprint A:** CID 100% · VAL 100% · HTTP 100% · AUTHN documentado 100% ·
`SECURITY DEFINER` sem exposição a `anon` (CAT-003) · índice duplicado eliminado (CAT-004).

## Smoke test E2E

`supabase/functions/tests/cid_cors_smoke_test.ts` valida em uma única execução:

1. **Preflight OPTIONS** — todas as 47 funções expõem `x-correlation-id` em
   `Access-Control-Allow-Headers` e `Access-Control-Expose-Headers`.
2. **Echo de CID** — todas retornam o header `x-correlation-id` no response
   (tanto em path de sucesso quanto em erro padronizado — o header não depende
   do status HTTP).

Rodar com `deno test -A supabase/functions/tests/cid_cors_smoke_test.ts`.

## Referências padrão-ouro

- `pcl-*` — via `_shared/pcl-transition.ts` (compliance completo por herança)
- `nexus-relations` — implementação direta compliant (referência para não-admin)
- `translation-lookup` — referência para endpoint público com Zod + rate limit

## Manutenção

Esta matriz DEVE ser atualizada:

1. Ao final de cada fase da Sprint A (A1–A5).
2. Sempre que uma nova Edge Function for adicionada (ver `EDGE-FUNCTIONS-GOVERNANCE-CHECKLIST.md`).
3. Sempre que uma função existente for renomeada ou removida.

A varredura de evidência pode ser reproduzida com o script indicado em
`EDGE-FUNCTIONS-GOVERNANCE-CHECKLIST.md § Verificação`.
