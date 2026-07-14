# Allowlist — `SECURITY DEFINER` públicas

**Sprint A · Fase A-Final · 2026-07-14**
Inventário consolidado das funções `SECURITY DEFINER` no schema `public` com
`EXECUTE` concedido a `anon` (papel não autenticado). Cada linha exige
justificativa arquitetural documentada — funções fora desta lista não devem
receber `GRANT EXECUTE ... TO anon`.

Fonte: `pg_proc` filtrado por `prosecdef=true` × `aclexplode(proacl)` para o
role `anon` no schema `public` (executado em 2026-07-14).

## Contexto CAT-003

O plano original da Sprint A previa **zerar** exposição de `SECURITY DEFINER`
a `anon`. Ao inventariar o catálogo, identificamos 9 funções cuja exposição
é **intencional** e faz parte do contrato público da plataforma (bloqueio de
leitura da Bíblia por gate soberano, trilha de correlação universal etc.).
Elas passam a compor esta allowlist formal; qualquer nova função `SECURITY
DEFINER` com `GRANT ... TO anon` DEVE ser adicionada aqui na mesma migração
que a cria, sob revisão explícita.

## Funções homologadas

| # | Função | Assinatura | Papéis com EXECUTE | Justificativa |
|---|--------|-----------|--------------------|---------------|
| 1 | `bible_read_gate_status` | `()` | anon, authenticated, service_role | Endpoint público que expõe o estado do gate soberano da Bíblia (S1). Precisa ser consultado antes do login para decidir se o leitor é habilitado. Não retorna dados sensíveis. |
| 2 | `bible_source_sprint1_passed` | `(p_source_id uuid)` | anon, authenticated, service_role | Consulta booleana usada pelo próprio gate soberano (`enforce_bible_source_sprint1_gate`) e por diagnóstico público de fontes bíblicas. Retorna somente `true/false`. |
| 3 | `bible_translation_readable` | `(p_translation_id uuid)` | anon, authenticated, service_role | Predicado usado por políticas RLS de leitura pública das tabelas `bible_*`. Necessário como `SECURITY DEFINER` para escapar da recursão RLS. Retorna somente `boolean`. |
| 4 | `bible_translation_ready` | `(p_translation_id uuid)` | anon, authenticated, service_role | Contraparte de `bible_translation_readable` — verifica se a tradução concluiu o checklist S1. Também retorna `boolean`. |
| 5 | `bible_translations_readiness` | `()` | anon, authenticated, service_role | Agrega readiness público de todas as traduções para exibir na home antes do login. Nenhum campo sensível — apenas `id`, `abbrev`, `ready`. |
| ~~6~~ | ~~`cleanup_bible_audit_action_logs`~~ | ~~`(p_triggered_by text, p_override_days integer)`~~ | **service_role** (apenas) | **Encerrada em Sprint B / B2 (2026-07-14):** `REVOKE EXECUTE ... FROM anon, authenticated`. Cron continua funcionando via service-role. Removida definitivamente da allowlist pública. |
| 7 | `enforce_bible_source_sprint1_gate` | `()` | anon, authenticated, service_role | Trigger function. `GRANT` a `anon` é irrelevante em termos de superfície de ataque (triggers só disparam via DML em tabelas RLS-protegidas), mas mantido por compatibilidade com o restore de dumps. |
| 8 | `enforce_pcl_active_requires_admin` | `()` | anon, authenticated, service_role | Trigger function — mesma justificativa da linha 7. |
| 9 | `get_correlation_trail` | `(_cid text, _include_responses boolean)` | anon, authenticated, service_role | Endpoint canônico da trilha de correlação (ADR-009). A função **valida `is_current_user_admin()` internamente** antes de retornar qualquer linha; o `GRANT ... TO anon` existe para permitir a chamada desde a Edge Function `cid-trail` sem service-role. Sem admin, retorna `[]`. |

## Regras operacionais

1. **Nova função `SECURITY DEFINER` com `GRANT ... TO anon` só é aceita se
   também for adicionada nesta tabela na mesma migração**, com justificativa.
2. Funções desta lista **devem** conter check interno de autorização (RLS
   emulado ou `is_current_user_admin`) OU retornar apenas dados públicos.
3. `SET search_path = public` é obrigatório em toda `SECURITY DEFINER` —
   verificado pelo linter da Sprint A0.
4. A auditoria automatizada `public.audit_security_definer_privileges()`
   (service-role) já compara o catálogo contra esta allowlist e emite alerta
   em `security_alerts` se qualquer função `SECURITY DEFINER` fora da lista
   ganhar `EXECUTE` para `anon` ou `public`.

## Dívidas técnicas registradas

- ~~**CAT-003 residual (baixa):** `cleanup_bible_audit_action_logs`~~ — **encerrada em Sprint B / B2 (2026-07-14).** `EXECUTE` revogado de `anon` e `authenticated`; apenas `service_role` mantém acesso.
- **Trigger functions com grant redundante (informativo):** linhas 7 e 8 —
  sem impacto de segurança, mas podem ser limpas em qualquer migração
  futura que refaça o REVOKE geral.

## Referências

- `supabase/migrations/20260713184511_*.sql` — criação de `bible_translation_readable` + `bible_read_gate_status`.
- `supabase/migrations/20260713…_get_correlation_trail_rpc.sql` — RPC de trilha.
- `docs/EDGE-FUNCTIONS-GOVERNANCE-CHECKLIST.md § SECURITY DEFINER` — regra de PR.
