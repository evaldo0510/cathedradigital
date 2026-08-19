# Plano de Ação: Reforço de Segurança e Auditoria

## Objetivos
1.  **Interface de Auditoria**: Adicionar busca, filtros e navegação por relatórios na página `/admin/security-docs`.
2.  **Testes E2E**: Implementar fluxos completos de moderação de posts e bloqueio de RLS.
3.  **Notificações CI**: Configurar alertas críticos via Slack/Email no workflow de segurança.

## Alterações Técnicas

### Frontend (`src/pages/admin/SecurityDocumentation.tsx`)
- Implementar estado local para busca e filtros (data, commit, tipo).
- Adicionar componentes de UI (`Input`, `Select`) para os filtros.
- Refatorar a tabela de histórico para ser dinâmica com base nos filtros.
- Integrar com o `ReaderShell` para manter a consistência visual.

### Testes E2E (`tests/e2e/security-moderation.spec.ts`)
- Criar teste completo: 
    1. Login de usuário comum.
    2. Tentativa de edição de post alheio (deve falhar via RLS).
    3. Edição de post próprio (deve resetar status para `pending`).
    4. Validação de que usuários anônimos não possuem privilégios de escrita.

### CI/CD (`.github/workflows/security-audit.yml`)
- Adicionar step de notificação após a auditoria.
- Utilizar `slack-send` ou `mail-action` quando `steps.rls_check.outcome == 'failure'`.
- Incluir link para o artefato `security-audit-report` na mensagem de erro.

## User Review Required
- **Segredo do Slack/Email**: O usuário precisará configurar os secrets `SLACK_WEBHOOK_URL` ou `SMTP_SERVER` no repositório GitHub para que as notificações funcionem de fato.
- **Formato da Notificação**: Deseja um formato específico de alerta (ex: somente resumo ou erro completo)?
