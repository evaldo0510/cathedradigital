# Matriz de Conformidade — Edge Functions

**Sprint A (Governança) · v1.7 · atualizada 2026-07-13 (A2.b Wave 1 — envelope estrito em sitemap, saint-of-the-day, search-saint, liturgical-calendar, vatican-document + matriz de exceções documentada)**
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

## Status atual (pós-A1.c CID-only 100%)

**Convenção CID:**
- ✅ A1.a — bible-* padronizado com `getOrCreateCorrelationId` + shadowing de `corsHeaders` (16/16).
- ✅ A1.b — mercadopago-*/mercado-pago-*/*-notifications*/send-*/daily-streak-push (12/12).
- ✅ A1.c — catechism-text, elevenlabs-tts, liturgical-calendar, saint-of-the-day,
  sitemap, vatican-document + stubs frozen (colloquium, logos-ai, logos-spiritual-insight,
  search-saint, spiritual-continuity) — todos com CID + logger correlacionado (11/11).
- 🔒 pcl-* — CID herdado de `_shared/pcl-transition.ts`.
- ✅ nexus-relations, translation-lookup — padrão-ouro pré-existente.
- 🧭 Helper `_shared/logger.ts` emite JSON com `correlation_id`,
  amarrando log-lines ao header e ao trigger `capture_governance_audit`.

**Fase A1.d — Trilha, gate e relatório (2026-07-13):**
- ✅ Novo teste `tests/cid_error_scenarios_test.ts` — força falhas 4xx/5xx
  por categoria (bible / pcl / mercadopago / notifications / misc / geração
  automática) e valida presença/eco de `x-correlation-id` no response.
- ✅ RPC `public.get_correlation_trail(text)` (SECURITY DEFINER, admin-only)
  unifica `governance_audit_log` + `bible_cache_metric_events` por CID,
  sem tabela nova. Migration `20260713…get_correlation_trail_rpc`.
- ✅ Gate reformulado `tests/cid_governance_gate_test.ts` — restrito às **7
  funções que mutam tabelas auditadas** (`pcl-activate/approve/expire/
  reactivate/revoke/suspend`, `nexus-relations`). Requer
  `SUPABASE_SERVICE_ROLE_KEY` (skip automático se ausente).
- ✅ Relatório de conformidade `scripts/generate-cid-compliance-report.ts`
  gera `artifacts/cid-compliance-report.{md,json}` no CI, anexado como
  artefato do workflow `edge-cid-smoke` (`always()`).

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
| 17 | catechism-text | ✅ A1.c | ❌ | ✅ | ➖ | ❌ | ❌ | ❌ | 🟡 |
| 18 | colloquium | ✅ A1.c | ➖ frozen | ➖ | ➖ | ➖ | ➖ | ❌ | 🟢 stub |
| 19 | daily-streak-push | ✅ A1.b | ❌ | ✅ cron | ➖ | ❌ | ❌ | ❌ | 🟡 |
| 20 | elevenlabs-tts | ✅ A1.c | ❌ | ✅ | ➖ | ❌ | ❌ | ❌ | 🟡 |
| 21 | intelligent-notifications | ✅ A1.b | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | 🟡 |
| 22 | liturgical-calendar | ✅ A1.c | ❌ | ➖ público | ➖ | ❌ | ❌ | ❌ | 🟡 |
| 23 | logos-ai | ✅ A1.c | ➖ frozen | ➖ | ➖ | ➖ | ➖ | ❌ | 🟢 stub |
| 24 | logos-spiritual-insight | ✅ A1.c | ➖ frozen | ➖ | ➖ | ➖ | ➖ | ❌ | 🟢 stub |
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
| 39 | saint-of-the-day | ✅ A1.c | ❌ | ✅ | ➖ | ❌ | ❌ | ❌ | 🟡 |
| 40 | search-saint | ✅ A1.c | ➖ frozen | ➖ | ➖ | ➖ | ➖ | ❌ | 🟢 stub |
| 41 | send-notification | ✅ A1.b | ❌ | ✅ service/cron | ➖ | ✅ | ❌ | ❌ | 🟡 |
| 42 | send-push | ✅ A1.b | ❌ | ✅ | ➖ | ✅ | ❌ | ❌ | 🟡 |
| 43 | sitemap | ✅ A1.c | ➖ | ➖ público | ➖ | ❌ | ❌ | ❌ | 🟡 |
| 44 | spiritual-continuity | ✅ A1.c | ➖ frozen | ➖ | ➖ | ➖ | ➖ | ❌ | 🟢 stub |
| 45 | telemetry-notifications | ✅ A1.b | ❌ | ✅ cron | ➖ | ❌ | ❌ | ❌ | 🟡 |
| 46 | translation-lookup | ✅ | ✅ | ➖ público | ➖ | ✅ | 🟡 parcial | ✅ | 🟡 padrão-ouro |
| 47 | validate-coupon | ❌ | ❌ | ✅ service | ➖ | ✅ | ❌ | ❌ | 🟡 |
| 48 | vatican-document | ✅ A1.c | ❌ | ✅ | ➖ | ❌ | ❌ | ❌ | 🟡 |

**Totais atualizados (47 funções ativas):**

| Critério | Baseline | Pós-A1.a | Pós-A1.b | Pós-A1.c | Δ vs baseline |
|---|---:|---:|---:|---:|---:|
| CID | 14/47 (30%) | 25/47 (53%) | 37/47 (79%) | **47/47 (100%)** ✅ | +33 (+70pp) |
| VAL | 12/47 (26%) | 12/47 (26%) | 12/47 (26%) | 12/47 (26%) | 0 |
| AUTHN | 39/47 (83%) | 39/47 (83%) | 39/47 (83%) | 39/47 (83%) | 0 |
| RATE (quando aplicável) | 10/47 | 10/47 | 10/47 | 10/47 | 0 |
| HTTP padronizado | 6/47 (13%) | 6/47 (13%) | 6/47 (13%) | 6/47 (13%) | 0 |
| Testes | 9/47 (19%) | 9/47 (19%) | 9/47 (19%) + smoke | 9/47 (19%) + smoke 3× | +1 |

**CAT-001 (CID) — CONCLUÍDO.** Restam para Sprint A:
VAL (Zod) — fase A2 · HTTP padronizado — fase A5 · `SECURITY DEFINER` — fase A3 ·
índice duplicado (CAT-004).

**Alvo Sprint A:** CID 100% ✅ · VAL 100% · HTTP 100% · AUTHN documentado 100% ·
`SECURITY DEFINER` sem exposição a `anon` (CAT-003) · índice duplicado eliminado (CAT-004).

## Smoke test E2E

`supabase/functions/tests/cid_cors_smoke_test.ts` — CI: `.github/workflows/edge-cid-smoke.yml`
(fail-on-red em PR e push). Valida em uma execução:

1. **Preflight OPTIONS** — todas as 47 funções expõem `x-correlation-id` em
   `Access-Control-Allow-Headers` e `Access-Control-Expose-Headers`.
2. **Echo com header** — quando o cliente envia `x-correlation-id`, o mesmo valor
   é ecoado no response (sucesso ou erro padronizado).
3. **Geração sem header** — quando o cliente NÃO envia, a função gera um cid
   válido (`^[A-Za-z0-9._:-]{1,128}$`) e o retorna no response.

Rodar local: `deno test -A supabase/functions/tests/cid_cors_smoke_test.ts`
(carrega credenciais do `.env` via `std/dotenv/load.ts`).

**Fase A1.e (2026-07-13) — cobertura ampliada:**
- ✅ `tests/cid_header_variations_test.ts` — cobre `x-correlation-id` **ausente**,
  **vazio**, **duplicado** (append) e **tamanhos extremos** (128 OK / >128 substituído).
- ✅ Relatório `scripts/generate-cid-compliance-report.ts` v2 — contagem por
  função **e por categoria** (bible/pcl/mercadopago/nexus/ai/notifications/content/misc),
  com destaque de **etapas em falha** (CID, VAL, HTTP, TEST). Gera também
  `cid-compliance-summary.md` (usado no PR comment).
- ✅ Workflow `edge-cid-smoke.yml` posta o resumo como **comentário sticky** no PR
  (idempotente via marcador `<!-- cid-compliance-report -->`) e anexa o relatório
  completo como artefato `cid-compliance-report` (30 dias).
- ✅ RPC `public.get_correlation_trail(_cid, _include_responses boolean default false)` —
  modo estendido agrega `core_audit_logs` (status_code/response), `bible_cache_alerts`
  e `bible_integrity_reports`, permitindo depurar a jornada completa do CID.

**Fase A2.a (2026-07-13) — Zod nas funções auditadas:**
- ✅ pcl-* (6) usam Zod via `_shared/pcl-transition.ts` (`BaseBody` com
  `source_id: uuid` e `reason: string.min(1).max(4000).optional()`).
- ✅ `nexus-relations` usa Zod local (`RefKind`, `RelationInput`, `RelationPatch`).
- ✅ Novo `tests/cid_zod_envelope_test.ts` no CI — força payload inválido em cada
  função auditada e valida: 4xx, `Content-Type: application/json`, header
  `x-correlation-id` ecoado e body com `error` string + `correlation_id == CID enviado`.


## Logging correlacionado

`supabase/functions/_shared/logger.ts` (`makeLogger(fn, cid)`) emite JSON estruturado
com `correlation_id`, timestamp e nível. Toda função migrada nas fases A1.a/b/c
usa este logger nos caminhos de erro/aviso, permitindo:

- Rastreio ponta a ponta: `x-correlation-id` (client) → log line (edge) →
  `governance_audit_log.correlation_id` (banco, via `capture_governance_audit`).
- Correlação com o dashboard `bible_cache_metric_events.correlation_id`
  (já existente em bible-*).

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
