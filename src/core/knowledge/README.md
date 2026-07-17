# src/core/knowledge — Knowledge Engine (Sprint 2.0.4)

Linguagem comum do conhecimento do Cathedra 2.0.

## Por quê

Bíblia, Catecismo, Magistério, Padres, Santos, Temas, Pesquisa e Nexus
falam sobre o **mesmo conhecimento**. Sem uma linguagem comum, cada
módulo modela do seu jeito e surgem duplicações e inconsistências.

O Knowledge Engine é essa linguagem — puramente de domínio, sem UI e
sem infraestrutura.

## Peças

| Peça                 | Responde a                                                        |
| -------------------- | ----------------------------------------------------------------- |
| `KnowledgeNode`      | Uma unidade de conhecimento (tema, passagem, doc, padre, santo…)  |
| `KnowledgeRelation`  | Aresta tipada entre dois nós (desenvolve, cita, comentado-por…)   |
| `KnowledgeRegistry`  | Fonte única de nós e relações (get / by-kind / neighbors)         |
| `KnowledgeNavigator` | Semântica: **Estudo Composto**, `pathBetween`, `expand`           |
| `KnowledgeResolver`  | Traduz `nodeId` opaco em `{ node, url }` via `RouteRegistry`      |
| `KnowledgeIndex`     | Busca textual sobre nós (normalizada, sem acento)                 |

## Regra de ouro

Não pode:

- importar de `src/modules/*`
- importar de UI, React, componentes
- conhecer Supabase, fetch, React Query, Edge Functions

Pode:

- consumir `src/core/navigation` (RouteRegistry) para resolver URLs

## Fase atual

Sprint 2.0.4: contratos + mocks estáticos (Esperança, Eucaristia, Graça),
alinhados ao `ThemeRegistry` mas sem depender dele.

## Fase futura

Sprint 2.0.5+: `ThemeRegistry` e `SearchRegistry` passam a delegar leitura
ao `KnowledgeRegistry`. Nós reais entram via ingestão do backend, sem
alterar consumidores.

## ID canônico

Formato: `"<kind>:<slug>"` — ex.: `theme:esperanca`, `bible:joao:6`,
`catechism:1817`, `magisterium:spe-salvi`, `father:santo-agostinho`.
IDs são opacos aos consumidores; sempre passe pelo `KnowledgeResolver`.
