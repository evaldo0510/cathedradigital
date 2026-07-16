# EDGE-FUNCTIONS.md — Catálogo de Edge Functions

Escopo: ARC-201. Snapshot literal: **55 diretórios** em `supabase/functions/` (inclui `_shared/` e `tests/`).

## Estado atual — catálogo agrupado

### Bíblia — texto e busca (CAT-001)

- `bible-text` — leitura de capítulo/versículo com fallback e cache
- `bible-search` — busca em toda a Bíblia
- `bible-abbr-validate` — validação de abreviações canônicas
- `translation-lookup` — busca de tradução por versículo (ARC-402)

### Bíblia — cache (ARC-209)

- `bible-cache-admin` — administração de L2
- `bible-cache-timeseries` — série temporal de métricas
- `bible-cache-aggregator` — agregação
- `bible-auto-warm-slow` — pré-aquecimento de chapters lentos

### Bíblia — diagnóstico e integridade (ARC-607)

- `bible-canon-diagnose`
- `bible-integrity-check`
- `bible-availability-report`
- `bible-alerts-reconcile`
- `bible-latency-regression-alert`
- `bible-perf-render`

### Bíblia — importação (ARC-410)

- `bible-import-ndjson`
- `bible-import-deutero`
- `bible-convert-dump`

### Nexus (CAT-006 / ARC-404)

- `nexus-relations`

### PCL — ciclo de vida (CAT-011 / ARC-403)

- `pcl-approve`
- `pcl-activate`
- `pcl-suspend`
- `pcl-revoke`
- `pcl-reactivate`
- `pcl-expire`

### Catecismo e Magistério (CAT-002, CAT-003)

- `catechism-text`
- `vatican-document`

### Liturgia e Santos (CAT-004)

- `liturgical-calendar`
- `saint-of-the-day`
- `search-saint`

### Administração de Santos (CAT-010)

- `admin-apply-saints-reimport-run`
- `admin-bulk-seed-saints`
- `admin-incremental-reimport-saints`

### Pagamentos (CAT-013)

- `mercado-pago-webhook` ⚠️ **duplicação**
- `mercadopago-webhook` ⚠️ **duplicação**
- `mercado-pago-retry`
- `mercadopago-create-preference`
- `mercadopago-simulate`
- `mercadopago-sync-payment`
- `validate-coupon`

### IA (CAT-015 / ARC-800)

- `logos-ai`
- `logos-spiritual-insight`
- `colloquium`
- `spiritual-continuity`

### Voice e mídia (ARC-807)

- `elevenlabs-tts`

### Notificações (ARC-810)

- `intelligent-notifications`
- `retention-notifications`
- `daily-streak-push`
- `send-notification`
- `send-push`
- `telemetry-notifications`

### Compliance e observabilidade (ARC-509 / ARC-604)

- `cid-compliance-stats`
- `cid-trail`

### SEO e infra pública

- `sitemap`

### Compartilhado

- `_shared/` — utilitários (CORS, rate-limit, envelope, correlation)
- `tests/` — testes integrados de funções

## Duplicações

### `mercado-pago-webhook` × `mercadopago-webhook`

Duas funções ativas com implementações divergentes:

| Aspecto                   | `mercado-pago-webhook`               | `mercadopago-webhook`                |
| ------------------------- | ------------------------------------ | ------------------------------------ |
| Linhas                    | 289                                  | 270                                  |
| Rate limit `_shared/`     | ✅                                   | ❌                                   |
| HMAC de assinatura        | ❌                                   | ✅                                   |
| Fallback de token         | ❌                                   | ✅ (2 secrets)                       |
| Testes                    | 4 arquivos                           | 0                                    |
| Chamada por               | `mercado-pago-retry`                 | `mercadopago-create-preference`      |

> 🔒 **BLOQUEIO ARQUITETURAL — CAT-DOC-002**
>
> Nenhuma alteração, renomeação, consolidação ou remoção destas duas funções pode ocorrer até que [`../MP-WEBHOOK-URLS-INVENTORY.md`](../MP-WEBHOOK-URLS-INVENTORY.md) esteja preenchido e validado. Consolidar sem inventário = desativar pagamentos em produção.

**Ação bloqueada até:** preenchimento de [`../MP-WEBHOOK-URLS-INVENTORY.md`](../MP-WEBHOOK-URLS-INVENTORY.md).

## Estado homologado

- Envelope estrito ([`../EDGE-FUNCTIONS-STRICT-ENVELOPE-MATRIX.md`](../EDGE-FUNCTIONS-STRICT-ENVELOPE-MATRIX.md)) é padrão para novas funções.
- CORS via `_shared/` ou `npm:@supabase/supabase-js@2/cors`.
- Verificação JWT em código para funções sensíveis.

## Dívida técnica

- Duplicação MP (crítico até resolução).
- Cobertura desigual de testes por função.
- Nem toda função aplica rate limit (ARC-207).
- Governança consolidada em [`../EDGE-FUNCTIONS-GOVERNANCE-CHECKLIST.md`](../EDGE-FUNCTIONS-GOVERNANCE-CHECKLIST.md) — não é aplicada uniformemente.

## Propostas pós-evento

- **Proposta B (backlog)** — Agrupar funções em subdiretórios por domínio (`bible/`, `pcl/`, `payments/`, `admin/`). Bloqueada por: mudança altera URL pública. Requer:
  1. Inventário de URLs em produção completo.
  2. Estratégia de compatibilidade (stubs `410 Gone`, redirects, ou período dual).
  3. ADR próprio.
- Rate limit universal em funções públicas.
- Migração `mercado-pago-*` / `mercadopago-*` para uma única função canônica.
