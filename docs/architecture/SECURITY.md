# SECURITY.md — Segurança

Escopo: ARC-500.

## Estado atual

### Authentication (ARC-501)

- Provedor: **Supabase Auth** (Lovable Cloud).
- Hook: `src/hooks/useAuth.ts`.
- UI: `src/components/cathedra/Auth.tsx`, `src/components/auth/**` (incluindo `GoogleSignInButton`).
- Cliente: `src/integrations/supabase/client.ts` (auto-gerado, não editar).

### Authorization (ARC-502)

- Guards de rota: `AuthGuard.tsx`, `AdminGuard.tsx` (`src/components/cathedra/`).
- Detecção de admin: `src/hooks/useIsAdmin.ts`.
- Papéis armazenados em `public.user_roles` (separado de `profiles` — inegociável).
- Verificação via função `SECURITY DEFINER` `public.has_role(uuid, app_role)`.

### Admin (ARC-503)

- Páginas: `src/pages/admin/**`.
- Componentes: `src/components/admin/**` (inclui `pg-stats/`).
- Nunca depende de storage local para checar admin; sempre valida via banco.

### JWT (ARC-504)

- Emitido e validado pelo Supabase.
- Edge functions validam em código quando necessário.

### Security Definer (ARC-505)

- Allowlist controlada em [`../SECURITY-DEFINER-ALLOWLIST.md`](../SECURITY-DEFINER-ALLOWLIST.md).
- Regra: `SECURITY DEFINER` só é usado para funções auxiliares de RLS (ex.: `has_role`).

### Secrets (ARC-506)

- Runtime secrets gerenciados via Lovable Cloud (nunca em `.env` versionado).
- Build secrets em Workspace Settings.
- Nunca imprimir/logar valores de secret.

### CORS (ARC-507)

- Headers por função em `supabase/functions/_shared/` ou via `npm:@supabase/supabase-js@2/cors`.
- Duplicação de `corsHeaders` no mesmo arquivo é proibida (erro de identifier).

### Hardening (ARC-508)

- Workflows CI de segurança: `.github/workflows/security-ci.yml`, `security-rescan-gate.yml`, `secret-leak-detection.yml`.
- Script: `scripts/security-audit.ts`.
- Relatórios: `public/security-rescan-report.json`, `public/security-rescan-history.json`.

### Compliance (ARC-509)

- Matriz: [`../EDGE-FUNCTIONS-COMPLIANCE-MATRIX.md`](../EDGE-FUNCTIONS-COMPLIANCE-MATRIX.md).
- Snapshots: tabela `cid_compliance_snapshots`, função `cid-compliance-stats`.
- Relatórios agregados: `artifacts/cid-compliance-report.md` e `.json`.
- Trail de correlation: `supabase/functions/cid-trail/`.

### LGPD (ARC-510)

- Redaction de PII no `DebugRequestPanel.tsx` (JWT, Bearer, email, tokens longos, chaves sensíveis em JSON/query).
- Utilitário: `src/utils/securityReport.ts`.
- Testes: `src/test/PIILeakPrevention.test.tsx`, `TelemetryMasking.test.tsx`, `TelemetryRegression.test.tsx`, `TelemetryLifecycle.test.tsx`, `TelemetryRetention.test.tsx`.
- Retenção de telemetria: tier 1 (redaction) em 7 dias, tier 2 (deleção) em 30 dias.

## Estado homologado

- Papéis **jamais** armazenados em `profiles`.
- `has_role(uuid, app_role)` como única forma de checar papel em policy.
- RLS obrigatória em toda tabela `public` (ver [DATABASE.md](./DATABASE.md)).
- Redaction obrigatória em qualquer painel/log que exponha dados de requisição.
- Nunca instruir usuário a colar secret em código; sempre via ferramentas Lovable.
- Nunca hardcodear credencial de admin ou checar admin via `localStorage`.

## Dívida técnica

- **Rate limit ausente** em maioria das funções públicas (ARC-207).
- **HMAC de webhook** só implementado em `mercadopago-webhook` (não em `mercado-pago-webhook`).
- **ADRs de decisões de segurança** ausentes no repositório.
- **Sem log auditado central** de tentativas de login/negação (só logs de aplicação).

## Propostas pós-evento

- Rate limit universal em funções expostas publicamente.
- Consolidação MP com HMAC obrigatório (bloqueada por inventário de URLs — ver [EDGE-FUNCTIONS.md](./EDGE-FUNCTIONS.md#duplicações)).
- ADRs retroativos: papéis, RLS, redaction de PII, allowlist SECURITY DEFINER.
- Log central de eventos de autenticação (login, denial, elevação de papel).
