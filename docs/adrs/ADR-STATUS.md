# ADR — Status Inventory

Rastreamento de todos os ADRs conhecidos (existentes, ausentes, depreciados).

**Última atualização:** 2026-07-16

## Legenda de status

- ✅ **VERSIONADO** — arquivo `ADR-NNN-*.md` existe neste repositório
- ❌ **AUSENTE** — referenciado em docs/conversas mas não existe no Git → requer reconstrução (CAT-DOC-001)
- 🟡 **RECONSTRUÍDO** — reconstruído a partir de evidências pós-hoc
- ⚫ **DEPRECIADO** — substituído por ADR posterior ou revogado

## Inventário

| ADR     | Título esperado (inferido de referências) | Status     | Observação                                                                 |
| ------- | ------------------------------------------ | ---------- | -------------------------------------------------------------------------- |
| ADR-001 | _(desconhecido — não localizado)_          | ❌ AUSENTE | Referenciado na arquitetura. Título não recuperado.                        |
| ADR-002 | _(desconhecido — não localizado)_          | ❌ AUSENTE | Referenciado na arquitetura. Título não recuperado.                        |
| ADR-003 | _(desconhecido — não localizado)_          | ❌ AUSENTE | Referenciado na arquitetura. Título não recuperado.                        |
| ADR-004 | _(desconhecido — não localizado)_          | ❌ AUSENTE | Referenciado na arquitetura. Título não recuperado.                        |
| ADR-005 | _(desconhecido — não localizado)_          | ❌ AUSENTE | Referenciado na arquitetura. Título não recuperado.                        |
| ADR-006 | _(desconhecido — não localizado)_          | ❌ AUSENTE | Referenciado na arquitetura. Título não recuperado.                        |
| ADR-007 | _(desconhecido — não localizado)_          | ❌ AUSENTE | Referenciado na arquitetura. Título não recuperado.                        |
| ADR-008 | _(desconhecido — não localizado)_          | ❌ AUSENTE | Referenciado na arquitetura. Título não recuperado.                        |
| ADR-009 | _(desconhecido — não localizado)_          | ❌ AUSENTE | Referenciado na arquitetura. Título não recuperado.                        |
| ADR-010 | _(desconhecido — não localizado)_          | ❌ AUSENTE | Referenciado na arquitetura. Título não recuperado.                        |

## Notas

- **Não inferir** decisões técnicas. Esta tabela registra apenas o que é **conhecido** e marca lacunas explicitamente.
- Títulos foram deixados como `_(desconhecido)_` porque nenhuma evidência textual dos títulos originais foi localizada no repositório.
- A reconstrução de cada ADR exige:
  1. Localizar evidência (chat history, código, migration, PR).
  2. Preencher `TEMPLATE-ADR.md` com `Status: Reconstruído a partir de evidências`.
  3. Atualizar esta tabela.
- Se um ADR não puder ser reconstruído por falta de evidência, mantê-lo como `❌ AUSENTE — não reconstruível`.

## Próximos ADRs a criar (backlog arquitetural pós-evento)

Decisões que **precisam** de ADR próprio antes de execução (extraído de `docs/architecture/*` seção "Backlog arquitetural"):

| ADR proposto | Tema                                                             | Origem                                       |
| ------------ | ---------------------------------------------------------------- | -------------------------------------------- |
| ADR-011      | Consolidação `mercado-pago-webhook` ↔ `mercadopago-webhook`      | `EDGE-FUNCTIONS.md` + `MP-WEBHOOK-URLS-INVENTORY.md` |
| ADR-012      | Modularização de `src/` em `modules/*` + `shared/` + `core/`     | `FRONTEND.md` / `MODULES.md`                 |
| ADR-013      | Schemas dedicados no Postgres (`bible.*`, `nexus.*`) vs prefixo  | `DATABASE.md`                                |
| ADR-014      | Reorganização física de edge functions em subpastas por domínio  | `EDGE-FUNCTIONS.md`                          |
| ADR-015      | Suite de testes de verificação de assinatura HMAC nos webhooks MP (sandbox), incluindo casos de falha (assinatura inválida, timestamp fora da janela) | Solicitação S0 — **bloqueado por CAT-DOC-002 e pelo congelamento da Sprint S0** |
| ADR-016      | Página interna de auditoria de webhooks MP (lista de eventos, filtros por tipo, export de evidências, correlação com edge function receptora) | Solicitação S0 — **bloqueado pelo congelamento da Sprint S0** (feature nova pré-evento) |
| ADR-017      | Refatoração do módulo Magisterium (escopo a definir: UI, dados, edge functions `vatican-document` / `vatican_cache`) | Solicitação S0 — **bloqueado pelo congelamento da Sprint S0** e por falta de escopo definido |

_Estes são propostas — nenhum foi aprovado. Requerem análise, discussão e aceitação formal via ADR antes de qualquer execução._

### Notas sobre ADR-015, ADR-016 e ADR-017

- **ADR-015** só pode iniciar após: (a) inventário CAT-DOC-002 preenchido, (b) sandbox MP validado, (c) ADR-011 aceito. Testes de assinatura tocam código das edge functions bloqueadas.
- **ADR-016** exige nova rota, novas queries em `webhook_logs`, controle de acesso admin. Feature nova a poucos dias do evento = risco desnecessário. Reavaliar pós-evento.
- **ADR-017** não tem escopo mínimo definido. Antes de virar ADR, o usuário deve especificar: (a) o quê refatorar (UI/dados/edge/todos), (b) motivador (bug, dívida técnica, nova feature), (c) critério de aceite.

