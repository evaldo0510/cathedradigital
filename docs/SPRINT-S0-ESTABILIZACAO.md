# Sprint S0 — Estabilização Final (Pré-Evento)

**Objetivo:** chegar ao evento (D-6) com base documental consistente, zero risco operacional introduzido, e processo claro para retomar evoluções arquiteturais pós-evento.

**Regra de ouro:** nenhuma alteração de código de aplicação, banco, edge function ou comportamento do sistema durante esta sprint. Apenas documentação, validação e preparação operacional.

**Data de abertura:** 2026-07-16
**Data alvo de encerramento:** D-1 do evento

---

## Legenda de status

- ☐ Não iniciado
- 🟡 Em andamento
- ✅ Concluído
- 🔒 Bloqueado (registrar bloqueio em Observações)

---

## 1. Arquitetura

| Item                                                 | Objetivo                                                                 | Responsável | Status | Evidência                              | Observações |
| ---------------------------------------------------- | ------------------------------------------------------------------------ | ----------- | ------ | -------------------------------------- | ----------- |
| Documentação de arquitetura de referência criada     | 9 documentos em `docs/architecture/` cobrindo estado atual e homologado  | Lovable     | ✅     | `docs/architecture/` (9 arquivos)      | Fase 1 homologada |
| Revisão final dos documentos de arquitetura          | Arquiteto revisa cada arquivo e sinaliza correções documentais           | <preencher> | ☐      | Comentários / issues                   |             |
| Backlog arquitetural registrado sem execução         | Propostas pós-evento separadas do estado atual em cada doc               | Lovable     | ✅     | Seções "Backlog" em cada arquivo       |             |

## 2. ADRs (CAT-DOC-001)

| Item                                            | Objetivo                                                              | Responsável | Status | Evidência                          | Observações |
| ----------------------------------------------- | --------------------------------------------------------------------- | ----------- | ------ | ---------------------------------- | ----------- |
| Registro formal da ausência dos ADRs 001–010    | `docs/adrs/ADR-STATUS.md` com inventário e status                     | Lovable     | ✅     | `docs/adrs/ADR-STATUS.md`          |             |
| Template MADR publicado                         | `docs/adrs/TEMPLATE-ADR.md` disponível para uso                       | Lovable     | ✅     | `docs/adrs/TEMPLATE-ADR.md`        |             |
| README dos ADRs publicado                       | Ciclo de vida e plano de reconstrução documentados                    | Lovable     | ✅     | `docs/adrs/README.md`              |             |
| Reconstrução dos ADRs 001–010                   | Reconstruir a partir de evidências pós-hoc                            | <preencher> | ☐      | ADR-001.md ... ADR-010.md          | **Pós-evento** — não executar antes |

## 3. Mercado Pago (CAT-DOC-002)

| Item                                                       | Objetivo                                                                       | Responsável | Status | Evidência                                     | Observações |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------ | ----------- | ------ | --------------------------------------------- | ----------- |
| Inventário de webhooks criado                              | `docs/MP-WEBHOOK-URLS-INVENTORY.md` publicado com bloqueio arquitetural        | Lovable     | ✅     | `docs/MP-WEBHOOK-URLS-INVENTORY.md`           |             |
| Banner de bloqueio na arquitetura de edge functions        | `docs/architecture/EDGE-FUNCTIONS.md` sinaliza bloqueio                        | Lovable     | ✅     | `EDGE-FUNCTIONS.md` §Duplicações              |             |
| Preenchimento das seções 3.1–3.3 (URLs do painel MP)       | Coletar URLs cadastradas, App ID, eventos assinados                            | Usuário     | 🔒     | Seções 3.1–3.3 preenchidas                    | **Bloqueio ativo** para consolidar funções |
| Preenchimento da seção 4 (decisão de consolidação)         | Escolher nome canônico, plano de descomissionamento                            | <preencher> | ☐      | Seção 4 preenchida                            | Depende de 3.1–3.3 |
| Consolidação das duas edge functions                       | Fundir código na função canônica                                               | —           | 🔒     | —                                             | **Pós-evento** — bloqueado por inventário |

## 4. Banco de Dados

| Item                                          | Objetivo                                                          | Responsável | Status | Evidência                          | Observações |
| --------------------------------------------- | ----------------------------------------------------------------- | ----------- | ------ | ---------------------------------- | ----------- |
| Nenhuma migration durante S0                  | Congelamento total do schema                                      | <preencher> | 🟡     | `supabase/migrations/` sem novos   | Regra da sprint |
| Verificação de RLS habilitada em tabelas novas | Rodar `security scan` e revisar findings                          | <preencher> | ☐      | Relatório do scanner               |             |
| Verificação de GRANTs em tabelas públicas     | Confirmar GRANTs conforme padrão                                  | <preencher> | ☐      | Query em `information_schema`      |             |

## 5. Edge Functions

| Item                                                | Objetivo                                                              | Responsável | Status | Evidência                     | Observações |
| --------------------------------------------------- | --------------------------------------------------------------------- | ----------- | ------ | ----------------------------- | ----------- |
| Nenhum deploy/delete de edge function durante S0    | Congelamento total                                                    | <preencher> | 🟡     | —                             | Regra da sprint |
| Revisão de logs das funções críticas (últimas 24h)  | `mercadopago-webhook`, `mercado-pago-webhook`, `pcl-*`, `bible-*`     | <preencher> | ☐      | Print/anotação dos logs       |             |

## 6. Smoke Tests

| Item                                    | Objetivo                                                        | Responsável | Status | Evidência              | Observações |
| --------------------------------------- | --------------------------------------------------------------- | ----------- | ------ | ---------------------- | ----------- |
| Login / logout                          | Fluxo completo sem erro                                         | <preencher> | ☐      | Screenshot / vídeo     |             |
| Leitura da Bíblia (livro/capítulo)      | Renderiza < 200ms, sem erro de console                          | <preencher> | ☐      | DevTools timing        |             |
| Busca bíblica                           | Retorna resultados < 100ms                                      | <preencher> | ☐      | DevTools timing        |             |
| Nexus (popover de referência cruzada)   | Abre sem quebrar contexto                                       | <preencher> | ☐      | Screenshot             |             |
| Magisterium — categoria e documento     | Lista e detalhe carregam                                        | <preencher> | ☐      | Screenshot             |             |
| Liturgia do dia                         | Cálculo Computus correto para hoje                              | <preencher> | ☐      | Comparação vatican.va  |             |
| Checkout Mercado Pago (sandbox)         | Preferência gerada + webhook recebido + upgrade aplicado        | <preencher> | ☐      | Log do webhook         | **Não testar em produção** |
| Logos AI (usuário free)                 | Responde e respeita cap 5 msgs/dia                              | <preencher> | ☐      | Screenshot             |             |
| Mobile (viewport 375px)                 | Todos os fluxos acima renderizam sem overflow                   | <preencher> | ☐      | Screenshots            |             |

## 7. Backup

| Item                                             | Objetivo                                                    | Responsável | Status | Evidência              | Observações |
| ------------------------------------------------ | ----------------------------------------------------------- | ----------- | ------ | ---------------------- | ----------- |
| Backup completo do banco (dump SQL)              | Dump antes do evento, armazenado offline                    | <preencher> | ☐      | Arquivo `.sql` + hash  |             |
| Snapshot dos secrets configurados (nomes apenas) | Lista de nomes de secrets ativos                            | <preencher> | ☐      | `docs/secrets-snapshot.md` (nomes, nunca valores) |             |
| Backup dos edge function sources                 | Já no Git, confirmar HEAD limpo                             | <preencher> | ☐      | `git status`           |             |

## 8. Release

| Item                                     | Objetivo                                                    | Responsável | Status | Evidência              | Observações |
| ---------------------------------------- | ----------------------------------------------------------- | ----------- | ------ | ---------------------- | ----------- |
| Tag `v1.0-evento` criada                 | Marca imutável para rollback                                | <preencher> | ☐      | `git tag -l`           |             |
| Notas de release publicadas              | Changelog do que está no ar no dia do evento                | Lovable     | ☐      | `docs/RELEASE-NOTES-v1.0-evento.md` |             |
| Ambiente publicado apontando para a tag  | Preview + produção alinhados                                | <preencher> | ☐      | URL + commit sha       |             |

## 9. Evento

| Item                                          | Objetivo                                                | Responsável | Status | Evidência              | Observações |
| --------------------------------------------- | ------------------------------------------------------- | ----------- | ------ | ---------------------- | ----------- |
| Plano de contingência (rollback rápido)       | Procedimento escrito para reverter para `v1.0-evento`   | <preencher> | ☐      | `docs/CONTINGENCY.md`  |             |
| Contatos de plantão (telefone/canal)          | Lista de quem contatar em cada tipo de falha            | <preencher> | ☐      | `docs/EVENT-ONCALL.md` |             |
| Monitoramento ativo (dashboards abertos)      | Painéis prontos para o dia                              | <preencher> | ☐      | Print dos dashboards   |             |
| Checklist do dia D                            | Passo-a-passo de verificação horária                    | <preencher> | ☐      | `docs/EVENT-DAY-CHECKLIST.md` |             |

---

## Critério de encerramento da Sprint S0

A Sprint S0 estará **homologada** quando **todos** os itens abaixo forem `✅`:

- ✅ Arquitetura documentada (Fase 1 concluída)
- ✅ Registro formal da ausência dos ADRs (CAT-DOC-001)
- ✅ Inventário do Mercado Pago criado com bloqueio arquitetural (CAT-DOC-002)
- ✅ Checklist de estabilização publicado (este documento)
- ☐ Todos os smoke tests da seção 6 executados e passando
- ☐ Backup completo realizado (seção 7)
- ☐ Tag `v1.0-evento` criada e ambiente publicado (seção 8)
- ☐ Plano de contingência e on-call publicados (seção 9)

**Nenhuma alteração de código, banco, edge function ou comportamento do sistema pode ter sido introduzida durante esta sprint.** Violações devem ser reportadas e revertidas imediatamente.

---

## Pós-evento

Após homologação da Sprint S0 e realização do evento, abrir **Sprint S1** para atacar o backlog arquitetural, começando por:

1. **CAT-DOC-001 continuação:** reconstrução dos ADRs 001–010.
2. **ADR-011:** consolidação dos webhooks Mercado Pago (só após inventário completo).
3. Demais propostas listadas em `docs/adrs/ADR-STATUS.md` §"Próximos ADRs a criar".

Cada item requer ADR próprio aceito **antes** de qualquer execução.
