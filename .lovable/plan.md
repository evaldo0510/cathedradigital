# Sprint Final de Refinamento

O pedido tem dois blocos com naturezas muito diferentes. Proponho separar:

## Bloco A — Auditoria de conformidade Logos 2030 + Stitch (somente leitura)

Uma varredura de 11 módulos (Biblioteca, Glossário, Santos, Orações, Rosário, Liturgia, Jornadas, Trilhas, Bíblia, Catecismo, Magistério) em 15 dimensões (duplicação, layout, espaçamento, tipografia, cartões, hero, botões, chrome, footer, animações, loading, empty, erro, Nexus, ReaderContinuation).

**Entrega:** relatório em `docs/audits/sprint-final-refinamento.md` com:
- Tabela módulo × dimensão com ✔ / ⚠ / ❌
- Lista priorizada de arquivos com duplicação real (com paths e linhas)
- % de aderência por módulo e global
- Backlog sugerido de refactors, sem executá-los

**Regras:** nenhuma linha de código de produção alterada nesta fase. Sem novos módulos, sem remoção de features.

**Por que separar:** aplicar padronização em 11 módulos "de uma vez" é justamente o que produz regressão. Só depois que você aprovar o relatório, abrimos uma sprint dedicada por módulo (ou por dimensão) com escopo controlado.

## Bloco B — 3 entregas concretas do pedido

Estas são bem escopadas e vão junto:

### B1. Export JSON no `NexusMetricsOverlay`
- Adicionar botão "Exportar" ao lado do toggle colapsar
- Gera `nexus-metrics-<timestamp>.json` com snapshot atual: `{ generatedAt, adapters: { glossaryAutoNexus, journeyAutoNexus }, totals }`
- Cada adapter: `hits`, `misses`, `hitRate`, `avgMs`, `lastMs`, `samples`
- Download via `Blob` + `URL.createObjectURL` (sem dependências novas)
- Continua visível apenas em `DEV`

### B2. Guardrail de performance do Nexus no CI
- Novo script `scripts/nexus-perf-guardrail.ts`
- Carrega baseline de `.nexus-perf-baseline.json` (comitado)
- Roda cenário headless (Vitest node) que resolve N verbetes e M jornadas, coleta métricas via `nexusMetrics.snapshot()`
- Falha se, para cada adapter:
  - `hitRate` cair mais que `HIT_RATE_TOLERANCE` (default 5 pp)
  - `avgMs` piorar mais que `AVG_MS_TOLERANCE` (default 20%)
- Limites configuráveis por env vars, com defaults no script
- Novo job no workflow `.github/workflows/seo-and-tests.yml` chamado `nexus-perf` (roda em PR e main)
- Comando local: `bun scripts/nexus-perf-guardrail.ts --update` regrava o baseline

### B3. Teste unitário do `NexusSourceBadge`
- `src/components/nexus/__tests__/NexusSourceBadge.test.tsx` (Vitest + Testing Library)
- Cobre:
  - Foco pelo teclado abre o tooltip (Radix expõe `data-state="open"` no trigger)
  - `Enter` e `Espaço` disparam abertura quando aplicável
  - `Esc` fecha o tooltip
  - `aria-label` inclui `kind` e `id` corretos
- Usa `@testing-library/user-event` já disponível no projeto

## Ordem de execução sugerida

1. Bloco B (baixo risco, entregável hoje)
2. Bloco A (auditoria — precisa de leitura extensa; entrega o relatório sem tocar código)
3. Depois do relatório, você escolhe quais módulos consolidar primeiro em sprints dedicadas

## Detalhes técnicos

- `nexusMetrics.snapshot()` já expõe o estado; nenhuma mudança no pub/sub
- Guardrail roda em Node puro (jsdom não necessário — adapters não dependem de DOM)
- Baseline versionado no repo para reprodutibilidade; regeneração explícita
- Teste do badge usa `TooltipProvider` do shadcn como wrapper

## Fora de escopo desta sprint

- Alterações de UI/UX em produção nos 11 módulos
- Remoção de código legado
- Novos design tokens
