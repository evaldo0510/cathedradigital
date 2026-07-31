# Auditoria de GRANTs e Permissões — Estado Final

**Data:** 2026-07-31 · Escopo: schema `public`, views, storage buckets, funções `SECURITY DEFINER`.
**Objetivo:** garantir que não existem caminhos alternativos de leitura de segredos ou de dados administrativos por `anon` / `authenticated`.

## 1. Tabelas sensíveis (segredos, auditoria, logs, dados pessoais)

`anon` **não possui nenhum privilégio** nas 39 tabelas cujo nome contém
`secret|leak|security|audit|log|private|sensitive`. O `REVOKE` foi aplicado em
duas migrações (2026-07-31) e é verificado pelo teste automatizado.

| Tabela | anon | authenticated | Fronteira efetiva |
|---|---|---|---|
| `secret_leaks` | — | `SELECT` | RLS: `has_role(admin)` OU `user_id = auth.uid()` (coluna verificada, nunca `details->>'user_id'`) |
| `security_alerts` / `security_findings` / `security_scans` | — | `SELECT` | `is_current_user_admin()` |
| `security_audit_logs` / `core_audit_logs` / `governance_audit_log*` | — | CRUD | RLS admin-only; escrita real via `service_role` |
| `bible_audit_*` (16 tabelas) | — | CRUD | RLS admin-only |
| `profiles_private` / `user_sensitive_data` / `user_psychological_profiles` | — | CRUD | `auth.uid() = id/user_id` ou admin |
| `rls_denial_events` (nova) | — | `SELECT` | admin-only; **sem policy de escrita** |
| `community_likes` | grant residual sem policy | CRUD | `SELECT`: `auth.uid() = user_id OR is_admin()`; `INSERT/DELETE`: dono |

> `authenticated` mantém GRANT em tabelas administrativas porque os
> administradores autenticam com esse mesmo papel — a separação é feita pela RLS
> (`auth_internal.has_role` / `is_current_user_admin`), nunca pelo GRANT.

## 2. Views

Todas as views de `public` são `security_invoker = true`, ou seja, herdam a RLS
das tabelas base e não constituem bypass:

`library_items_v1`, `nexus_chapter_coverage`, `public_partners`,
`public_profiles`, `public_seo_settings`, `user_management_stats`,
`view_itineraria_with_stats`, `view_journeys_with_stats`.

## 3. Storage buckets

| Bucket | Público | Regras |
|---|---|---|
| `avatars` | não | dono lê/escreve/apaga o próprio arquivo; admin lê todos |
| `bible-dumps` | não | admin-only |
| `partner-logos` | não | upload autenticado restrito a `submissions/<auth.uid()>/`; leitura pública apenas de logos aprovados; admin gerencia |
| `public-assets` | sim | leitura pública intencional (assets estáticos); escrita admin-only |

Nenhum bucket privado possui policy de leitura anônima.

## 4. Funções `SECURITY DEFINER` executáveis por `anon`

Exatamente 10 — todas na allowlist pública (ver
[`SECURITY-DEFINER-ALLOWLIST.md`](./SECURITY-DEFINER-ALLOWLIST.md)):

`bible_read_gate_status`, `bible_source_sprint1_passed`,
`bible_translation_readable`, `bible_translation_ready`,
`bible_translations_readiness`, `get_active_primary_translation`,
`get_bible_phase_summary`, `get_translation_progress`, `has_role`,
`search_patristic_library`.

Triggers, harnesses `_test_notif_*` e RPCs administrativas tiveram `EXECUTE`
revogado de `anon`/`PUBLIC`.

## 5. Auditoria de acessos negados

- Tabela: `public.rls_denial_events` (`user_id`, `table_name`, `action`, `reason`, `context`, `created_at`).
- Escrita: **apenas** via RPC `public.log_rls_denial(text, text, text, jsonb)`
  (`SECURITY DEFINER`, `EXECUTE` só para `authenticated` e `service_role`).
  O cliente não tem policy de `INSERT`/`UPDATE`/`DELETE` — o histórico é imutável.
- Leitura: admins autenticados.
- Cliente: `src/lib/security/rlsDenialLog.ts` (`withDenialAudit`, `logRlsDenial`)
  detecta `42501`, `PGRST301` e mensagens de RLS, com deduplicação de 30 s.
  Nunca envia payload da linha nem valores sensíveis.

## 6. Teste automatizado

```bash
psql -f supabase/tests/rls_community_secrets.test.sql
```

Sete asserções (rollback ao final, não altera dados):

1. `anon` não lê `community_likes`;
2. `anon` não alcança `secret_leaks` (sem GRANT);
3. policies de `community_likes` escopadas a `auth.uid()` (leitura e escrita);
4. `secret_leaks` usa coluna verificada e não o JSON `details`;
5. tabelas administrativas fora da publicação `supabase_realtime`;
6. `rls_denial_events` sem policy de escrita e sem acesso `anon`;
7. nenhuma função `SECURITY DEFINER` fora da allowlist exposta a `anon`.

## 7. Realtime

`supabase_realtime` publica somente tabelas de usuário protegidas por RLS de
propriedade: `profiles`, `notifications`, `journey_progress`, `reading_marks`,
`reading_reflections`, `itineraria_progress`, `user_achievements`.
`bible_cache_alerts` e `editorial_closure_migration_log` foram removidos.
