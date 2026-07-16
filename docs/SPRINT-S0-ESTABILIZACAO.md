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

### 7.1 Checklist

| Item                                             | Objetivo                                                    | Responsável | Status | Evidência              | Observações |
| ------------------------------------------------ | ----------------------------------------------------------- | ----------- | ------ | ---------------------- | ----------- |
| Backup completo do banco (dump SQL)              | Dump antes do evento, armazenado offline                    | <preencher> | ☐      | Arquivo `.sql` + hash SHA-256 anotado em `docs/backups/v1.0-evento.md` | Retenção mínima 30 dias |
| Snapshot dos secrets configurados (nomes apenas) | Lista de nomes de secrets ativos                            | <preencher> | ☐      | `docs/secrets-snapshot.md` (nomes, nunca valores) | Nunca versionar valores |
| Backup dos edge function sources                 | Já no Git, confirmar HEAD limpo                             | <preencher> | ☐      | `git status` limpo + commit SHA anotado | Sincronia GitHub ↔ Lovable |
| Restore de teste em ambiente isolado             | Validar que o dump é restaurável                            | <preencher> | ☐      | Log do restore + contagem de linhas conferida | **Backup não testado ≠ backup** |

### 7.2 Plano de Backup

**Janela recomendada:** D-2 (dois dias antes do evento), 22h–00h BRT (menor tráfego observado).

**Escopo do backup:**

1. **Banco de dados (Lovable Cloud):** solicitar exportação via **Cloud → Advanced settings → Export data**. O arquivo é entregue como `.sql` (dump completo do schema `public` + dados).
2. **Edge Function sources:** garantidos no GitHub via sincronia bidirecional. Anotar o commit SHA do `main` no momento do backup.
3. **Frontend build:** capturado implicitamente pela tag `v1.0-evento` (seção 8).
4. **Secrets:** apenas **nomes** dos secrets configurados, nunca valores. Valores permanecem em Lovable Cloud (não versionáveis).

**Procedimento passo a passo:**

```
1. [Ops <preencher>] Solicitar export do banco em Cloud → Advanced settings → Export data
2. [Ops <preencher>] Baixar o .sql e calcular hash:
     sha256sum cathedra-v1.0-evento.sql > cathedra-v1.0-evento.sql.sha256
3. [Ops <preencher>] Armazenar em 2 locais distintos:
     - storage offline (HD externo ou cofre)
     - storage cloud privado (não o mesmo provider de produção)
4. [Ops <preencher>] Criar docs/backups/v1.0-evento.md com:
     - timestamp UTC do backup
     - hash SHA-256
     - tamanho do arquivo
     - locais de armazenamento (sem credenciais)
     - commit SHA do repositório correspondente
5. [Ops <preencher>] Snapshot dos nomes de secrets em docs/secrets-snapshot.md
```

**Evidência esperada por item:**

- Arquivo `.sql` fisicamente presente em 2 locais + hash conferido
- `docs/backups/v1.0-evento.md` preenchido e commitado
- `docs/secrets-snapshot.md` atualizado
- Registro do commit SHA correspondente ao backup

### 7.3 Procedimento de Restore (teste obrigatório)

**Objetivo:** provar que o dump é restaurável **antes** do evento. Backup não testado = sem garantia de recuperação.

**Ambiente:** projeto Lovable Cloud secundário/temporário, **nunca** em produção.

**Passos:**

```
1. [Ops <preencher>] Criar projeto Lovable Cloud temporário (staging-restore-test)
2. [Ops <preencher>] Confirmar hash do arquivo antes do restore:
     sha256sum -c cathedra-v1.0-evento.sql.sha256
3. [Ops <preencher>] Aplicar o dump no ambiente de teste
4. [QA <preencher>] Rodar queries de validação:
     - SELECT count(*) FROM auth.users;
     - SELECT count(*) FROM profiles;
     - SELECT count(*) FROM bible_verses;      (ou tabela equivalente)
     - SELECT count(*) FROM subscriptions;
     - SELECT max(created_at) FROM <tabela crítica>;
   Comparar com contagens do ambiente de produção no mesmo instante do dump.
5. [QA <preencher>] Smoke test mínimo no ambiente restaurado:
     - login com usuário de teste
     - abrir 1 capítulo bíblico
     - abrir 1 documento do magistério
6. [Ops <preencher>] Destruir ambiente de teste após validação
7. [Ops <preencher>] Registrar log completo em docs/backups/v1.0-evento-restore.md
```

**Critério de sucesso do restore:**

- ✅ Hash confere antes do restore
- ✅ Todas as queries de contagem batem (tolerância zero para diferença > 0,1%)
- ✅ Smoke test mínimo passa no ambiente restaurado
- ✅ Log de restore versionado

**Critério de encerramento da seção 7:**

- ✅ Todos os itens do checklist 7.1 marcados `✅`
- ✅ `docs/backups/v1.0-evento.md` e `docs/backups/v1.0-evento-restore.md` criados e commitados
- ✅ Restore de teste executado com sucesso (não apenas o backup)
- ✅ Ambiente de teste destruído (sem cópias de dados de produção circulando)

## 8. Release

### 8.1 Checklist

| Item                                     | Objetivo                                                    | Responsável | Status | Evidência              | Observações |
| ---------------------------------------- | ----------------------------------------------------------- | ----------- | ------ | ---------------------- | ----------- |
| Feature freeze declarado                 | Nenhum novo commit funcional até pós-evento                 | <preencher> | ☐      | Anúncio interno + timestamp | Só correções P0 |
| Tag `v1.0-evento` criada                 | Marca imutável para rollback                                | <preencher> | ☐      | Output de `git tag -l v1.0-evento` + SHA | Ver 8.2 |
| Tag pushada para o remoto                | Tag disponível no GitHub para clonagem/rollback             | <preencher> | ☐      | URL da tag no GitHub    | Ver 8.2 |
| Notas de release publicadas              | Changelog do que está no ar no dia do evento                | Lovable     | ☐      | `docs/RELEASE-NOTES-v1.0-evento.md` |             |
| Publish final via Lovable                | Frontend atualizado no domínio de produção                  | <preencher> | ☐      | URL publicada + timestamp | Ver 8.3 |
| Verificação SHA publicado = SHA da tag   | Ambiente publicado aponta exatamente para `v1.0-evento`     | <preencher> | ☐      | Comparação SHA registrada em `docs/RELEASE-NOTES-v1.0-evento.md` | Ver 8.3 |

### 8.2 Procedimento de criação da tag `v1.0-evento`

**Contexto:** o repositório Cathedra é sincronizado bidirecional entre Lovable e GitHub. Tags devem ser criadas do **GitHub** (ou clone local sincronizado), nunca via Lovable diretamente — Lovable gerencia commits, não tags.

**Pré-requisitos:**

- Feature freeze declarado (item 8.1)
- Backup + restore de teste concluídos (seção 7)
- Todos os smoke tests da seção 6 aprovados
- `git status` limpo no `main`

**Comandos (executar em clone local do GitHub sincronizado):**

```bash
# 1. Garantir que o clone está atualizado com o remoto
git checkout main
git fetch origin
git pull --ff-only origin main

# 2. Confirmar HEAD limpo e último commit
git status                         # deve estar clean
git log -1 --oneline               # anotar SHA e mensagem

# 3. Criar tag anotada (não lightweight)
git tag -a v1.0-evento -m "Release v1.0-evento — congelamento pré-evento (D-<N>)"

# 4. Verificar tag localmente
git tag -l v1.0-evento             # deve listar a tag
git show v1.0-evento --stat        # deve mostrar autor, data, mensagem e diff-stat

# 5. Publicar tag no remoto
git push origin v1.0-evento

# 6. Confirmar no GitHub
#    Abrir https://github.com/<org>/<repo>/releases/tag/v1.0-evento
```

**Evidências a registrar em `docs/RELEASE-NOTES-v1.0-evento.md`:**

- Commit SHA apontado pela tag (`git rev-parse v1.0-evento`)
- Data/hora UTC de criação
- Autor da tag
- URL da tag no GitHub
- Lista de últimos 20 commits incluídos (`git log --oneline -20 v1.0-evento`)
- Hash do backup correspondente (seção 7)

**Regras:**

- ❌ **Nunca deletar ou reescrever** `v1.0-evento` após push. Se algo mudar, criar `v1.0.1-evento`, `v1.0.2-evento` etc.
- ❌ **Nunca** usar `git tag -f` ou `git push --force` nesta tag.
- ✅ Se rollback for necessário durante o evento: `git checkout v1.0-evento` + republish (ver `docs/CONTINGENCY.md`).

### 8.3 Validações finais antes do evento

Executar na ordem, **após** criar a tag e **antes** do dia D:

```
[1] Publish via Lovable (frontend)
    - Abrir editor Lovable → Publish → Update
    - Anotar timestamp e URL publicada
    - Confirmar visualmente que a tag do momento do publish == v1.0-evento

[2] Confirmar SHA em produção
    - Abrir DevTools no domínio de produção
    - Verificar meta tag ou endpoint /health que exponha commit SHA (se existir)
    - Se não existir endpoint: registrar SHA manualmente com base no timestamp do publish

[3] Smoke tests em PRODUÇÃO
    - Executar RUNBOOK-SMOKE-TESTS.md contra o domínio público
    - Todos os critérios de sucesso devem estar ✅
    - QA <preencher> assina o runbook

[4] Verificar edge functions críticas em produção
    - mercadopago-webhook: revisar últimos logs de 24h (deve haver recebimentos ok)
    - mercado-pago-webhook: idem
    - bible-text, bible-search: revisar erros nos últimos 60min

[5] Verificar RLS e GRANTs
    - security scan sem findings críticos abertos

[6] Congelar publish
    - Após [1]-[5] ok: nenhum novo publish até o fim do evento,
      salvo emergência autorizada pelo Arquiteto <preencher>

[7] Comunicar go-live
    - Mensagem para o time de plantão com:
      - tag v1.0-evento
      - commit SHA
      - URL de produção
      - link para docs/CONTINGENCY.md e docs/EVENT-ONCALL.md
```

**Critério de encerramento da seção 8:**

- ✅ Tag `v1.0-evento` criada, pushada, visível no GitHub, não-forçada
- ✅ Publish final executado e SHA conferido
- ✅ Smoke tests em produção 100% ✅
- ✅ Comunicação de go-live enviada ao time de plantão
- ✅ `docs/RELEASE-NOTES-v1.0-evento.md` completo e commitado

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
