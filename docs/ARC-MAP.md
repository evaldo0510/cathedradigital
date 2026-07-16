# ARC-MAP — Mapeamento código → repositório

Cada código ARC/CAT ligado aos diretórios e arquivos reais do repositório na data de geração. Fonte de verdade dos códigos: [`docs/ARCHITECTURE-CODES.md`](./ARCHITECTURE-CODES.md).

> Atualizar sempre que criar/mover módulos. Snapshots literais — nada inventado. Diretórios com muitos arquivos aparecem como `caminho/*`.

---

## ARC-000 — Fundação

| Código  | Domínio            | Caminho                                                                    |
| ------- | ------------------ | -------------------------------------------------------------------------- |
| ARC-000 | Arquitetura Mestre | `docs/ARCHITECTURE-CODES.md`                                               |
| ARC-001 | Convenções         | `docs/PERFORMANCE_CHECKLIST.md`, `docs/QUALITY_CHECKLIST.md`               |
| ARC-002 | ADRs               | `docs/ADR-*.md` (quando existirem)                                         |
| ARC-003 | Governança         | `docs/EDGE-FUNCTIONS-GOVERNANCE-CHECKLIST.md`, `compliance-config.yml`     |
| ARC-004 | Roadmap            | `.lovable/plan.md`, `docs/SPRINT-A-EXECUTION-PLAN.md`                      |
| ARC-005 | Documentação       | `docs/**`, `README.md`, `REPORTS/**`, `artifacts/**`                       |

---

## ARC-100 — Frontend

| Código  | Domínio               | Caminho                                                              |
| ------- | --------------------- | -------------------------------------------------------------------- |
| ARC-101 | React                 | `src/main.tsx`, `src/App.tsx`, `vite.config.ts`                      |
| ARC-102 | Componentes           | `src/components/**`                                                  |
| ARC-103 | Hooks                 | `src/hooks/**`                                                       |
| ARC-104 | Context               | `src/contexts/*` (`LangContext`, `ReadingSettingsContext`, `CatechismPendingContext`) |
| ARC-105 | React Query           | uso via `@tanstack/react-query` em `src/hooks/**` e `src/pages/**`   |
| ARC-106 | Roteamento            | `src/App.tsx`, `src/pages/**`, `src/navigation.config.ts`, `src/config/routes.ts` |
| ARC-107 | Design System         | `src/components/ui/**`, `components.json`, `tailwind.config.ts`      |
| ARC-108 | UI Tokens             | `src/index.css`, `tailwind.config.ts`                                |
| ARC-109 | Forms                 | uso de `react-hook-form` + `zod` em `src/components/**`              |
| ARC-110 | Performance Frontend  | `src/hooks/useRenderPerf.ts`, `src/lib/prefetch.ts`, `docs/PERFORMANCE-BASELINE-*.md` |

---

## ARC-200 — Backend

| Código  | Domínio           | Caminho                                                                             |
| ------- | ----------------- | ----------------------------------------------------------------------------------- |
| ARC-201 | Edge Functions    | `supabase/functions/**`                                                             |
| ARC-202 | Shared Libraries  | `supabase/functions/_shared/`, `src/shared/**`, `src/lib/**`                        |
| ARC-203 | Middleware        | `supabase/functions/_shared/` (utilitários de request/response)                     |
| ARC-204 | Zod Validation    | `src/shared/bibleTextSchema.ts`, `src/shared/bibleTextSchema.factory.ts`            |
| ARC-205 | Error Handling    | `src/components/cathedra/AppErrorBoundary.tsx`, `src/lib/biblePerf.ts`              |
| ARC-206 | Correlation ID    | `src/lib/otel.ts`, `supabase/functions/cid-trail/`, `supabase/functions/cid-compliance-stats/` |
| ARC-207 | Rate Limit        | (implementação em `supabase/functions/_shared/` quando aplicável)                   |
| ARC-208 | HTTP Contracts    | `docs/EDGE-FUNCTIONS-STRICT-ENVELOPE-MATRIX.md`, `src/services/**`                  |
| ARC-209 | Cache             | `supabase/functions/bible-cache-*`, `src/lib/offlineCache.ts`                       |
| ARC-210 | Workers           | `src/sw.js`, `public/sw-push.js`                                                    |

---

## ARC-300 — Banco de Dados

| Código  | Domínio        | Caminho                                                                                    |
| ------- | -------------- | ------------------------------------------------------------------------------------------ |
| ARC-301 | PostgreSQL     | `supabase/config.toml`                                                                     |
| ARC-302 | Schema         | `src/integrations/supabase/types.ts` (gerado), `supabase/migrations/**`                    |
| ARC-303 | Migrations     | `supabase/migrations/**`                                                                   |
| ARC-304 | Índices        | migrações em `supabase/migrations/**`, `docs/PERFORMANCE-INDEX-AUDIT-v1.md`                |
| ARC-305 | RPC            | funções SQL em `supabase/migrations/**`                                                    |
| ARC-306 | Triggers       | definidos em `supabase/migrations/**`                                                      |
| ARC-307 | RLS            | policies em `supabase/migrations/**`, testes em `supabase/tests/rls_regression.test.sql`   |
| ARC-308 | Auditoria      | tabela `governance_audit_log`, `supabase/tests/governance_audit.pgtap.sql`                 |
| ARC-309 | Database Logs  | `docs/PERFORMANCE-B3-TOP-QUERIES.md`, snapshots em `docs/perf-baselines/`                  |
| ARC-310 | Backup         | (ver `docs/` quando documentado)                                                           |

---

## ARC-400 — Bíblia Soberana

| Código  | Domínio              | Caminho                                                                                     |
| ------- | -------------------- | ------------------------------------------------------------------------------------------- |
| ARC-401 | Bíblia Soberana      | `src/components/cathedra/Bible*.tsx`, `supabase/functions/bible-*/`                         |
| ARC-402 | Translation Sources  | `supabase/functions/translation-lookup/`, `src/services/translations.ts`                    |
| ARC-403 | PCL                  | `supabase/functions/pcl-approve/`, `pcl-activate/`, `pcl-suspend/`, `pcl-revoke/`, `pcl-reactivate/`, `pcl-expire/`, `supabase/tests/admin_pcl.pgtap.sql` |
| ARC-404 | Nexus                | `supabase/functions/nexus-relations/`, `src/lib/nexusContent.ts`                            |
| ARC-405 | Catecismo            | `src/components/cathedra/Catechism*.tsx`, `supabase/functions/catechism-text/`, `src/data/catechism.ts` |
| ARC-406 | Magistério           | `src/components/cathedra/MagisteriumViewer.tsx`, `supabase/functions/vatican-document/`, `src/lib/magisteriumFilters.ts` |
| ARC-407 | Liturgia             | `supabase/functions/liturgical-calendar/`, `src/hooks/useLiturgicalMonth.ts`                |
| ARC-408 | Leituras             | `src/pages/GuidedReading.tsx`, `src/hooks/useReadingMode.ts`, `src/hooks/useReadingMarks.ts`|
| ARC-409 | Conexões             | tabela `bible_connections` (via `supabase/functions/nexus-relations/`)                      |
| ARC-410 | Importação           | `supabase/functions/bible-import-ndjson/`, `bible-import-deutero/`, `bible-convert-dump/`, `scripts/import-bible-dump.ts` |

---

## ARC-500 — Segurança

| Código  | Domínio           | Caminho                                                                                    |
| ------- | ----------------- | ------------------------------------------------------------------------------------------ |
| ARC-501 | Authentication    | `src/hooks/useAuth.ts`, `src/components/cathedra/Auth.tsx`, `src/components/auth/**`       |
| ARC-502 | Authorization     | `src/components/cathedra/AuthGuard.tsx`, `src/components/cathedra/AdminGuard.tsx`          |
| ARC-503 | Admin             | `src/pages/admin/**`, `src/components/admin/**`, `src/hooks/useIsAdmin.ts`                 |
| ARC-504 | JWT               | `src/integrations/supabase/client.ts`                                                      |
| ARC-505 | Security Definer  | `docs/SECURITY-DEFINER-ALLOWLIST.md`                                                       |
| ARC-506 | Secrets           | gerenciados via Lovable Cloud (não versionados)                                            |
| ARC-507 | CORS              | `supabase/functions/_shared/` (headers CORS por função)                                    |
| ARC-508 | Hardening         | `.github/workflows/security-ci.yml`, `scripts/security-audit.ts`                           |
| ARC-509 | Compliance        | `artifacts/cid-compliance-report.md`, `docs/EDGE-FUNCTIONS-COMPLIANCE-MATRIX.md`           |
| ARC-510 | LGPD              | `src/utils/securityReport.ts`, testes em `src/test/PIILeakPrevention.test.tsx`             |

---

## ARC-600 — Observabilidade

| Código  | Domínio                  | Caminho                                                                     |
| ------- | ------------------------ | --------------------------------------------------------------------------- |
| ARC-601 | Application Logs         | `src/lib/analytics.ts`, `src/lib/telemetry.ts` (quando presente)            |
| ARC-602 | Metrics                  | tabelas `bible_cache_metric_events`, `bible_cache_metrics`                  |
| ARC-603 | Tracing                  | `src/lib/otel.ts`, `docs/OBSERVABILITY-OTEL.md`                             |
| ARC-604 | Correlation Trail        | `supabase/functions/cid-trail/`                                             |
| ARC-605 | Dashboards               | `src/pages/BiblePerfDashboard.tsx`, `src/pages/CidComplianceDashboardPage.tsx`, `src/pages/AuditDashboard.tsx` |
| ARC-606 | Alerts                   | `supabase/functions/bible-alerts-reconcile/`, `bible-latency-regression-alert/` |
| ARC-607 | Health Checks            | `supabase/functions/bible-availability-report/`, `bible-integrity-check/`   |
| ARC-608 | Performance Monitoring   | `src/hooks/useRenderPerf.ts`, `src/lib/biblePerf.ts`, `docs/PERFORMANCE-BASELINE-*.md` |
| ARC-609 | Audit Trail              | tabela `governance_audit_log`, `src/pages/AuditDashboard.tsx`               |
| ARC-610 | Monitoring               | `src/components/cathedra/DebugRequestPanel.tsx`, `.github/workflows/perf-benchmark.yml` |

---

## ARC-700 — Performance

| Código  | Domínio              | Caminho                                                                     |
| ------- | -------------------- | --------------------------------------------------------------------------- |
| ARC-701 | Lazy Loading         | `React.lazy` em `src/App.tsx`, `src/pages/**`                               |
| ARC-702 | Code Splitting       | `vite.config.ts`, imports dinâmicos em `src/pages/**`                       |
| ARC-703 | React.memo           | uso em `src/components/**`                                                  |
| ARC-704 | Virtualização        | uso pontual em componentes de listagem (`src/components/cathedra/**`)       |
| ARC-705 | Bundle Optimization  | `vite.config.ts`, `docs/BLOCK-OPTIMIZATION-REPORT.md`                       |
| ARC-706 | Prefetch             | `src/lib/prefetch.ts`, `src/lib/litcalPrefetchGuard.ts`                     |
| ARC-707 | Cache HTTP           | `public/_headers`                                                           |
| ARC-708 | Service Worker       | `src/sw.js`, `public/sw-push.js`                                            |
| ARC-709 | SQL Optimization     | `docs/PERFORMANCE-B2-EXPLAIN-PLANS.md`, `docs/PERFORMANCE-B3-TOP-QUERIES.md`|
| ARC-710 | RPC Optimization     | `supabase/functions/bible-cache-aggregator/`, `bible-perf-render/`          |

---

## ARC-800 — Inteligência Artificial

| Código  | Domínio              | Caminho                                                                     |
| ------- | -------------------- | --------------------------------------------------------------------------- |
| ARC-801 | AI Gateway           | integração via Lovable AI Gateway em `supabase/functions/logos-ai/`         |
| ARC-802 | Agentes              | `supabase/functions/logos-ai/`, `supabase/functions/colloquium/`, `spiritual-continuity/` |
| ARC-803 | Prompt Engine        | prompts em `supabase/functions/logos-*`                                     |
| ARC-804 | RAG                  | `supabase/functions/logos-spiritual-insight/`                               |
| ARC-805 | Embeddings           | (implementar em funções `logos-*` quando aplicável)                         |
| ARC-806 | LLM Providers        | Lovable AI Gateway (definido em `supabase/functions/_shared/`)              |
| ARC-807 | Voice AI             | `supabase/functions/elevenlabs-tts/`, `src/hooks/useSpeechSynthesis.ts`     |
| ARC-808 | OCR                  | (não presente atualmente)                                                   |
| ARC-809 | Tradução Assistida   | `supabase/functions/translation-lookup/`, `src/services/translations.ts`    |
| ARC-810 | Automações           | `supabase/functions/intelligent-notifications/`, `retention-notifications/`, `daily-streak-push/` |

---

## ARC-900 — Infraestrutura

| Código  | Domínio            | Caminho                                                                     |
| ------- | ------------------ | --------------------------------------------------------------------------- |
| ARC-901 | Supabase           | `supabase/config.toml`, `src/integrations/supabase/client.ts`               |
| ARC-902 | Storage            | (buckets via Lovable Cloud quando existirem)                                |
| ARC-903 | CDN                | `public/_headers`, `public/_redirects`                                      |
| ARC-904 | Deploy             | `capacitor.config.ts`, publicação via Lovable                               |
| ARC-905 | GitHub Actions     | `.github/workflows/**`                                                      |
| ARC-906 | Docker             | (não presente atualmente)                                                   |
| ARC-907 | Ambiente           | `.env`, `src/vite-env.d.ts`                                                 |
| ARC-908 | Backups            | (definido operacionalmente)                                                 |
| ARC-909 | Disaster Recovery  | `src/pages/BibleRecoveryPanel.tsx`, `src/lib/bibleRecoveryRunner.ts`, `src/test/BibleRecoveryMode.test.ts` |
| ARC-910 | Escalabilidade     | `.github/workflows/perf-benchmark.yml`, `docs/perf-benchmark.config.yaml`   |

---

## CAT — Módulos Funcionais

| Código  | Módulo        | Caminho principal                                                                          |
| ------- | ------------- | ------------------------------------------------------------------------------------------ |
| CAT-001 | Bíblia        | `src/components/cathedra/Bible*.tsx`, `src/hooks/bible/**`, `supabase/functions/bible-*/`  |
| CAT-002 | Catecismo     | `src/components/cathedra/Catechism*.tsx`, `src/pages/CatechismExplorer.tsx`, `supabase/functions/catechism-text/` |
| CAT-003 | Magistério    | `src/components/cathedra/MagisteriumViewer.tsx`, `supabase/functions/vatican-document/`    |
| CAT-004 | Liturgia      | `src/hooks/useLiturgicalMonth.ts`, `supabase/functions/liturgical-calendar/`, `supabase/functions/saint-of-the-day/` |
| CAT-005 | Lectio Divina | `src/components/cathedra/lectio/**`                                                        |
| CAT-006 | Nexus         | `supabase/functions/nexus-relations/`, `src/lib/nexusContent.ts`, `src/components/cathedra/BibleDictionaryPopover.tsx` |
| CAT-007 | Formação      | `src/pages/GuidedReading.tsx`, `src/components/cathedra/AZFaithPage.tsx`, `AchievementsPage.tsx` |
| CAT-008 | Estudos       | `src/components/cathedra/BibliotecaPage.tsx`, `AquinasOpera.tsx`, `src/components/cathedra/encyclopedia/**` |
| CAT-009 | Perfil        | `src/hooks/useSpiritualProfile.ts`, `src/lib/psychologicalProfile.ts`                      |
| CAT-010 | Administração | `src/pages/admin/**`, `src/components/admin/**`, `src/components/cathedra/Admin*.tsx`      |
| CAT-011 | PCL           | `supabase/functions/pcl-*/`, `src/pages/BibleSprint1Admin.tsx`                             |
| CAT-012 | Dashboard     | `src/pages/BiblePerfDashboard.tsx`, `AuditDashboard.tsx`, `CidComplianceDashboardPage.tsx`, `SecurityDashboard.tsx` |
| CAT-013 | Financeiro    | `supabase/functions/mercado-pago-webhook/`, `mercadopago-*`, `mercado-pago-retry/`, `validate-coupon/` |
| CAT-014 | Marketplace   | (não presente atualmente)                                                                  |
| CAT-015 | IA            | `supabase/functions/logos-ai/`, `logos-spiritual-insight/`, `colloquium/`, `src/services/aiService.ts` |

---

## Observações do snapshot

Itens que apareceram durante a varredura e valem uma decisão de arquitetura (não editados neste documento):

- **Duplicação Mercado Pago**: coexistem `supabase/functions/mercado-pago-webhook/` e `supabase/functions/mercadopago-webhook/`. Consolidar em uma única função (ADR pendente sob ARC-208).
- **Faixas não usadas neste snapshot**: `ARC-207` (Rate Limit), `ARC-310` (Backup), `ARC-805` (Embeddings), `ARC-808` (OCR), `ARC-906` (Docker), `CAT-014` (Marketplace). Registrar como reservados até implementação real.

_Snapshot gerado a partir do estado atual do repositório. Atualizar em cada mudança estrutural relevante._
