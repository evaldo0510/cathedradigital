# Relatório A1.a — Adoção de correlation_id no domínio `bible-*`

_Documento retroativo. Homologação recebida em 2026-07-14._

## Escopo

Domínio `bible-*` (16 funções) — apenas adoção de `correlation_id` (ADR-009),
sem alteração funcional, contrato ou regra de negócio. Padrão aplicado:
`getOrCreateCorrelationId(req)` + eco no header `x-correlation-id` + logger
correlacionado.

## Métricas antes × depois

| Métrica | Antes (baseline pré-A1.a) | Depois (pós-A1.a) |
| --- | ---: | ---: |
| Bible Edge Functions | 16 | 16 |
| Cobertura CID | 3 / 16 (18,75%) | **16 / 16 (100%)** |
| Cobertura Zod (VAL) | 1 / 16 (6,25%) | 1 / 16 (6,25%) |
| Cobertura HTTP padronizado | 0 / 16 (0%) | 0 / 16 (0%) |
| Testes Deno associados | 1 / 16 (6,25%) | 1 / 16 (6,25%) + smoke CI |
| Regressões observadas | 0 | 0 |

> CID pré-A1.a: `bible-text` (padrão-ouro), `bible-search`, `bible-cache-timeseries`.
> Zod/HTTP/testes permanecem em zero por design — endereçados nas fases A2/A5.

## Impacto acumulado até Wave 3 (2026-07-14)

Para servir de baseline da autorização da Wave 4:

| Métrica | Baseline (pré-Sprint A) | Estado atual |
| --- | ---: | ---: |
| CID (47 funções) | 14 / 47 (30%) | **47 / 47 (100%)** |
| Zod nas auditadas (7) | 7 / 7 (100%) — já compliant | 7 / 7 |
| Envelope estrito (`ErrorEnvelopeSchema.strict`) | 0 / 47 (0%) | **22 / 47 (46,8%)** |
| Testes de contrato dedicados | 1 (cid_zod_envelope) | 6 (cid_zod_envelope + strict_wave1/2/3 + concurrency + header_variations) |
| Exceções documentadas (contrato de domínio) | — | 12 (matriz oficial) |

## Distribuição do envelope estrito por onda

| Onda | Funções | Data |
| --- | --- | --- |
| A2.a | pcl-activate/approve/expire/reactivate/revoke/suspend + nexus-relations (7) | 2026-07-13 |
| A2.b W1 | sitemap, saint-of-the-day, search-saint, liturgical-calendar, vatican-document (5) | 2026-07-13 |
| A2.b W2 | cid-trail, cid-compliance-stats, bible-abbr-validate (400/405) (3) | 2026-07-14 |
| A2.b W3 | send-notification, send-push, daily-streak-push, retention-notifications, telemetry-notifications, intelligent-notifications, spiritual-continuity (7) | 2026-07-14 |

## Regressões

Nenhuma regressão observada em qualquer onda. Os workflows `edge-cid-smoke`,
`cid_header_variations`, `cid_concurrency`, `cid_zod_envelope` e
`cid_strict_wave{1,2,3}` seguem verdes.
