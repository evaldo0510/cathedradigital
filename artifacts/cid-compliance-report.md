# Relatório de conformidade CID — Edge Functions

- **Gerado em:** `2026-07-13T21:31:45.038Z`
- **Fonte:** `docs/EDGE-FUNCTIONS-COMPLIANCE-MATRIX.md`
- **Total de funções:** **48**
- **Cobertura CID:** **97.9%**
- **Resultado:** 🔴 FALHOU

## Contagem por dimensão

| Dimensão | ✅ conforme | 🔒 herdado | ➖ N/A | ❌ ausente | ⚠️ ? |
|---|---:|---:|---:|---:|---:|
| CID (CAT-001) | 41 | 6 | 0 | 1 | 0 |
| Validação Zod (CAT-002) | 5 | 6 | 6 | 31 | 0 |
| HTTP padronizado (CAT-008) | 0 | 6 | 5 | 36 | 1 |
| Cobertura E2E | 9 | 0 | 0 | 39 | 0 |

## Contagem por categoria

| Categoria | Total | CID OK | Com falha |
|---|---:|---:|---:|
| ai | 4 | 4 | 4 |
| bible | 16 | 16 | 16 |
| content | 9 | 8 | 8 |
| mercadopago | 6 | 6 | 6 |
| nexus | 1 | 1 | 1 |
| notifications | 6 | 6 | 6 |
| pcl | 6 | 6 | 0 |

## ⚠️ Funções com etapas em falha (41)

| Função | Categoria | Etapas em falha |
|---|---|---|
| `bible-abbr-validate` | bible | Validação Zod, Resposta HTTP padronizada, Cobertura E2E |
| `bible-alerts-reconcile` | bible | Validação Zod, Resposta HTTP padronizada, Cobertura E2E |
| `bible-auto-warm-slow` | bible | Validação Zod, Resposta HTTP padronizada, Cobertura E2E |
| `bible-availability-report` | bible | Validação Zod, Resposta HTTP padronizada, Cobertura E2E |
| `bible-cache-admin` | bible | Validação Zod, Resposta HTTP padronizada, Cobertura E2E |
| `bible-cache-aggregator` | bible | Validação Zod, Resposta HTTP padronizada, Cobertura E2E |
| `bible-cache-timeseries` | bible | Validação Zod, Resposta HTTP padronizada, Cobertura E2E |
| `bible-canon-diagnose` | bible | Validação Zod, Resposta HTTP padronizada, Cobertura E2E |
| `bible-convert-dump` | bible | Validação Zod, Resposta HTTP padronizada, Cobertura E2E |
| `bible-import-deutero` | bible | Validação Zod, Resposta HTTP padronizada, Cobertura E2E |
| `bible-import-ndjson` | bible | Validação Zod, Resposta HTTP padronizada, Cobertura E2E |
| `bible-integrity-check` | bible | Validação Zod, Resposta HTTP padronizada, Cobertura E2E |
| `bible-latency-regression-alert` | bible | Validação Zod, Resposta HTTP padronizada, Cobertura E2E |
| `bible-perf-render` | bible | Resposta HTTP padronizada, Cobertura E2E |
| `bible-search` | bible | Validação Zod, Resposta HTTP padronizada, Cobertura E2E |
| `bible-text` | bible | Validação Zod, Resposta HTTP padronizada |
| `catechism-text` | content | Validação Zod, Resposta HTTP padronizada, Cobertura E2E |
| `colloquium` | ai | Cobertura E2E |
| `daily-streak-push` | notifications | Validação Zod, Resposta HTTP padronizada, Cobertura E2E |
| `elevenlabs-tts` | content | Validação Zod, Resposta HTTP padronizada, Cobertura E2E |
| `intelligent-notifications` | notifications | Validação Zod, Resposta HTTP padronizada, Cobertura E2E |
| `liturgical-calendar` | content | Validação Zod, Resposta HTTP padronizada, Cobertura E2E |
| `logos-ai` | ai | Cobertura E2E |
| `logos-spiritual-insight` | ai | Cobertura E2E |
| `mercado-pago-retry` | mercadopago | Validação Zod, Resposta HTTP padronizada, Cobertura E2E |
| `mercado-pago-webhook` | mercadopago | Validação Zod, Resposta HTTP padronizada, Cobertura E2E |
| `mercadopago-create-preference` | mercadopago | Resposta HTTP padronizada, Cobertura E2E |
| `mercadopago-simulate` | mercadopago | Validação Zod, Resposta HTTP padronizada, Cobertura E2E |
| `mercadopago-sync-payment` | mercadopago | Resposta HTTP padronizada, Cobertura E2E |
| `mercadopago-webhook` | mercadopago | Validação Zod, Resposta HTTP padronizada, Cobertura E2E |
| `nexus-relations` | nexus | Resposta HTTP padronizada |
| `retention-notifications` | notifications | Validação Zod, Resposta HTTP padronizada, Cobertura E2E |
| `saint-of-the-day` | content | Validação Zod, Resposta HTTP padronizada, Cobertura E2E |
| `search-saint` | content | Cobertura E2E |
| `send-notification` | notifications | Validação Zod, Resposta HTTP padronizada, Cobertura E2E |
| `send-push` | notifications | Validação Zod, Resposta HTTP padronizada, Cobertura E2E |
| `sitemap` | content | Resposta HTTP padronizada, Cobertura E2E |
| `spiritual-continuity` | ai | Cobertura E2E |
| `telemetry-notifications` | notifications | Validação Zod, Resposta HTTP padronizada, Cobertura E2E |
| `validate-coupon` | content | CID gerado/propagado, Validação Zod, Resposta HTTP padronizada, Cobertura E2E |
| `vatican-document` | content | Validação Zod, Resposta HTTP padronizada, Cobertura E2E |

## Detalhamento por função

| # | Função | Cat | CID | VAL | HTTP | TEST | Status |
|---|---|---|---|---|---|---|---|
| 1 | bible-abbr-validate | bible | ✅ A1.a | ❌ | ❌ | ❌ | 🟡 |
| 2 | bible-alerts-reconcile | bible | ✅ A1.a | ❌ | ❌ | ❌ | 🟡 |
| 3 | bible-auto-warm-slow | bible | ✅ A1.a | ❌ | ❌ | ❌ | 🟡 |
| 4 | bible-availability-report | bible | ✅ A1.a | ❌ | ❌ | ❌ | 🟡 |
| 5 | bible-cache-admin | bible | ✅ A1.a | ❌ | ❌ | ❌ | 🟡 |
| 6 | bible-cache-aggregator | bible | ✅ A1.a | ❌ | ❌ | ❌ | 🟡 |
| 7 | bible-cache-timeseries | bible | ✅ A1.a | ❌ | ❌ | ❌ | 🟡 |
| 8 | bible-canon-diagnose | bible | ✅ A1.a | ❌ | ❌ | ❌ | 🟡 |
| 9 | bible-convert-dump | bible | ✅ A1.a | ❌ | ❌ | ❌ | 🟡 |
| 10 | bible-import-deutero | bible | ✅ A1.a | ❌ | ❌ | ❌ | 🟡 |
| 11 | bible-import-ndjson | bible | ✅ A1.a | ❌ | ❌ | ❌ | 🟡 |
| 12 | bible-integrity-check | bible | ✅ A1.a | ❌ | ❌ | ❌ | 🟡 |
| 13 | bible-latency-regression-alert | bible | ✅ A1.a | ❌ | ❌ | ❌ | 🟡 |
| 14 | bible-perf-render | bible | ✅ A1.a | ✅ | ❌ | ❌ | 🟡 |
| 15 | bible-search | bible | ✅ A1.a | ❌ | ❌ | ❌ | 🟡 |
| 16 | bible-text | bible | ✅ A1.a | ❌ | ❌ | ✅ | 🟡 |
| 17 | catechism-text | content | ✅ A1.c | ❌ | ❌ | ❌ | 🟡 |
| 18 | colloquium | ai | ✅ A1.c | ➖ frozen | ➖ | ❌ | 🟢 stub |
| 19 | daily-streak-push | notifications | ✅ A1.b | ❌ | ❌ | ❌ | 🟡 |
| 20 | elevenlabs-tts | content | ✅ A1.c | ❌ | ❌ | ❌ | 🟡 |
| 21 | intelligent-notifications | notifications | ✅ A1.b | ❌ | ❌ | ❌ | 🟡 |
| 22 | liturgical-calendar | content | ✅ A1.c | ❌ | ❌ | ❌ | 🟡 |
| 23 | logos-ai | ai | ✅ A1.c | ➖ frozen | ➖ | ❌ | 🟢 stub |
| 24 | logos-spiritual-insight | ai | ✅ A1.c | ➖ frozen | ➖ | ❌ | 🟢 stub |
| 25 | mercado-pago-retry | mercadopago | ✅ A1.b | ❌ | ❌ | ❌ | 🟡 |
| 26 | mercado-pago-webhook | mercadopago | ✅ A1.b | ❌ | ❌ | ❌ | 🟡 |
| 27 | mercadopago-create-preference | mercadopago | ✅ A1.b | ✅ | ❌ | ❌ | 🟡 |
| 28 | mercadopago-simulate | mercadopago | ✅ A1.b | ❌ | ❌ | ❌ | 🟡 |
| 29 | mercadopago-sync-payment | mercadopago | ✅ A1.b | ✅ | ❌ | ❌ | 🟡 |
| 30 | mercadopago-webhook | mercadopago | ✅ A1.b | ❌ | ❌ | ❌ | 🟡 |
| 31 | nexus-relations | nexus | ✅ | ✅ | ❌ | ✅ | 🟡 padrão-ouro |
| 32 | pcl-activate | pcl | 🔒 | 🔒 | 🔒 | ✅ | 🟢 |
| 33 | pcl-approve | pcl | 🔒 | 🔒 | 🔒 | ✅ | 🟢 |
| 34 | pcl-expire | pcl | 🔒 | 🔒 | 🔒 | ✅ | 🟢 |
| 35 | pcl-reactivate | pcl | 🔒 | 🔒 | 🔒 | ✅ | 🟢 |
| 36 | pcl-revoke | pcl | 🔒 | 🔒 | 🔒 | ✅ | 🟢 |
| 37 | pcl-suspend | pcl | 🔒 | 🔒 | 🔒 | ✅ | 🟢 |
| 38 | retention-notifications | notifications | ✅ A1.b | ❌ | ❌ | ❌ | 🟡 |
| 39 | saint-of-the-day | content | ✅ A1.c | ❌ | ❌ | ❌ | 🟡 |
| 40 | search-saint | content | ✅ A1.c | ➖ frozen | ➖ | ❌ | 🟢 stub |
| 41 | send-notification | notifications | ✅ A1.b | ❌ | ❌ | ❌ | 🟡 |
| 42 | send-push | notifications | ✅ A1.b | ❌ | ❌ | ❌ | 🟡 |
| 43 | sitemap | content | ✅ A1.c | ➖ | ❌ | ❌ | 🟡 |
| 44 | spiritual-continuity | ai | ✅ A1.c | ➖ frozen | ➖ | ❌ | 🟢 stub |
| 45 | telemetry-notifications | notifications | ✅ A1.b | ❌ | ❌ | ❌ | 🟡 |
| 46 | translation-lookup | content | ✅ | ✅ | 🟡 parcial | ✅ | 🟡 padrão-ouro |
| 47 | validate-coupon | content | ❌ | ❌ | ❌ | ❌ | 🟡 |
| 48 | vatican-document | content | ✅ A1.c | ❌ | ❌ | ❌ | 🟡 |
