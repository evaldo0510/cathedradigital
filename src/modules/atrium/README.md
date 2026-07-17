# Módulo Átrio (`src/modules/atrium/`)

Ambiente Átrio do Cathedra 2.0 — Sprint 2.0.1.

## Regra de ouro (inegociável)

> **Nenhum arquivo deste módulo pode importar de outro ambiente.**
>
> Proibido: `@/components/cathedra/Bible*`, `Catechism*`, `Magisterium*`, `Rosary*`, `Liturgia*`, `Jornada*`, `Itineraria*`, `Trilha*`, `Saints*`, `Aquinas*`, `Search*`, `Profile*`, `Diario*`, `Favorites*`, `LogosAI*`, `HojePage*`, `BibliotecaPage*`, e demais.
>
> Diálogo com outros ambientes acontece **exclusivamente** via `services/` (contratos declarados em `types/`) na Fase 6 — Integrações.

## Estrutura

```
src/modules/atrium/
├── AtriumPage.tsx        # entry point (renderiza o layout base — Fase 2)
├── components/           # AtriumHero, JourneyResumeCard, ThemeExplorer, … (Fase 3)
├── hooks/                # useAtriumState, useAtriumProfile, useAtriumBlocks (Fase 3-4)
├── services/             # contratos com Liturgia, Jornada, Nexus (Fase 6)
├── types/                # AtriumState, AtriumProfile, AtriumBlock, ResumeItem
├── constants/            # BLOCK_PRIORITY, PROFILE_BLOCK_ORDER, ROUTES
└── index.ts              # barrel único — só exporta AtriumPage
```

## Fases da sprint (ordem inegociável)

1. **Estrutura** ← estamos aqui
2. Layout base (sem estilo definitivo)
3. Componentes base (8, todos independentes)
4. Estados (9, com mocks)
5. Responsividade (desktop/tablet/mobile)
6. Integrações (uma por vez)
7. Refinamento (motion, skeletons, empty states)
8. Auditoria (checklist do contrato)

## Fundamentação

- `docs/cathedra-2.0/00-BLUEPRINT.md` §5 Sprint 2.0.1
- `docs/cathedra-2.0/ATRIUM-CONTRACT.md` v1.1 (fonte de verdade)
- `docs/cathedra-2.0/05-WIREFRAMES.md` §Tela 1
