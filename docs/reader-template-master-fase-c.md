# Reader Template Master — Fase C

Status: **EM EXECUÇÃO** · Início: 2026-07-23 · Owner: COS
Depende de: Fase B (Reader Architecture Rule oficializada no COS §10 / v1.1).

## Objetivo

Consolidar o **Reader Template Master** como única arquitetura de leitura da Cathedra, começando pelo **Glossário a 100%** e estabelecendo os instrumentos automáticos (auditoria + guardrail) que impedem regressão futura.

```
ReaderShell
  ├─ EditorialHero          (slot: hero)
  ├─ ReaderContent          (slot: children)
  ├─ ReferencePopover       (inline dentro de children)
  ├─ NexusPanel             (slot: nexus)
  └─ ReaderContinuation     (slot: continuation)
```

## Metas de score por módulo (fim da Fase C)

| Módulo | Entry | Score atual | Alvo Fase C | Bloqueante |
| --- | --- | ---: | ---: | :-: |
| Glossário | `src/pages/GlossaryTermPage.tsx` | 100 | **100** | ✅ |
| Catecismo | `src/components/cathedra/Catechism.tsx` | 55 | 90 | ⚠ |
| Bíblia | `src/components/cathedra/BibleReader.tsx` | 50 | 85 | ⚠ |
| Magistério | `src/components/cathedra/MagisteriumViewer.tsx` | 45 | 80 | ⚠ |
| Santos | `src/components/cathedra/SaintDetail.tsx` | 45 | 80 | ⚠ |
| Prayer Engine (Rosário) | `src/components/cathedra/PrayerEngineReader.tsx` | 55 | 85 | ⚠ |
| Jornadas | `src/components/cathedra/JornadaStepPage.tsx` | 45 | 80 | ⚠ |
| Missal | `src/components/liturgy/MissaContinuousReader.tsx` | 60 | 85 | ⚠ |
| Liturgia das Horas | `src/components/liturgy/BreviaryContinuousReader.tsx` | 60 | 85 | ⚠ |
| Coleções | `src/pages/CollectionPage.tsx` | 55 | 80 | ⚠ |
| Novenas | `src/pages/NovenaDetailPage.tsx` | 55 | 80 | ⚠ |

Score é calculado pelo `scripts/reader-template-audit.ts` a partir dos sinais:

| Sinal | Peso | Observação |
| --- | ---: | --- |
| `ReaderShell` importado e renderizado | 30 | Slot canônico obrigatório |
| `EditorialHero` no slot `hero` | 20 | Ou variante Harmony |
| `NexusPanel` presente (ou `nexus={null}` documentado) | 20 | Consolida conexões |
| `ReaderContinuation` no slot `continuation` | 15 | |
| Zero import de componentes proibidos | 15 | ver §Depreciações |

## Gate único da Fase C

Antes de abrir Fase D, **todos** os itens devem estar ✅:

- [ ] Glossário atinge 100 no `reader-template-audit`
- [ ] `reader-template-audit` roda no CI (job dedicado)
- [ ] `reader-guardrail` roda no CI e bloqueia PR em imports proibidos
- [ ] E2E `tests/e2e/reader-template-chain.spec.ts` verde na suíte Chromium
- [ ] Relatório `reports/reader-template.json` publicado como artefato do CI
- [ ] Documento `docs/reader-architecture-master.md` sincronizado com os novos scores

## Depreciações oficiais (banidas via guardrail)

| Componente | Status | Substituto |
| --- | --- | --- |
| `src/components/cathedra/NexusBubbles.tsx` | 🚫 proibido | `NexusPanel` + `ReferencePopover` |
| `src/components/prayer/rosary/MysteryNexusPanel.tsx` | 🚫 proibido | `NexusPanel` alimentado por `prayerAutoNexus` |
| `AutoNexusList` (função local em qualquer página) | 🚫 proibido | `NexusPanel` |
| `NexusFullList` (função local em qualquer página) | 🚫 proibido | `NexusPanel` |
| `TagBubble` (importado de `NexusBubbles`) | 🚫 proibido | `NexusPanel` bucket + `ReferencePopover` |
| Popover custom que envolve referência editorial (`BibleVersePopover`, `BibleDictionaryPopover`, `CatechismPopover`) | ⚠ deprecar em Fase D | `ReferencePopover` |
| Uso direto de `@radix-ui/react-popover` fora de `src/components/ui/popover.tsx` e `src/components/reader/ReferencePopover.tsx` | 🚫 proibido | `ReferencePopover` |

Allowlist do guardrail:

- Os próprios arquivos deprecados (para permitir a existência marcada como `@deprecated` até a Fase D).
- Testes que exercitam os arquivos deprecados.
- Primitivo shadcn `src/components/ui/popover.tsx`.

## Checklist operacional

### Sub-onda C.1 — Instrumentação (bloqueante desta fase)
- [x] `scripts/reader-template-audit.ts`
- [x] `scripts/reader-guardrail.ts`
- [x] `tests/e2e/reader-template-chain.spec.ts`
- [x] `src/test/reader-template-chain.static.test.ts`
- [x] Job `reader-guardrail` em `.github/workflows/seo-and-tests.yml`
- [x] `src/config/reader-modules.ts` com registro canônico

### Sub-onda C.2 — Glossário 100%
- [x] `GlossaryTermPage` migrado para `ReaderShell` (Fase B tail)
- [ ] Remoção física de `AutoNexusList`/`NexusFullList` locais (feita — validar no audit)
- [ ] Score = 100 no relatório

### Sub-onda C.3 — Catecismo 90% ✅ (score 100)
- [x] `NexusBubbles` removido de `Catechism.tsx`
- [x] `Catechism.tsx` envelopado em `ReaderShell` (hero=EditorialHero, nexus=NexusPanel, continuation=ReaderContinuation)
- [x] `CatechismPopover` migrado para `ReferencePopover` (adapter fino, zero radix direto)
- [x] Removido do allowlist do guardrail
- [x] `reader-modules.ts` marca catechism como `certified` / blocking

### Sub-onda C.4 — Bíblia 85%
- [ ] Substituir `NexusBubbles` por `NexusPanel` alimentado por `bibleAutoNexus`
- [ ] `BibleVersePopover` / `BibleDictionaryPopover` migrados para `ReferencePopover`

### Sub-onda C.5 — Prayer Engine 85%
- [ ] `PrayerEngineReader` envelopa em `ReaderShell`
- [ ] `MysteryNexusPanel` removido; `NexusPanel` alimentado por `prayerAutoNexus`

## O que fica para Fase D

- Migração completa dos módulos restantes até 100 (Santos, Jornadas, Magistério, Missal, LH, Coleções, Novenas)
- Exclusão física dos arquivos deprecados
- Remoção do allowlist do guardrail
- Publicação do painel público de aderência em `/admin/reader-architecture`

## Comandos

```bash
bun scripts/reader-template-audit.ts           # auditoria com scores
bun scripts/reader-template-audit.ts --json    # relatório JSON
bun scripts/reader-guardrail.ts                # bloqueia imports proibidos
bunx playwright test tests/e2e/reader-template-chain.spec.ts
```
