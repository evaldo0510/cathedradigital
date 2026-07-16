# Arquitetura de Referência Oficial — Cathedra

Documentação canônica da arquitetura atual. **Descreve o estado real do projeto**, não uma arquitetura desejada.

**Escopo desta fase (aprovada):** apenas documentação. Nenhuma reorganização de código, banco, edge functions ou pastas.

## Índice

| Documento                                    | Cobertura                                                       |
| -------------------------------------------- | --------------------------------------------------------------- |
| [ARCHITECTURE.md](./ARCHITECTURE.md)         | Visão geral, stack, princípios, macroarquitetura                |
| [MODULES.md](./MODULES.md)                   | Módulos funcionais (CAT-001…CAT-015)                            |
| [FRONTEND.md](./FRONTEND.md)                 | Camada React/Vite (ARC-100)                                     |
| [BACKEND.md](./BACKEND.md)                   | Edge Functions + shared libs (ARC-200)                          |
| [DATABASE.md](./DATABASE.md)                 | Postgres, RLS, migrações, RPC (ARC-300)                         |
| [EDGE-FUNCTIONS.md](./EDGE-FUNCTIONS.md)     | Catálogo detalhado das 55 edge functions                        |
| [SECURITY.md](./SECURITY.md)                 | Autenticação, autorização, secrets, LGPD (ARC-500)              |
| [OBSERVABILITY.md](./OBSERVABILITY.md)       | Logs, métricas, tracing, dashboards (ARC-600)                   |

## Documentos de apoio (fora desta pasta)

- [`docs/ARCHITECTURE-CODES.md`](../ARCHITECTURE-CODES.md) — Taxonomia oficial de códigos ARC/CAT
- [`docs/ARC-MAP.md`](../ARC-MAP.md) — Mapeamento código → caminhos reais no repositório
- [`docs/EDGE-FUNCTIONS-COMPLIANCE-MATRIX.md`](../EDGE-FUNCTIONS-COMPLIANCE-MATRIX.md) — Matriz de conformidade das funções
- [`docs/EDGE-FUNCTIONS-STRICT-ENVELOPE-MATRIX.md`](../EDGE-FUNCTIONS-STRICT-ENVELOPE-MATRIX.md) — Contratos HTTP
- [`docs/SECURITY-DEFINER-ALLOWLIST.md`](../SECURITY-DEFINER-ALLOWLIST.md) — Funções SECURITY DEFINER autorizadas
- [`docs/OBSERVABILITY-OTEL.md`](../OBSERVABILITY-OTEL.md) — Instrumentação OpenTelemetry
- [`docs/PERFORMANCE-BASELINE-v2.md`](../PERFORMANCE-BASELINE-v2.md) — Baseline atual de performance
- [`docs/MP-WEBHOOK-URLS-INVENTORY.md`](../MP-WEBHOOK-URLS-INVENTORY.md) — Inventário de webhooks Mercado Pago (**pendente preenchimento**)

## Convenções

Cada documento contém quatro seções fixas:

1. **Estado atual** — o que existe hoje, verificável no repositório.
2. **Estado homologado** — o que passou por revisão e é a fonte da verdade.
3. **Dívida técnica** — o que está inconsistente, duplicado, ausente ou pendente.
4. **Propostas pós-evento** — ideias registradas para avaliação futura, sem execução autorizada nesta sprint.

## ADRs

Referências a `ADR-XXX` neste conjunto de documentos apontam para uma numeração
**ainda não materializada** no repositório. Ver dívida técnica em
[ARCHITECTURE.md](./ARCHITECTURE.md#dívida-técnica).

## Backlog arquitetural (pós-evento)

Registrado, **não aprovado**. Cada item exige ADR próprio antes de qualquer execução.

- **Proposta A — Modularização por domínio no `src/`** (`modules/bible`, `modules/catechism`, …). Requer ADR próprio.
- **Proposta B — Consolidação de Edge Functions** (agrupamento por domínio). Requer inventário de URLs em produção + plano de migração; ver `docs/MP-WEBHOOK-URLS-INVENTORY.md`.
- **Proposta C — Evolução da arquitetura do banco** (schemas por domínio no lugar de prefixo `bible_*`). Avaliar apenas se houver ganho mensurável frente ao custo de reescrever policies RLS, GRANTs e types gerados.
- **Proposta D — Refatoração do Frontend** (após estabilização pós-evento).

_Versão 1.0 — sprint arquitetural pré-evento. Atualizar em cada mudança estrutural relevante._
