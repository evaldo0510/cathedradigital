# BACKEND.md — Camada Backend

Escopo: ARC-200. Detalhe individual das 55 funções está em [EDGE-FUNCTIONS.md](./EDGE-FUNCTIONS.md).

## Estado atual

### Runtime

- **Deno Edge Functions** hospedadas em Lovable Cloud (Supabase).
- Deploy automático a cada mudança em `supabase/functions/**`.
- 55 diretórios em `supabase/functions/` (inclui `_shared/` e `tests/`).

### Padrão de função

Cada função vive em `supabase/functions/<name>/index.ts`. Padrões esperados (ARC-208):

- CORS por `npm:@supabase/supabase-js@2/cors` ou headers em `_shared/`
- Validação de entrada com Zod (ARC-204)
- Verificação de JWT em código quando necessário (ARC-504)
- Envelope HTTP consistente — ver [`../EDGE-FUNCTIONS-STRICT-ENVELOPE-MATRIX.md`](../EDGE-FUNCTIONS-STRICT-ENVELOPE-MATRIX.md)
- Correlation ID propagado via `x-correlation-id` (ARC-206)

### Shared libraries

- `supabase/functions/_shared/` — utilitários compartilhados entre funções (CORS, rate-limit, envelope, correlation, etc.)
- `src/shared/**` — schemas usados também no frontend (`bibleTextSchema.ts`, `bibleTextSchema.factory.ts`)
- `src/lib/**` — utilitários lógicos de frontend, também importados por componentes de backend admin

### Serviços de aplicação

`src/services/`:

- `aiService.ts`
- `saintsService.ts`
- `translations.ts`

### Cache (ARC-209)

- **L2** persistente no banco: `bible_cache_l2`, `bible_cache_metadata`
- Métricas: `bible_cache_metric_events`, `bible_cache_metrics`
- Alertas: `bible_cache_alerts`
- Funções de administração: `bible-cache-admin/`, `bible-cache-timeseries/`, `bible-cache-aggregator/`

### Workers (ARC-210)

- `src/sw.js` (service worker principal)
- `public/sw-push.js` (push notifications)

### Contratos HTTP (ARC-208)

- Matriz completa em [`../EDGE-FUNCTIONS-STRICT-ENVELOPE-MATRIX.md`](../EDGE-FUNCTIONS-STRICT-ENVELOPE-MATRIX.md)
- Conformidade agregada em [`../EDGE-FUNCTIONS-COMPLIANCE-MATRIX.md`](../EDGE-FUNCTIONS-COMPLIANCE-MATRIX.md)

## Estado homologado

- `supabase/functions/_shared/` é a única fonte de utilitários compartilhados entre funções.
- Envelope HTTP estrito é obrigatório em novas funções.
- Correlation ID em cabeçalho é padrão para toda função nova.

## Dívida técnica

- **Duplicação `mercado-pago-webhook` × `mercadopago-webhook`** — implementações divergentes. Ver [EDGE-FUNCTIONS.md](./EDGE-FUNCTIONS.md#duplicações).
- **Rate limit (ARC-207)** — só uma função (`mercado-pago-webhook`) usa `_shared/rate-limit.ts`.
- **Envelope estrito** — nem todas as funções seguem, ver matriz de conformidade.

## Propostas pós-evento

- **Proposta B (backlog)** — Consolidação de edge functions em grupos por domínio. Requer inventário de URLs em produção + plano de migração; ver [`../MP-WEBHOOK-URLS-INVENTORY.md`](../MP-WEBHOOK-URLS-INVENTORY.md).
- Aplicar rate limit a todas as funções expostas publicamente.
- Padronizar envelope estrito em 100% das funções.
