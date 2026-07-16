# DATABASE.md — Camada de Dados

Escopo: ARC-300.

## Estado atual

### Runtime

- **PostgreSQL gerenciado** (Lovable Cloud / Supabase).
- Configuração em `supabase/config.toml` (não editar campos de projeto).
- Types gerados em `src/integrations/supabase/types.ts` (não editar manualmente).

### Migrations (ARC-303)

- Diretório: `supabase/migrations/**`
- Toda mudança de schema passa pelo fluxo de migração aprovado.
- Regra fixa: `CREATE TABLE public.*` sempre acompanhado de `GRANT` e `ENABLE ROW LEVEL SECURITY` na mesma migração.

### Tabelas por domínio (snapshot)

Total observado: ~120 tabelas no schema `public`. Agrupamento por prefixo:

| Domínio            | Prefixo / tabela                                             | Código  |
| ------------------ | ------------------------------------------------------------ | ------- |
| Bíblia — conteúdo  | `bible_books`, `bible_chapters`, `bible_verses`              | ARC-401 |
| Bíblia — cache     | `bible_cache_l2`, `bible_cache_metadata`, `bible_cache_metric_events`, `bible_cache_metrics`, `bible_cache_alerts`, `bible_cache_admin_audit` | ARC-209 |
| Bíblia — auditoria | `bible_audit_*` (16 tabelas)                                 | ARC-609 |
| Bíblia — diagnóstico | `bible_diagnostic_runs`, `bible_diagnostic_findings`, `bible_integrity_reports` | ARC-607 |
| Bíblia — usuário   | `bible_chapters_read`, `bible_favorites`, `bible_connections`, `bible_verse_modernizations` | ARC-408 |
| PCL                | `bible_translation_sources`, `bible_import_jobs`             | ARC-403 |
| Nexus              | `nexus_relations`, `nexus_relation_types`, `nexus_synonyms`  | ARC-404 |
| Catecismo          | `catechism_cache`, `catechism_official`, `catechism_paragraphs_read`, `catechism_execution_logs` | ARC-405 |
| Governança         | `governance_audit_log`, `governance_audit_log_archive`, `governance_audit_log_cleanup_runs`, `governance_audit_retention_config` | ARC-308 |
| Segurança          | `security_alerts`, `security_audit_logs`, `security_findings`, `security_logs`, `security_scans`, `secret_leaks`, `rls_test_results` | ARC-500 |
| Telemetria         | `telemetry_audit`, `telemetry_audit_logs`, `telemetry_settings`, `intelligent_notification_logs` | ARC-601 |
| Performance        | `pg_stat_notif_*`, `pg_stat_snapshots`, `pg_stat_snapshot_config`, `pg_stat_pending_notifications`, `pg_stats_admin_views` | ARC-608 |
| CID compliance     | `cid_compliance_snapshots`                                   | ARC-509 |
| Perfil             | `profiles`, `profiles_private`, `user_sensitive_data`, `user_psychological_profiles`, `user_emotions`, `user_history`, `user_notes` | CAT-009 |
| Roles              | `user_roles` (separada de `profiles` por segurança)          | ARC-502 |
| Jornadas           | `journeys`, `journey_steps`, `journey_progress`, `itineraria*`, `trail_progress`, `ritual_progress`, `weekly_goals_history` | CAT-007 |
| Comunidade         | `community_posts`, `community_likes`, `notifications`, `push_subscriptions` | — |
| Colloquium (IA)    | `colloquium_conversations`, `colloquium_messages`            | CAT-015 |
| Pagamentos         | `transactions`, `coupons`                                    | CAT-013 |
| SEO                | `seo_audits`, `seo_corrections`, `seo_settings`, `site_keywords` | — |
| Content management | `themes`, `theme_contents`, `partners`, `tags`, `content_tags`, `glossary`, `spiritual_contents` | — |
| Santos             | `saints`, `saints_audit`, `saints_reimport_runs`             | ARC-407 |
| Webhook / Vatican  | `vatican_cache`, `webhook_alerts`, `webhook_logs`, `webhook_settings` | ARC-406 |

### RLS (ARC-307)

- Toda tabela em `public` tem RLS habilitada.
- Policies armazenadas em `supabase/migrations/**`.
- Testes de regressão: `supabase/tests/rls_regression.test.sql`.
- Roles são gerenciadas em tabela separada `user_roles` (nunca em `profiles`), lidas via função `SECURITY DEFINER` `public.has_role(uuid, app_role)`.

### RPC (ARC-305)

- Funções SQL definidas nas migrações.
- Convenção: nomes claros, parâmetros validados, `SECURITY DEFINER` apenas quando estritamente necessário.
- Allowlist de funções `SECURITY DEFINER`: [`../SECURITY-DEFINER-ALLOWLIST.md`](../SECURITY-DEFINER-ALLOWLIST.md).

### Auditoria (ARC-308)

- `governance_audit_log` centraliza eventos governados.
- Testes: `supabase/tests/governance_audit.pgtap.sql`.
- Retenção: `governance_audit_retention_config` + cleanup runs em `governance_audit_log_cleanup_runs`.

### Performance (ARC-309 / ARC-709)

- Snapshots e planos: `docs/PERFORMANCE-B2-EXPLAIN-PLANS.md`, `docs/PERFORMANCE-B3-TOP-QUERIES.md`.
- Auditoria de índices: `docs/PERFORMANCE-INDEX-AUDIT-v1.md`.

## Estado homologado

- RLS obrigatória em toda tabela `public`.
- `GRANT` na mesma migração que cria a tabela.
- `user_roles` separada de `profiles` — inegociável.
- Função `has_role` como única forma de checar papéis em policies.

## Dívida técnica

- **Agrupamento por prefixo, não por schema** — 120+ tabelas em `public`, sem separação lógica formal.
- **Sem procedimento formal de backup documentado** (ARC-310 reservado).
- **`bible_audit_*`** — 16 tabelas para auditoria de Bíblia; oportunidade de consolidação futura.
- **Retenção** — só governance e telemetria têm política explícita.

## Propostas pós-evento

- **Proposta C (backlog)** — migrar tabelas `bible_*`, `nexus_*`, `catechism_*` etc. para schemas dedicados (`bible.*`, `nexus.*`, …). Avaliar apenas se houver ganho mensurável frente ao custo de reescrever policies RLS, GRANTs e types gerados.
- Documentar procedimento de backup e disaster recovery.
- Consolidar tabelas `bible_audit_*`.
