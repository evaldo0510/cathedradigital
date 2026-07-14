# Relatório Final — Sprint A (Governança)

**Encerramento: 2026-07-14 · Fase A-Final**
Baseline: auditoria arquitetural inicial do Cathedra (2026-07-12)
Escopo: fundação comum (`_shared/http-response.ts`, envelope canônico,
`correlation_id` universal) + padronização das 47 Edge Functions ativas +
governança de `SECURITY DEFINER`.

---

## 1. Métricas antes × depois

### 1.1 Edge Functions (47 ativas)

| Critério | Baseline | Encerramento | Δ |
|---|---:|---:|---:|
| **`correlation_id` universal (CID)** | 14/47 (30%) | **47/47 (100%)** | +33 (+70 pp) |
| **Envelope estrito `ErrorEnvelopeSchema.strict()`** | 0/47 (0%) | **28/47 (59,6%)** | +28 (+59,6 pp) |
| **HTTP padronizado (`_shared/http-response.ts`)** | 6/47 (13%) | **34/47 (72,3%)** | +28 (+59 pp) |
| **Zod / validação de entrada auditável (VAL)** | 12/47 (26%) | 12/47 (26%) | 0 (fora do escopo A) |
| **AUTHN documentado** | 39/47 (83%) | 39/47 (83%) | 0 |
| **RATE limit (onde aplicável)** | 10/47 | 10/47 | 0 |
| **Testes de contrato (suítes Deno)** | 1 | **7** | +6 |
| **Regressões introduzidas** | — | **0** | 0 |

### 1.2 Governança e observabilidade

| Área | Baseline | Encerramento |
|---|---|---|
| Trilha de correlação end-to-end | ausente | **`get_correlation_trail(_cid, _include_responses)`** consolida `governance_audit_log` + `core_audit_logs` + `bible_cache_metric_events` + `bible_cache_alerts` + `bible_integrity_reports` |
| Logger estruturado com CID | 3 funções | **47/47** via `_shared/logger.ts` |
| Smoke test E2E CID | inexistente | **`cid_cors_smoke_test.ts` no CI** (fail-on-red em push/PR) |
| Compliance report automático | inexistente | **`scripts/generate-cid-compliance-report.ts`** com PR-comment sticky |
| Gate de regressão CID | inexistente | **`cid_governance_gate_test.ts`** (7 funções críticas) |
| Allowlist `SECURITY DEFINER × anon` | informal | **`docs/SECURITY-DEFINER-ALLOWLIST.md`** (9 exceções homologadas) |

---

## 2. Evolução por fase

| Fase | Escopo | Entregas principais | Homologação |
|------|--------|---------------------|-------------|
| **A0** | Fundação | `_shared/http-response.ts`, `makeResponder`, `ErrorCode`, `corsHeaders`, `ErrorEnvelopeSchema.strict` | ✅ |
| **A1.a** | CID em `bible-*` (16) | 16/16 CID, 0 regressão | ✅ |
| **A1.b** | CID em `mercadopago-*` + notifications + `send-*` (12) | 12/12 CID | ✅ |
| **A1.c** | CID em conteúdo + IA (11) | 47/47 CID (marco) | ✅ |
| **A1.d/e** | Trilha `get_correlation_trail`, gate CI, relatório automático, variações de header | RPC + workflow `edge-cid-smoke` | ✅ |
| **A2.a** | Envelope estrito em funções auditadas (7: pcl-* + nexus-relations) | 7/7 strict + `cid_zod_envelope_test.ts` | ✅ |
| **A2.b Wave 1** | Conteúdo público (5: sitemap, saint-of-the-day, search-saint, liturgical-calendar, vatican-document) | 5/5 strict | ✅ |
| **A2.b Wave 2** | Diagnóstico/telemetria (3: cid-trail, cid-compliance-stats, bible-abbr-validate) | 3/3 strict | ✅ |
| **A2.b Wave 3** | Notificações (7: send-notification, send-push, daily-streak-push, retention-notifications, telemetry-notifications, intelligent-notifications, spiritual-continuity) + teste de concorrência CID | 7/7 strict | ✅ |
| **A2.b Wave 4a** | Manutenção Bíblia lote 1 (6: bible-integrity-check, bible-perf-render, bible-convert-dump, bible-latency-regression-alert, bible-alerts-reconcile, bible-availability-report) | 6/6 strict | ✅ |
| **A2.b Wave 4b** | Manutenção Bíblia lote 2 (5: bible-cache-admin, bible-cache-aggregator, bible-cache-timeseries, bible-canon-diagnose, bible-import-ndjson) | 5/5 strict | ✅ |
| **A-Final** | Consolidação: Compliance Matrix v2.0, Allowlist `SECURITY DEFINER`, este relatório | Sem mudança funcional | ✅ (este documento) |

---

## 3. Exceções homologadas

### 3.1 Envelope estrito — 19 exceções permanentes

Documentadas em `docs/EDGE-FUNCTIONS-STRICT-ENVELOPE-MATRIX.md § Exceções permanentes`.
Categorias:

- **Contrato de domínio publicado** (`bible-text`, `mercadopago-create-preference`, `validate-coupon`, `translation-lookup`, `catechism-text`, `bible-abbr-validate` 404).
- **Integrações externas com contrato fixo** (`mercadopago-webhook`, `mercado-pago-webhook`, `mercadopago-simulate`, `mercadopago-sync-payment`, `mercado-pago-retry`).
- **Streaming / binário** (`elevenlabs-tts` áudio, `logos-ai`/`logos-spiritual-insight`/`colloquium` SSE).
- **Legado congelado até S5** (`bible-search`).

Todas mantêm **`correlation_id` no header e nos logs**; a exceção libera apenas o formato do body.

### 3.2 `SECURITY DEFINER × anon` — 9 funções na allowlist

Documentadas em `docs/SECURITY-DEFINER-ALLOWLIST.md`. Categorias:

- Gate soberano da Bíblia (5 funções — `bible_read_gate_status`, `bible_source_sprint1_passed`, `bible_translation_readable`, `bible_translation_ready`, `bible_translations_readiness`).
- Trigger functions (2 — grant a `anon` sem impacto de segurança).
- Trilha de correlação (`get_correlation_trail` — valida admin internamente).
- Dívida técnica registrada para Sprint B (`cleanup_bible_audit_action_logs`).

### 3.3 Dívidas técnicas conhecidas (fora do escopo A)

| Item | Categoria | Severidade | Encaminhamento |
|------|-----------|-----------|----------------|
| Erros TypeScript pré-existentes em `getClaims` / tipagens cliente Supabase | tooling | baixa | manter em backlog |
| `bible-import-deutero` sem branches de erro para migrar | escopo | informativo | mantido CID-only |
| `cleanup_bible_audit_action_logs` com `anon EXECUTE` | segurança | baixa | remover na Sprint B |
| CAT-004 índice duplicado | performance | média | Sprint B |
| Cobertura VAL/Zod ainda em 26% | qualidade | média | Sprint dedicada pós-B |

---

## 4. Score estimado por área

Escala 0–10, baseada nos critérios da auditoria inicial. **Baseline** = leitura do dossiê de auditoria; **Encerramento** = leitura pós-A-Final.

| Área | Baseline | Encerramento | Δ |
|------|---------:|-------------:|---:|
| **Governança de Edge Functions** | 3,0 | **8,5** | +5,5 |
| **Observabilidade / rastreabilidade** | 2,5 | **8,0** | +5,5 |
| **Padronização HTTP** | 2,0 | **7,5** | +5,5 |
| **Contrato de erro** | 2,0 | **7,0** | +5,0 |
| **Segurança (SECURITY DEFINER)** | 5,0 | **7,5** | +2,5 |
| **Cobertura de testes de contrato** | 3,0 | **6,0** | +3,0 |
| **Validação de entrada (Zod)** | 3,0 | 3,0 | 0 (fora do escopo) |

**Score agregado das áreas trabalhadas na Sprint A: 2,9 → 7,4 (+4,5).**

---

## 5. Artefatos gerados

### Código compartilhado
- `supabase/functions/_shared/http-response.ts` — `makeResponder`, `corsHeaders`, `ErrorCode`.
- `supabase/functions/_shared/error-envelope-schema.ts` — `ErrorEnvelopeSchema.strict()`.
- `supabase/functions/_shared/logger.ts` — logger correlacionado.
- `supabase/functions/_shared/correlation-id.ts` — `getOrCreateCorrelationId`.

### Banco
- RPC `public.get_correlation_trail(_cid text, _include_responses boolean)`.
- Função de auditoria `public.audit_security_definer_privileges()`.

### CI / testes
- Workflow `.github/workflows/edge-cid-smoke.yml` (smoke + relatório de compliance + PR-comment sticky).
- 7 suítes Deno de contrato: `cid_zod_envelope_test.ts`, `cid_strict_wave1_test.ts`, `cid_strict_wave2_test.ts`, `cid_strict_wave3_test.ts`, `cid_strict_wave4a_test.ts`, `cid_strict_wave4b_test.ts`, `cid_concurrency_test.ts`.
- Complementares: `cid_cors_smoke_test.ts`, `cid_error_scenarios_test.ts`, `cid_header_variations_test.ts`, `cid_governance_gate_test.ts`.

### Documentação
- `docs/EDGE-FUNCTIONS-COMPLIANCE-MATRIX.md` v2.0.
- `docs/EDGE-FUNCTIONS-STRICT-ENVELOPE-MATRIX.md` (Wave 4b + exceções).
- `docs/EDGE-FUNCTIONS-GOVERNANCE-CHECKLIST.md`.
- `docs/SECURITY-DEFINER-ALLOWLIST.md` (novo).
- Relatórios por fase: `SPRINT-A-A1a-BIBLE-METRICS.md`, `SPRINT-A-A2b-WAVE4B-METRICS.md`, `SPRINT-A-EXECUTION-PLAN.md`.
- Este relatório: `SPRINT-A-FINAL-REPORT.md`.

---

## 6. Linha de base para Sprint B (Performance)

A Sprint A entrega para a Sprint B uma **fundação observável**:

- Toda requisição tem `correlation_id` recuperável via `get_correlation_trail`.
- Toda função crítica tem contrato de erro previsível para instrumentar timeouts, retries e circuit-breakers sem quebrar consumidores.
- Baseline de testes de contrato para detectar regressão de latência sem regressão de payload.
- CAT-004 (índice duplicado) já mapeado como primeiro alvo de B.

**Sprint A oficialmente encerrada em 2026-07-14.**
