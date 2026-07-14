# Matriz — ErrorEnvelopeSchema.strict() nas Edge Functions

_Documento vivo. Última atualização: 2026-07-14 — Fase A2.b Wave 4a._

## Contrato canônico

Envelope de erro validado por `_shared/error-envelope-schema.ts`
(`ErrorEnvelopeSchema.strict()`):

```json
{ "error": "invalid_body", "correlation_id": "...", "details": { ... } }
```

- `error`: string (idealmente um dos códigos estáveis em `ERROR_CODES`).
- `correlation_id`: eco exato do `x-correlation-id` recebido.
- `details`: opcional, qualquer JSON.
- **Sem campos extras** (`meta`, `frozen`, `reason`, etc. proibidos no topo).

## Roll-out em ondas

| Onda | Escopo | Status |
|------|--------|--------|
| A2.a | Funções auditadas — 7 (pcl-* + nexus-relations) | ✅ concluída |
| A2.b Wave 1 | `sitemap`, `saint-of-the-day`, `search-saint`, `liturgical-calendar`, `vatican-document` | ✅ concluída (2026-07-13) |
| A2.b Wave 2 | Diagnóstico/telemetria: `cid-trail`, `cid-compliance-stats`, `bible-abbr-validate` (400/405) | ✅ concluída (2026-07-14) |
| A2.b Wave 3 | Notificações / stubs: `send-notification`, `send-push`, `daily-streak-push`, `retention-notifications`, `telemetry-notifications`, `intelligent-notifications`, `spiritual-continuity` | ✅ concluída (2026-07-14) |
| A2.b Wave 4a | Ferramentas de manutenção Bíblia (lote 1, ≤175 linhas): `bible-integrity-check`, `bible-perf-render`, `bible-convert-dump`, `bible-latency-regression-alert`, `bible-alerts-reconcile`, `bible-availability-report`. `bible-auto-warm-slow` sem branches de erro — CID-only compliance. | ✅ concluída (2026-07-14) |
| A2.b Wave 4b | Ferramentas de manutenção Bíblia (lote 2, ≥220 linhas): `bible-cache-admin`, `bible-cache-aggregator`, `bible-cache-timeseries`, `bible-canon-diagnose`, `bible-import-deutero`, `bible-import-ndjson` | ⏳ planejada |
| A2.b Wave 5 | Domínios com contrato próprio publicado — **exceções documentadas** | 🚫 permanecem com envelope custom |

## Exceções permanentes (contrato de domínio publicado)

Estas funções NÃO adotam o envelope estrito no corpo do erro porque possuem
schema Zod próprio consumido pelo frontend / integrações externas. Elas seguem
propagando `x-correlation-id` no header e mantêm seu próprio schema versionado.

| Função | Contrato de erro | Motivo |
|--------|------------------|--------|
| `bible-text` | `BibleTextErrorSchema` (`src/shared/bibleTextSchema.ts`) — campos `error`, `reason`, `received_abbrev`, `correlationId` (camelCase) | Consumido por `describeBibleTextError()` e testes E2E de UI. |
| `bible-text` (400) | `BibleTextInvalidPayloadSchema` | Contrato Zod versionado. |
| `mercadopago-webhook` / `mercado-pago-webhook` | Payload compatível com Mercado Pago (200 obrigatório mesmo em erro lógico) | Requisito da integração — MP retry-loop se não-2xx. |
| `mercadopago-create-preference` | Envelope de domínio `{ preferenceId?, error?, cause? }` | Consumido diretamente pelo checkout. |
| `mercadopago-simulate` / `mercadopago-sync-payment` / `mercado-pago-retry` | Ferramentas internas — payload estruturado por operação | Backoffice, sem envelope único. |
| `bible-search` | Retorna `{results}` — 400 com `{error: msg}` legacy | Congelado até S5. |
| `elevenlabs-tts` | Retorna `audio/mpeg` bruto | Não é JSON. |
| `logos-ai` / `logos-spiritual-insight` / `colloquium` | Streaming SSE / envelopes ricos com `structured_response` | Contrato consumido pela IA UI. |
| `catechism-text` | Cache-first, contrato próprio de conteúdo | — |
| `translation-lookup` | Envelope legado `{translations, source}` | — |
| `validate-coupon` | Envelope `{valid, reason, discount}` | Consumido pelo checkout. |
| `bible-abbr-validate` (404) | `{ resolved: false, input, normalized, canonical_abbr: null, ... }` | Consumido por diagnóstico do canon — 400/405 seguem envelope estrito. |

## Header obrigatório em TODAS as funções

Independentemente do envelope (estrito ou de domínio), **toda** função deve:

1. Chamar `getOrCreateCorrelationId(req)` e ecoar no header `x-correlation-id`.
2. Incluir `x-correlation-id` em `Access-Control-Expose-Headers`.
3. Registrar `correlationId` em todos os logs estruturados.

Esse é o gate mínimo verificado pelo workflow `edge-cid-smoke` — as exceções da
tabela acima **não** liberam a função do CID: só liberam o formato do body.

## Testes de contrato

| Suíte | Escopo |
|-------|--------|
| `cid_zod_envelope_test.ts` | 7 funções auditadas (A2.a) — envelope estrito |
| `cid_strict_wave1_test.ts` | 5 funções da Wave 1 — envelope estrito |
| `cid_strict_wave2_test.ts` | `cid-trail`, `cid-compliance-stats`, `bible-abbr-validate` — envelope estrito |
| `cid_strict_wave3_test.ts` | 7 funções de notificação/telemetria — envelope estrito + concorrência de CID |
| `cid_header_variations_test.ts` | Todas — propagação de CID em variações de header |
| `cid_concurrency_test.ts` | Todas — sem mistura de CID em requests paralelas |
| `bible-text-error-schema.spec.ts` (Playwright) | Contrato de domínio `bible-text` |

## Como adicionar uma função a uma nova onda

1. Refatorar branches de erro para `makeResponder(cid).error(status, code, details?)`.
2. Preservar branches de **sucesso** com seu contrato de domínio (via `R.raw` ou `Response` direta com header CID).
3. Adicionar o nome da função ao array `WAVE_N` do teste correspondente.
4. Rodar `deno test -A supabase/functions/tests/cid_strict_waveN_test.ts` antes do commit.
5. Se a função tiver contrato de erro publicado → mover para **Exceções permanentes** e justificar.
