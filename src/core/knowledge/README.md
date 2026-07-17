# src/core/knowledge — Knowledge Engine

Linguagem comum do conhecimento do Cathedra 2.0.

## Por quê

Bíblia, Catecismo, Magistério, Padres, Santos, Temas, Pesquisa e Nexus
falam sobre o **mesmo conhecimento**. Sem uma linguagem comum, cada
módulo modela do seu jeito e surgem duplicações e inconsistências.

O Knowledge Engine é essa linguagem — puramente de domínio, sem UI e
sem infraestrutura.

## API pública

Consumidores externos usam **apenas** `KnowledgeGraph`:

```ts
import { KnowledgeGraph } from '@/core/knowledge';

KnowledgeGraph.findNode('theme:esperanca');
KnowledgeGraph.study('theme:esperanca');       // Estudo Composto
KnowledgeGraph.neighbors('theme:eucaristia');
KnowledgeGraph.pathBetween('theme:eucaristia', 'theme:graca');
KnowledgeGraph.search('esperança');
KnowledgeGraph.resolve('bible:romanos:8');     // { node, url }
KnowledgeGraph.collections();                  // coleções curadas
KnowledgeGraph.membersOf('collection:evangelhos');
```

`KnowledgeRegistry`, `KnowledgeNavigator`, `KnowledgeResolver`,
`KnowledgeIndex` e `KnowledgeCollectionRegistry` **são detalhes de
implementação** e podem mudar sem aviso. Não importe direto.

## Peças internas

| Peça                          | Responde a                                                         |
| ----------------------------- | ------------------------------------------------------------------ |
| `KnowledgeNode`               | Unidade de conhecimento (tema, passagem, doc, padre, santo…)       |
| `KnowledgeRelation`           | Aresta tipada entre dois nós (develops, cites, commented-by…)      |
| `KnowledgeCollection`         | Agrupamento curado de nós (encíclicas, evangelhos, …)              |
| `KnowledgeRegistry`           | Fonte única de nós e relações                                      |
| `KnowledgeNavigator`          | Estudo Composto, `expand`, `pathBetween`                           |
| `KnowledgeResolver`           | `nodeId` → `{ node, url }` via `RouteRegistry`                     |
| `KnowledgeIndex`              | Busca textual normalizada (sem acento)                             |
| `KnowledgeCollectionRegistry` | Fonte única de coleções                                            |
| `KnowledgeGraph`              | Fachada pública única (o que todo consumidor usa)                  |

## Convenção canônica de IDs (Sprint 2.0.4A)

Formato: `<kind>:<slug>[:<sub>...]` — ASCII minúsculo, kebab-case, sem
acentos. Números permanecem numéricos.

| Exemplo                          | Comentário                       |
| -------------------------------- | -------------------------------- |
| `theme:esperanca`                | Tema                             |
| `bible:joao:3:16`                | Livro / capítulo / versículo     |
| `catechism:1817`                 | Parágrafo do CIC                 |
| `magisterium:spe-salvi`          | Documento magisterial            |
| `father:santo-agostinho`         | Padre da Igreja                  |
| `saint:santa-teresinha`          | Santo                            |
| `council:vaticano-ii`            | Concílio                         |
| `canon:983`                      | Cânon do Código Canônico         |
| `prayer:lectio-rm-8`             | Oração / Lectio                  |
| `application:esperanca-provacao` | Aplicação prática                |
| `collection:enciclicas`          | Coleção                          |

Nunca misturar variantes (`joao` vs `João` vs `john` vs `Jn`). Sempre
construa IDs via `buildId(kind, slug, ...sub)` e faça parse via
`parseId(id)`.

## Regra de ouro

Não pode:

- importar de `src/modules/*`
- importar de UI, React, componentes
- conhecer Supabase, `fetch`, React Query, Edge Functions

Pode:

- consumir `src/core/navigation` (RouteRegistry) — apenas dentro do
  `KnowledgeResolver`.

## Referência arquitetural

[ADR-018 — Knowledge Engine](../../../docs/adrs/ADR-018-knowledge-engine.md)
