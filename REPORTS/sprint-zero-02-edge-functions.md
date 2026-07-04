# Sprint Zero — Auditoria 2: Edge Functions

**Modo:** read-only. Nenhuma função removida ou modificada.
**Data:** 2026-07-04
**Total:** 41 funções + `_shared` + `tests`.

---

## Agrupamento por domínio

### 🕮 Bíblia (16 funções — maior domínio, primeiro alvo de consolidação)

| Função | LOC | Propósito | Ação proposta | Risco |
|---|---|---|---|---|
| `bible-text` | 858 | Runtime crítico: retorna texto de versículos (chamada por leitor). | **Manter** — núcleo | — |
| `bible-search` | 45 | Busca. | **Manter** — mover para banco local (S1). | Baixo |
| `bible-cache-admin` | 473 | Admin de cache. | **Consolidar em `bible-cache`** (admin+aggregator+timeseries) | Médio |
| `bible-cache-aggregator` | 212 | Agrega cache. | **Fundir em `bible-cache`** | Médio |
| `bible-cache-timeseries` | 324 | Métricas cache. | **Fundir em `bible-cache`** | Médio |
| `bible-availability-report` | 156 | Relatório de disponibilidade. | **Fundir em `bible-diagnostics`** | Baixo |
| `bible-canon-diagnose` | 375 | Diagnóstico de cânon. | **Fundir em `bible-diagnostics`** | Baixo |
| `bible-integrity-check` | 74 | Check integridade. | **Fundir em `bible-diagnostics`** | Baixo |
| `bible-perf-render` | 71 | Métrica de render. | **Fundir em `bible-diagnostics`** | Baixo |
| `bible-abbr-validate` | 97 | Valida abreviações. | **Fundir em `bible-diagnostics`** | Baixo |
| `bible-alerts-reconcile` | 165 | Reconcilia alertas. | **Fundir em `bible-alerts`** | Baixo |
| `bible-latency-regression-alert` | 118 | Alerta regressão latência. | **Fundir em `bible-alerts`** | Baixo |
| `bible-auto-warm-slow` | 165 | Cron warm-up. | **Manter (cron isolado)** | — |
| `bible-import-ndjson` | 313 | Seed one-shot. | **Arquivar** após S1 concluir | Baixo |
| `bible-import-deutero` | 163 | Seed one-shot deuterocanônicos. | **Arquivar** após S1 | Baixo |
| `bible-convert-dump` | 130 | Conversor one-shot. | **Remover** após S1 | Baixo |

**Consolidação proposta:** 16 → **5 funções** (`bible-text`, `bible-search`, `bible-cache`, `bible-diagnostics`, `bible-alerts`) + arquivar 3 seeds.

---

### 💳 Mercado Pago (6 funções — duplicação óbvia)

| Função | Propósito | Ação | Risco |
|---|---|---|---|
| `mercado-pago-webhook` | Webhook (nome com hífen). | **Duplicata → remover** se `mercadopago-webhook` cobrir. | Alto — validar em produção qual URL está ativa no MP. |
| `mercadopago-webhook` | Webhook (sem hífen). | **Manter como canônico** | — |
| `mercadopago-create-preference` | Cria preferência checkout. | **Manter** | — |
| `mercadopago-sync-payment` | Sincroniza pagamento. | **Manter** | — |
| `mercado-pago-retry` | Retry de webhook. | **Renomear → `mercadopago-retry`** (padronizar) | Médio |
| `mercadopago-simulate` | Simulador dev. | **Manter (dev-only)** ou proteger com env-guard | Baixo |

**Ação crítica:** existe **`mercado-pago-webhook` E `mercadopago-webhook`** — o Mercado Pago só chama uma. A outra é código morto perigoso (parece viva, mas nunca dispara). **Confirmar em produção antes de remover.**

**Consolidação proposta:** 6 → **4 funções** com nomenclatura única `mercadopago-*`.

---

### 🔔 Notificações / Push (5 funções — candidatas a merge)

| Função | Propósito | Ação | Risco |
|---|---|---|---|
| `send-push` | Envia push individual. | **Fundir em `notifications-dispatch`** | Médio |
| `send-notification` | Envia notificação genérica. | **Fundir em `notifications-dispatch`** | Médio |
| `intelligent-notifications` | Regras + envio. | **Manter como orquestrador**, delega a `dispatch` | Médio |
| `retention-notifications` | Cron retenção. | **Manter (cron)** | — |
| `daily-streak-push` | Cron streak. | **Manter (cron)** | — |
| `telemetry-notifications` | Cron alertas telemetria. | **Manter (cron)** | — |

**Consolidação:** 5 dispatchers → **1 (`notifications-dispatch`)** + 3 crons intactos.

---

### 🧠 IA (3 funções — bloqueadas até S5)

| Função | Propósito | Ação | Risco |
|---|---|---|---|
| `logos-ai` | Chat Logos. | **Manter neutralizada até S5** | — |
| `logos-spiritual-insight` | Insight IA. | **Auditar uso; possível remoção** | Baixo |
| `colloquium` | IA conversacional. | **Auditar uso** | Baixo |

Nenhuma nova IA antes de S1–S4 fecharem.

---

### 📿 Domínios estáveis (manter)

| Função | Ação |
|---|---|
| `catechism-text` | **Manter** (94 LOC, focada). |
| `liturgical-calendar` | **Manter** (fonte Computus). |
| `vatican-document` | **Manter** (proxy Magisterium). |
| `saint-of-the-day` | **Manter**. |
| `search-saint` | **Auditar** — potencial fusão com `saint-of-the-day` se compartilharem lógica. |
| `sitemap` | **Manter**. |
| `validate-coupon` | **Manter**. |
| `elevenlabs-tts` | **Manter** (TTS). |
| `spiritual-continuity` | **Auditar propósito** — nome ambíguo. |
| `_shared` | **Manter** (utils). |
| `tests` | **Manter** (test harness). |

---

## Resumo executivo

| Métrica | Hoje | Após consolidação | Redução |
|---|---|---|---|
| Total edge functions | **41** | **~26** | **-37%** |
| Domínio Bíblia | 16 | 5 (+3 arquivadas) | -50% ativas |
| Domínio Mercado Pago | 6 | 4 | -33% |
| Domínio Notificações | 5 dispatchers | 1 + 3 crons | -25% |

**Ganho principal:** cold-start menor, menos superfície de deploy, menos duplicação de CORS/auth/logging.

**Riscos altos identificados:**
1. **`mercado-pago-webhook` vs `mercadopago-webhook`** — uma é código morto perigoso. Validar antes de mexer.
2. Consolidação de `bible-cache-*` (3 funções, 1009 LOC combinado) exige testes de regressão em dashboards de cache.

---

## Próximo passo

1. Você aprova o mapa de consolidação (ou ajusta prioridades)?
2. Auditoria 3 (dependências externas: `bolls.life`, `bible-api`, `esm.sh`, CDN fonts, resquícios IA) — posso iniciar em paralelo?
