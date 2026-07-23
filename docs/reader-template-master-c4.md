# Sub-onda C.4 — Missal + Liturgia das Horas

**Status:** em andamento. Registrada no COS (Reader Architecture Rule §10).

## Escopo

Migrar `MissalPage` e `BreviaryPage` (incluindo `MissaContinuousReader` e
`BreviaryContinuousReader`) para consumir exclusivamente a cadeia canônica:

```
ReaderShell → EditorialHero → ReaderContent → ReferencePopover → NexusPanel → ReaderContinuation
```

Sequência aprovada pelo arquiteto:

1. ✅ Glossário — 100 (C.2)
2. ✅ Catecismo — 100 (C.3)
3. 🟡 **Missal — meta 100 (C.4)**
4. 🟡 **Liturgia das Horas — meta 100 (C.4)**
5. ⏳ Orações (Prayer Engine) — meta 100 (C.5)
6. ⏳ Santos — meta 100 (C.6)
7. ⏳ Collections — meta 100 (C.7)
8. ⏳ Catequese — nasce sobre a base pronta

Antes de iniciar Catequese: Bíblia, Catecismo, Missal, LH e Orações devem
estar certificados.

## Entregas desta iteração

- `src/config/reader-modules.ts`: registra `missal` e `breviary` como
  módulos oficiais (status `partial`, alvo 90, não-bloqueante enquanto
  a migração está em curso). Ambos entram no allowlist temporário do
  guardrail até a substituição dos leitores contínuos.
- `scripts/cathedra-architecture-score.ts`: reformulado para emitir o
  **Roadmap Executivo por Fases** com deltas persistentes entre execuções.
- `.github/workflows/seo-and-tests.yml`: passa a baixar o relatório
  anterior antes de reexecutar o score, viabilizando a comparação
  domínio-a-domínio no CI.
- `.agents/skills/cathedra-architecture-guardian/SKILL.md`: adiciona
  as **duas regras permanentes** (não-duplicação e justificativa
  obrigatória para não-reuso de `ReaderShell`).

## Contrato do Roadmap Executivo

| Fase | Domínios agregados |
|---|---|
| 1. Fundação | authentication · design-system · nexus |
| 2. Reader Platform | reader-template |
| 3. Prayer Platform | prayer-engine |
| 4. Editorial Platform | editorial-engine |
| 5. Collections | collections |
| 6. Catequese | catechesis |

O CI publica, a cada PR, o overall + score por fase + delta versus o
último relatório artefato — evitando regressão silenciosa.

## Próximo passo executivo

Refatorar `MissalPage` e `BreviaryPage` para envelopar o conteúdo em
`ReaderShell`, expor `NexusPanel` e `ReaderContinuation` nos slots
canônicos, e migrar os leitores contínuos para consumir os primitivos.
Ao concluir: promover ambos para `certified` + `blocking: true` e
remover do `GUARDRAIL_ALLOWLIST`.
