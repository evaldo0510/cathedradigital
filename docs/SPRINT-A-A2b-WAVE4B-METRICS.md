# Relatório Consolidado — Sprint A CAT-002

_Homologação Wave 4b · 2026-07-14 · fecha a padronização do envelope estrito
para todas as Edge Functions candidatas._

## Resumo consolidado (baseline pré-Sprint A × pós-Wave 4b)

| Métrica                              |          Antes |            Depois |
| ------------------------------------ | -------------: | ----------------: |
| Edge Functions totais                |             47 |                47 |
| CID (`x-correlation-id` ecoado)      | 14 / 47 (30 %) | **47 / 47 (100 %)** |
| Envelope estrito (`ErrorEnvelopeSchema.strict`) |   0 / 47 (0 %) | **28 / 47 (59,6 %)** |
| Zod (validação de entrada)           |  12 / 47 (26 %) |  12 / 47 (26 %) † |
| Testes de contrato dedicados         |              1 |                 7 |
| Regressões observadas                |              0 |                 0 |

† Zod continua fora do escopo desta Sprint (fase A2.a limitada às funções
auditadas). A ampliação está prevista para as fases A3–A5.

## Distribuição do envelope estrito por onda

| Onda   | Funções                                                                                                                                                                     | Data       |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| A2.a   | `pcl-activate`, `pcl-approve`, `pcl-expire`, `pcl-reactivate`, `pcl-revoke`, `pcl-suspend`, `nexus-relations` (7)                                                            | 2026-07-13 |
| A2.b W1 | `sitemap`, `saint-of-the-day`, `search-saint`, `liturgical-calendar`, `vatican-document` (5)                                                                                | 2026-07-13 |
| A2.b W2 | `cid-trail`, `cid-compliance-stats`, `bible-abbr-validate` (3)                                                                                                              | 2026-07-14 |
| A2.b W3 | `send-notification`, `send-push`, `daily-streak-push`, `retention-notifications`, `telemetry-notifications`, `intelligent-notifications`, `spiritual-continuity` (7)         | 2026-07-14 |
| A2.b W4a | `bible-integrity-check`, `bible-perf-render`, `bible-convert-dump`, `bible-latency-regression-alert`, `bible-alerts-reconcile`, `bible-availability-report` (6)              | 2026-07-14 |
| A2.b W4b | `bible-cache-admin`, `bible-cache-aggregator`, `bible-cache-timeseries`, `bible-canon-diagnose`, `bible-import-ndjson` (5) — **wave homologada nesta rodada**                | 2026-07-14 |

**Total refatorado:** 33 funções em ondas · **28 com envelope estrito verdadeiro**
· 5 sem branches de erro (`bible-auto-warm-slow`, `bible-import-deutero`
mais os 3 stubs `logos-ai`/`logos-spiritual-insight`/`colloquium`).

## Exceções justificadas (permanecem fora do envelope estrito)

Documentadas em `EDGE-FUNCTIONS-STRICT-ENVELOPE-MATRIX.md § Exceções permanentes`.
Todas ecoam `x-correlation-id` no header (gate mínimo `edge-cid-smoke`).

| # | Função                          | Motivo arquitetural                                                                                     |
| -:| ------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 1 | `bible-text`                    | `BibleTextErrorSchema` publicado (`reason`, `received_abbrev`, `correlationId` camelCase)               |
| 2 | `bible-text` (400)              | `BibleTextInvalidPayloadSchema` versionado                                                              |
| 3 | `mercadopago-webhook`           | HTTP 200 obrigatório mesmo em erro lógico (MP retry-loop se não-2xx)                                    |
| 4 | `mercado-pago-webhook`          | idem                                                                                                    |
| 5 | `mercadopago-create-preference` | Envelope de domínio `{ preferenceId?, error?, cause? }` consumido pelo checkout                         |
| 6 | `mercadopago-simulate`          | Backoffice, payload estruturado por operação                                                            |
| 7 | `mercadopago-sync-payment`      | idem                                                                                                    |
| 8 | `mercado-pago-retry`            | idem                                                                                                    |
| 9 | `bible-search`                  | `{results}` + 400 `{error: msg}` legacy — descongelamento em S5                                         |
| 10 | `elevenlabs-tts`               | Retorna `audio/mpeg` bruto — não é JSON                                                                 |
| 11 | `logos-ai`                     | Streaming SSE / `structured_response` consumido pela IA UI                                              |
| 12 | `logos-spiritual-insight`      | idem                                                                                                    |
| 13 | `colloquium`                   | idem                                                                                                    |
| 14 | `catechism-text`               | Contrato próprio de conteúdo cache-first                                                                |
| 15 | `translation-lookup`           | Envelope legado `{translations, source}`                                                                |
| 16 | `validate-coupon`              | Envelope `{valid, reason, discount}` consumido pelo checkout                                            |
| 17 | `bible-abbr-validate` (404)    | `{ resolved: false, input, normalized, canonical_abbr: null, ... }` — 400/405 seguem envelope estrito   |
| 18 | `bible-auto-warm-slow`         | Só caminho de sucesso/verify (200 ou 422 pós-verify) — sem branches de erro dedicados                   |
| 19 | `bible-import-deutero`         | idem — resposta única condicionada a pós-verify                                                         |

**Registro de changelog (Wave 4a):** `bible-convert-dump` migrou os campos
`stats` e `sample_rejections` do topo do body de erro 422 para
`details.stats` / `details.sample_rejections`, conforme o novo contrato
estrito. Consumidor único (`src/pages/BibleImportAdmin.tsx`) lê apenas
`error.message` do wrapper — não houve breaking change funcional.

## Regressões

Nenhuma regressão observada nas 6 ondas. Workflows verdes:

- `edge-cid-smoke` (preflight + eco de CID em 47 funções)
- `cid_header_variations` (ausente, vazio, duplicado, ≤128, >128)
- `cid_concurrency` (sem cross-talk de CID)
- `cid_zod_envelope` (7 auditadas)
- `cid_strict_wave{1,2,3,4a,4b}` (28 funções cobertas)

## Próximas fases previstas na Sprint A

- **A3** — `SECURITY DEFINER` sem exposição a `anon` (CAT-003) + criação
  formal da **Allowlist de SECURITY DEFINER Públicas** discutida na
  homologação de A0.
- **A4** — Eliminação de índice duplicado (CAT-004).
- **A5** — HTTP padronizado (`_shared/http-response.ts`) adotado por 100 %
  das 47 funções, incluindo respostas de sucesso.
- **A6** — Zod (`_shared/validation.ts`) obrigatório em todo endpoint com
  entrada de cliente.
