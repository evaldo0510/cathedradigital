# Journey Core

Domínio central de **Formação** (jornadas/caminhos espirituais). Fonte única
de acesso a `journeys`, `journey_steps` e `journey_progress`, com camada de
compatibilidade transparente para o legado `itineraria*`.

## Contrato

```ts
import { JourneyService, type Journey } from "@/core/journey";

const { data, error } = await JourneyService.list({ is_active: true });
```

**Regra congelada:** nenhum componente/hook/edge function acessa as tabelas
`journeys | journey_steps | journey_progress | itineraria | itineraria_steps |
itineraria_progress` diretamente. Todo acesso passa por este service.

Fluxo obrigatório:

```
UI → JourneyService → JourneyAdapter → backend
```

## Nomenclatura (UI)

| Contexto            | Termo         |
| ------------------- | ------------- |
| Coleção / navegação | **Formação**  |
| Unidade individual  | **Caminho**   |
| Lista pessoal       | **Meus Caminhos** |

Domínio interno permanece `Journey` / `journeys`.

## API pública

### Leitura

- `list(filters)` — lista jornadas com filtros (categoria, dificuldade, tags, busca).
- `getBySlug(slug)` — alias de `getById` (schema atual não tem coluna slug).
- `getById(id)` — aceita UUID real ou id legado (`itin:<uuid>`).
- `listSteps(journeyId)` — passos ordenados.
- `getStep(journeyId, order)` — passo específico.
- `getFirstStep(journeyId)` — atalho para `order = 1`.
- `getRelated(journeyId, limit)` — jornadas da mesma categoria.

### Progresso

- `getProgress(userId, journeyId)`
- `startJourney(userId, journeyId)`
- `completeStep(userId, journeyId, stepOrder, reflection?)`
- `resumeJourney(userId, journeyId)` — retorna próximo passo pendente.
- `listUserJourneys(userId)` — jornadas em que o usuário tem progresso.
- `resetProgress(userId, journeyId)`

### Admin

- `createJourney(input)`
- `updateJourney(id, patch)`
- `upsertStep(journeyId, step)`
- `deleteJourney(id)`

### Stats / Nexus

- `getStats(journeyId)` — total de passos, usuários iniciados, concluídos, taxa.
- `getGlobalStats()` — visão agregada.
- `getNexusForStep(stepId)` — vínculos do Nexus (best-effort).
- `recommend(userId, limit?)` — recomendações simples.

Todos retornam `{ data, error }`.

## Compatibilidade `itineraria`

IDs vindos de `itineraria` são prefixados com `itin:` para evitar colisão com
UUIDs de `journeys`. O adapter converte transparentemente. Deep links
`/jornadas/:id` continuam funcionando.

**Escrita no path legado é bloqueada** — `createJourney`, `updateJourney`,
`upsertStep`, `deleteJourney`, `startJourney`, `completeStep` e `resetProgress`
retornam erro claro quando o id começa com `itin:`. Admin edita apenas
`journeys` reais. A migração física ocorre na Fase D.

## O que NÃO fazer

- ❌ Criar novos Registry/Manager/Controller/Provider/Engine.
- ❌ Reexportar `JourneyAdapter` — é interno.
- ❌ Chamar `supabase.from('journeys'|...)` fora de `src/core/journey/`.
- ❌ Adicionar hooks aqui — hooks existentes passam a chamar o service.
- ❌ Renomear o domínio interno (`Journey`, `journeys`) — congelado.

## Migração das telas

Ordem aprovada:

1. Formação
2. Hoje
3. Biblioteca (`ContinueReadingHero`, cards, "Descubra")
4. Reader
5. Nexus
6. Admin + Edge Functions

Uma tela por sprint, com typecheck + E2E entre etapas.
