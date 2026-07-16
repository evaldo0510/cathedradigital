# OBSERVABILITY.md — Observabilidade

Escopo: ARC-600.

## Estado atual

### Application Logs (ARC-601)

- Telemetria de aplicação em `src/lib/analytics.ts` e `src/lib/telemetry.ts` (quando presente).
- Convenção: masking automático de PII antes do envio (`***MASKED***`, `[EMAIL_REDACTED]`, `[JWT_REDACTED]`).
- Testes: `src/test/TelemetryMasking.test.tsx`, `TelemetryRegression.test.tsx`.

### Métricas (ARC-602)

- Cache Bíblia: tabelas `bible_cache_metric_events`, `bible_cache_metrics`, `bible_cache_alerts`.
- App: tabela `app_metrics`.
- Notificações: `pg_stat_notif_*`, `pg_stat_pending_notifications`.
- Snapshots gerais: `pg_stat_snapshots`, `pg_stat_snapshot_config`.

### Tracing (ARC-603)

- Cliente OTel: `src/lib/otel.ts`.
- Documentação: [`../OBSERVABILITY-OTEL.md`](../OBSERVABILITY-OTEL.md).

### Correlation Trail (ARC-604)

- Header padrão: `x-correlation-id`.
- Propagação em `supabase/functions/_shared/`.
- Função dedicada: `supabase/functions/cid-trail/`.
- Estatísticas: `supabase/functions/cid-compliance-stats/`.

### Dashboards (ARC-605)

Páginas ativas:

- `src/pages/BiblePerfDashboard.tsx` — performance da Bíblia
- `src/pages/AuditDashboard.tsx` — auditoria
- `src/pages/CidComplianceDashboardPage.tsx` — compliance de correlation
- `src/pages/SecurityDashboard.tsx` — segurança
- `src/pages/IntegrityReport.tsx` — integridade
- `src/pages/BibleSourcesAudit.tsx` — fontes de tradução

### Alerts (ARC-606)

- Edge functions: `bible-alerts-reconcile/`, `bible-latency-regression-alert/`.
- Tabelas: `bible_cache_alerts`, `security_alerts`, `webhook_alerts`.

### Health Checks (ARC-607)

- `bible-availability-report`, `bible-integrity-check`, `bible-canon-diagnose`.
- Retorno agregado em `IntegrityReport.tsx` e `BibleAuditDashboard.tsx`.

### Performance Monitoring (ARC-608)

- Hook: `src/hooks/useRenderPerf.ts`.
- Lib: `src/lib/biblePerf.ts` (inclui status expandido: `ok | error | 400 | 404 | 304 | empty`).
- Baseline: [`../PERFORMANCE-BASELINE-v2.md`](../PERFORMANCE-BASELINE-v2.md), [`../PERFORMANCE-DIFF-REPORT.md`](../PERFORMANCE-DIFF-REPORT.md).
- Docs: [`../OBSERVABILITY-APP-METRICS-USER-MANAGEMENT.md`](../OBSERVABILITY-APP-METRICS-USER-MANAGEMENT.md).

### Audit Trail (ARC-609)

- `governance_audit_log` + arquivo (`governance_audit_log_archive`).
- Cleanup: `governance_audit_log_cleanup_runs`, config em `governance_audit_retention_config`.
- Auditoria Bíblia: 16 tabelas `bible_audit_*`.
- Testes pgTAP: `supabase/tests/governance_audit.pgtap.sql`.

### Monitoring em produção (ARC-610)

- `DebugRequestPanel` (`src/components/cathedra/DebugRequestPanel.tsx`):
  - Ativação: `?debug=requests` na URL ou `localStorage.debug:requests=1`.
  - Intercepta `window.fetch`, registra respostas com status ≥ 400 e erros de rede.
  - Redaction automática de tokens/PII (URL, body preview, mensagens).
  - Máx. 30 entries em memória.
- Workflow: `.github/workflows/perf-benchmark.yml`.

## Estado homologado

- `x-correlation-id` em toda função nova.
- Masking de PII em toda telemetria enviada.
- Retenção: tier 1 (7 dias, redaction), tier 2 (30 dias, deleção) — ver [SECURITY.md](./SECURITY.md#lgpd-arc-510).
- `DebugRequestPanel` com redaction é o padrão para inspeção em produção.

## Dívida técnica

- **Telemetria fragmentada** — `analytics.ts` + `telemetry.ts` + `otel.ts` sem consolidação clara.
- **Sem alerta central** — alertas espalhados em 3 tabelas (`bible_cache_alerts`, `security_alerts`, `webhook_alerts`).
- **Cobertura desigual de correlation** — nem toda função reporta CID (ver matriz de compliance).
- **Dashboards duplicam consultas** — cada painel emite queries próprias sem view consolidada.

## Propostas pós-evento

- Consolidar telemetria em um único ponto (`src/lib/telemetry/`) — parte da Proposta A (backlog).
- Tabela única de alertas com dimensão `source`.
- Views materializadas para dashboards mais quentes (dependente de decisão em [DATABASE.md](./DATABASE.md)).
- Timeline por fase no `DebugRequestPanel` (registrado como pendência do pedido original de painel de debug).
