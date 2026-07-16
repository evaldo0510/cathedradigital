# Architecture Decision Records (ADRs)

Registro formal das decisões arquiteturais do Cathedra Digital.

## Padrão adotado

**MADR (Markdown Architectural Decision Records)** — versão simplificada.

Cada ADR é um arquivo `ADR-NNN-titulo-kebab-case.md` neste diretório, seguindo [`TEMPLATE-ADR.md`](./TEMPLATE-ADR.md).

Referência: <https://adr.github.io/madr/>

## Ciclo de vida

1. **Proposta** — arquivo criado com `Status: Proposta`.
2. **Discussão** — revisão pelo arquiteto técnico/produto.
3. **Aceita** — decisão homologada, `Status: Aceita`, data preenchida.
4. **Substituída/Depreciada** — nunca deletar; marcar `Status: Substituída por ADR-XXX` ou `Status: Depreciada`.

## ⚠️ Situação atual — CAT-DOC-001

Os ADRs **001 a 010** são referenciados em conversas, sprints e na arquitetura de referência (`docs/architecture/`), mas **não existem fisicamente neste repositório**.

Ver [`ADR-STATUS.md`](./ADR-STATUS.md) para o inventário completo de ADRs ausentes.

**Enquanto não forem reconstruídos**, decisões arquiteturais mencionadas como "conforme ADR-00X" devem ser tratadas como **não-versionadas** e sujeitas à reinterpretação.

### Plano de reconstrução (pós-evento)

1. Recuperar contexto das decisões a partir de: histórico de chat, PRs, migrations, código de edge functions.
2. Reconstruir cada ADR usando o `TEMPLATE-ADR.md`, marcando `Status: Reconstruído a partir de evidências` com data.
3. Atualizar `ADR-STATUS.md` a cada reconstrução.

**Não inferir decisões que não puderam ser confirmadas por evidência.** Deixar como `AUSENTE — não reconstruível`.

## Índice

- [`TEMPLATE-ADR.md`](./TEMPLATE-ADR.md) — Template MADR para novos ADRs
- [`ADR-STATUS.md`](./ADR-STATUS.md) — Inventário e status de todos os ADRs
