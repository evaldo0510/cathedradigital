# Onda 2 — Fase C: JourneyService (arquitetura congelada)

## Regra-mãe

Nenhuma nova camada arquitetural. Nenhum novo Registry/Manager/Controller/Provider/Engine/Facade. Só se cria o que está nesta fase; a partir daqui, todo esforço é integração das telas ao que já existe.

## 1. Localização e contrato

```text
src/core/journey/
├── JourneyService.ts   # API pública (objeto único)
├── JourneyAdapter.ts   # itineraria → journeys + fallback content.html ↔ interpretation
├── types.ts            # Journey, JourneyStep, JourneyProgress, JourneyRecommendation, Filters
├── index.ts            # barrel: exporta APENAS JourneyService + types públicos
└── README.md           # contrato, regras de uso, o que NÃO fazer
```

**Export:** named export `JourneyService` (objeto único, padrão do projeto). Adapter e helpers permanecem internos.
**Import único autorizado nas telas:** `import { JourneyService } from "@/core/journey"`.
**Proibido:** UI chamando o backend direto para `journeys | journey_steps | journey_progress | itineraria | itineraria_steps | itineraria_progress`.

## 2. Fluxo obrigatório

```text
UI → JourneyService → JourneyAdapter → journeys (backend)
```

Adapter absorve `itineraria*` durante a compatibilidade. Quando todos os consumidores migrarem (Fase D), `itineraria*` é removido — sem tocar nada agora.

## 3. Métodos (20, derivados do CAT-031)

- **Leitura (7):** `list`, `getBySlug`, `getById`, `listSteps`, `getStep`, `getFirstStep`, `getRelated`.
- **Progresso (6):** `getProgress`, `startJourney`, `completeStep`, `resumeJourney`, `listUserJourneys`, `resetProgress`.
- **Admin (4):** `createJourney`, `updateJourney`, `upsertStep`, `deleteJourney`.
- **Stats/Nexus (3):** `getStats`, `getGlobalStats`, `getNexusForStep`.

Retorno padronizado `{ data, error }`. Sem novos hooks nesta fase — hooks existentes passam a chamar o service.

## 4. Adapter de compatibilidade

- `JourneyAdapter.fromItineraria(row)` / `.fromItinerariaStep(row)`: mapeia campos e prefixa IDs de itineraria com `itin:` para evitar colisão.
- `JourneyAdapter.normalizeContent(content)`: se falta `interpretation` e existe `html`, copia; e vice-versa (para admin).
- `getBySlug` consulta `journeys` primeiro; se ausente, tenta `itineraria` via adapter. Deep links `/jornadas/:slug` seguem funcionando sem redirect.
- Escrita no path adaptado é bloqueada nesta fase (admin edita só `journeys` reais).

## 5. Ordem de integração (revisada)

Sprint A (agora): criar `src/core/journey/*` + testes.
Sprint B: **Formação** migrada 100% para `JourneyService`.
Sprint C: **Hoje** migrado.
Sprint D: **Biblioteca** (`ContinueReadingHero`, cards, "Descubra") migrada.
Sprint E: Reader.
Sprint F: Nexus.
Sprint G: Admin + Edge Functions.

Regra por sprint: só se remove import direto do backend quando o arquivo estiver 100% no service. Typecheck + E2E entre sprints. Nenhuma sprint avança sem homologação sua.

## 6. Nomenclatura congelada (só strings de UI)

- Menu/navegação: **"Formação"**.
- Unidade individual: **"Caminho"/"Caminhos"** (título de "Minha Jornada" passa a "Meus Caminhos").
- Rotas, tabelas e domínio interno (`Journey`, `JourneyService`, `journeys`) permanecem.

Aplicada apenas nas telas tocadas em cada sprint — não faço varredura global agora.

## 7. Entregáveis desta Sprint A

1. `src/core/journey/{JourneyService.ts,JourneyAdapter.ts,types.ts,index.ts,README.md}`.
2. Testes unitários dos 20 métodos + adapter (`itineraria` → `Journey`, fallback de content).
3. Typecheck limpo. Zero mudança em telas (contrato disponível, migração começa na Sprint B).
4. Relatório curto `docs/ONDA-02-FASE-C-SPRINT-A.md` com API pública e checklist para as sprints seguintes.

## 8. Fora de escopo

- Migração de qualquer tela (Sprints B–G).
- Alteração de schema, remoção de `itineraria*`, novos hooks, novas rotas.
- Qualquer novo Registry/Manager/Provider/Engine.
