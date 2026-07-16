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

_Estes são propostas — nenhum foi aprovado. Requerem análise, discussão e aceitação formal via ADR antes de qualquer execução._
