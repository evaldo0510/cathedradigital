# Matriz de Conformidade — Edge Functions

**Sprint A (Governança) · v1.1 · atualizada 2026-07-13 (pós-A1.a)**
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

## Baseline (pré-Sprint A)

| # | Função | CID | VAL | AUTHN | AUTHZ | RATE | HTTP | TEST | Status |
|---|---|---|---|---|---|---|---|---|---|
| 1 | bible-abbr-validate | ✅ A1.a | ❌ | ➖ público | ➖ | ❌ | ❌ | ❌ | 🟡 |
| 2 | bible-alerts-reconcile | ✅ A1.a | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | 🟡 |
| 3 | bible-auto-warm-slow | ✅ A1.a | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | 🟡 |
| 4 | bible-availability-report | ✅ A1.a | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | 🟡 |
| 5 | bible-cache-admin | ✅ A1.a | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | 🟡 |
| 6 | bible-cache-aggregator | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | 🟡 |
| 7 | bible-cache-timeseries | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | 🟡 |
| 8 | bible-canon-diagnose | ✅ A1.a | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | 🟡 |
| 9 | bible-convert-dump | ✅ A1.a | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | 🟡 |
| 10 | bible-import-deutero | ✅ A1.a | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | 🟡 |
| 11 | bible-import-ndjson | ✅ A1.a | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | 🟡 |
| 12 | bible-integrity-check | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | 🟡 |
| 13 | bible-latency-regression-alert | ✅ A1.a | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | 🟡 |
| 14 | bible-perf-render | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | 🟡 |
| 15 | bible-search | ✅ A1.a | ❌ | ➖ público | ➖ | ❌ | ❌ | ❌ | 🟡 |
| 16 | bible-text | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | 🟡 |
| 17 | catechism-text | ❌ | ❌ | ✅ | ➖ | ❌ | ❌ | ❌ | 🔴 |
| 18 | colloquium | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 🔴 stub |
| 19 | daily-streak-push | ❌ | ❌ | ✅ cron | ➖ | ❌ | ❌ | ❌ | 🔴 |
| 20 | elevenlabs-tts | ❌ | ❌ | ✅ | ➖ | ❌ | ❌ | ❌ | 🔴 |
| 21 | intelligent-notifications | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | 🟡 |
| 22 | liturgical-calendar | ❌ | ❌ | ➖ público | ➖ | ❌ | ❌ | ❌ | 🔴 |
| 23 | logos-ai | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 🔴 stub |
| 24 | logos-spiritual-insight | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 🔴 stub |
| 25 | mercado-pago-retry | ❌ | ❌ | ✅ cron | ➖ | ✅ | ❌ | ❌ | 🟡 |
| 26 | mercado-pago-webhook | ❌ | ❌ | ✅ assinatura | ➖ | ✅ | ❌ | ❌ | 🟡 |
| 27 | mercadopago-create-preference | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | 🟡 |
| 28 | mercadopago-simulate | ❌ | ❌ | ✅ admin | ✅ | ❌ | ❌ | ❌ | 🔴 |
| 29 | mercadopago-sync-payment | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | 🟡 |
| 30 | mercadopago-webhook | ❌ | ❌ | ✅ assinatura | ➖ | ❌ | ❌ | ❌ | 🔴 |
| 31 | nexus-relations | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | 🟡 padrão-ouro |
| 32 | pcl-activate | 🔒 | 🔒 | 🔒 | 🔒 | ➖ | 🔒 | ✅ | 🟢 |
| 33 | pcl-approve | 🔒 | 🔒 | 🔒 | 🔒 | ➖ | 🔒 | ✅ | 🟢 |
| 34 | pcl-expire | 🔒 | 🔒 | 🔒 | 🔒 | ➖ | 🔒 | ✅ | 🟢 |
| 35 | pcl-reactivate | 🔒 | 🔒 | 🔒 | 🔒 | ➖ | 🔒 | ✅ | 🟢 |
| 36 | pcl-revoke | 🔒 | 🔒 | 🔒 | 🔒 | ➖ | 🔒 | ✅ | 🟢 |
| 37 | pcl-suspend | 🔒 | 🔒 | 🔒 | 🔒 | ➖ | 🔒 | ✅ | 🟢 |
| 38 | retention-notifications | ❌ | ❌ | ✅ cron | ➖ | ✅ | ❌ | ❌ | 🟡 |
| 39 | saint-of-the-day | ❌ | ❌ | ✅ | ➖ | ❌ | ❌ | ❌ | 🔴 |
| 40 | search-saint | ❌ | ❌ | ➖ público | ➖ | ❌ | ❌ | ❌ | 🔴 |
| 41 | send-notification | ❌ | ❌ | ✅ service/cron | ➖ | ✅ | ❌ | ❌ | 🟡 |
| 42 | send-push | ❌ | ❌ | ✅ | ➖ | ✅ | ❌ | ❌ | 🟡 |
| 43 | sitemap | ❌ | ❌ | ➖ público | ➖ | ❌ | ❌ | ❌ | 🔴 |
| 44 | spiritual-continuity | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 🔴 stub |
| 45 | telemetry-notifications | ❌ | ❌ | ✅ cron | ➖ | ❌ | ❌ | ❌ | 🔴 |
| 46 | translation-lookup | ✅ | ✅ | ➖ público | ➖ | ✅ | 🟡 parcial | ✅ | 🟡 padrão-ouro |
| 47 | validate-coupon | ❌ | ❌ | ✅ service | ➖ | ✅ | ❌ | ❌ | 🟡 |
| 48 | vatican-document | ❌ | ❌ | ✅ | ➖ | ❌ | ❌ | ❌ | 🔴 |

**Totais baseline (47 funções ativas, excluindo `_shared/` e `tests/`):**

| Critério | Conforme | % |
|---|---|---|
| CID | 14/47 | 30% |
| VAL | 12/47 | 26% |
| AUTHN | 39/47 | 83% |
| RATE (quando aplicável) | 10/47 | 21% |
| HTTP padronizado | 6/47 | 13% |
| Testes | 9/47 | 19% |

**Alvo Sprint A:** CID 100% · VAL 100% · HTTP 100% · AUTHN documentado 100% ·
`SECURITY DEFINER` sem exposição a `anon` (CAT-003) · índice duplicado eliminado (CAT-004).

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
