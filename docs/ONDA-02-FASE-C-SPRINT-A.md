# Onda 2 · Fase C · Sprint A — Journey Core criado

**Status:** ✅ Entregue (contrato disponível). Migração de telas segue nas Sprints B–G.

## O que foi criado

```
src/core/journey/
├── JourneyService.ts   # API pública (20 métodos + recommend)
├── JourneyAdapter.ts   # interno · itineraria ↔ journeys
├── types.ts            # Journey, JourneyStep, Progress, Stats, Filters, Recommendation, ServiceResult
├── index.ts            # barrel · exporta APENAS service + tipos públicos
├── README.md           # contrato e regras
└── __tests__/JourneyService.test.ts  # 8/8 verdes
```

## Contrato

```ts
import { JourneyService, type Journey } from "@/core/journey";
```

Envelope padrão `{ data, error }`. `JourneyAdapter` é interno — **não** é reexportado.

## Métodos entregues (20 + 1)

| Grupo     | Métodos |
| --------- | ------- |
| Leitura   | `list`, `getBySlug`, `getById`, `listSteps`, `getStep`, `getFirstStep`, `getRelated` |
| Progresso | `getProgress`, `startJourney`, `completeStep`, `resumeJourney`, `listUserJourneys`, `resetProgress` |
| Admin     | `createJourney`, `updateJourney`, `upsertStep`, `deleteJourney` |
| Stats     | `getStats`, `getGlobalStats`, `getNexusForStep` |
| Extra     | `recommend` (recomendações simples baseadas em categoria) |

## Compatibilidade `itineraria`

- IDs legados prefixados `itin:<uuid>` — sem colisão com UUIDs reais.
- `content.html ↔ content.interpretation` normalizado bidirecionalmente.
- Deep links `/jornadas/:id` continuam funcionando sem redirect.
- **Escrita bloqueada** em ids legados (createJourney/update/upsert/delete/start/complete/reset) — retornam erro claro. Admin edita apenas `journeys` reais.

## Validação

- ✅ Testes unitários: `8/8 passed` (adapter + envelope + roteamento legacy/real + bloqueio de escrita + propagação de erro).
- ✅ Typecheck global: `tsgo --noEmit` — zero erros em `src/core/journey/*`.
- ✅ Zero alteração em telas nesta sprint (contrato disponível para consumo).

## Regra congelada para próximas sprints

> Nenhum componente/hook/edge function acessa `journeys | journey_steps | journey_progress | itineraria*` diretamente. Todo acesso passa por `JourneyService`.

Nenhum novo Registry/Manager/Controller/Provider/Engine será criado. Todo esforço vai para integração das telas.

## Ordem aprovada (Sprints B–G)

| Sprint | Alvo | Impacto |
| ------ | ---- | ------- |
| B | Formação | Alto (percepção direta) |
| C | Hoje | Alto |
| D | Biblioteca (`ContinueReadingHero`, cards, "Descubra") | Médio-alto |
| E | Reader | Médio |
| F | Nexus | Médio |
| G | Admin + Edge Functions | Baixo (backoffice) |

**Gate por sprint:** só se remove import direto do backend quando o arquivo estiver 100% migrado. Typecheck + E2E entre sprints. Nenhuma sprint avança sem homologação.

## Checklist para Sprint B (Formação)

- [ ] Substituir `supabase.from('journeys'|'journey_steps'|'journey_progress')` por `JourneyService.*` em todos os componentes/hooks de Formação.
- [ ] Trocar labels visíveis para **"Formação"** / **"Caminho"** / **"Meus Caminhos"**.
- [ ] Garantir suporte a ids legados (`itin:*`) nos deep links.
- [ ] Rodar E2E existentes + typecheck.
- [ ] Relatório antes×depois.
