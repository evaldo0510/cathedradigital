# Reader Template Master — Bíblia como padrão-ouro

Auditoria inicial da Sprint **Nexus 2.0 + Catecismo 2.0**. Mapeia o que hoje existe no leitor bíblico e o que precisa ser extraído para virar o **Template Mestre** reutilizado por todos os módulos.

## Módulos-alvo (mesmo padrão de leitura)
Bíblia · Catecismo · Glossário · Santos · Padres · Missal · Liturgia das Horas · Orações · Jornadas · Coleções · Magistério.

## Estado atual — leitor bíblico

| Peça | Local | Reusável? | Ação |
|---|---|---|---|
| Página principal | `src/components/cathedra/Bible.tsx` (2468 LoC) | Parcial | Fatiar em `ReaderShell` + adapter |
| Reader wrapper | `src/components/cathedra/BibleReader.tsx` (267 LoC) | Sim | Base para `ReaderShell` |
| Popover de versículo | `src/components/cathedra/BibleVersePopover.tsx` (171 LoC) | Sim | Referência do "bolha padrão" |
| Header/hero editorial | `src/components/editorial/EditorialReaderHeader.tsx` | **Sim** | Já é primitivo — manter |
| Filete dourado | `EditorialDivider` (`src/components/editorial/`) | **Sim** | Já é primitivo |
| Skeleton | `SacredSkeleton.tsx` (`CatechismParagraphSkeleton`, etc.) | Sim | Padronizar em `ReaderSkeleton` |
| Nexus (bolhas) | `NexusBubbles.tsx` + adapters `bibleAutoNexus`, `catechismAutoNexus`, `glossaryAutoNexus`, `saintAutoNexus`, `journeyAutoNexus`, `prayerAutoNexus`, `magisteriumAutoNexus` | **Sim (adapters)** | Consolidar UI em `NexusPanel` |
| Continuation (rodapé) | `src/components/shared/ReaderContinuation.tsx` | Sim | Manter — já é único |
| Favoritos | `useFavorites` (`src/hooks/useFavorites`) | Sim | Já é global |
| Notas | `useNotes` + `NotesPanel`, `NoteEditModal`, `ChapterNotesList` | Sim | Já é global |
| Histórico de leitura | `useReadingMarks` | Sim | Já é global |
| Cache de conteúdo | `useCatechismParagraph`, `bible-text` edge, `LiturgyProvider` | Parcial | Cada domínio mantém seu hook — OK |
| Compartilhamento | `PassageActions` (`src/components/shared/PassageActions.tsx`) | **Sim** | Já é único |
| Áudio | `AudioButton` | Sim | Já é global |
| Layout contemplativo | `ContemplativeLayout` | **Sim** | Já é primitivo |
| Painel de reading settings | `ReadingControlPanel` + `useReadingSettings` | Sim | Já é global |

## Diagnóstico

O que **já é único** e não precisa refatoração:
- `EditorialReaderHeader`, `EditorialDivider`, `ContemplativeLayout`, `ReaderContinuation`, `PassageActions`, `useFavorites`, `useNotes`, `useReadingMarks`, `useReadingSettings`, `AudioButton`, adapters de `ReaderAutoNexus`.

O que **está duplicado ou disperso** e precisa consolidação:
1. **UI do Nexus** — hoje há `NexusBubbles`, local `AutoNexusList`/`NexusFullList` em `GlossaryTermPage`, `MysteryNexusPanel` no Rosário, blocos ad-hoc em `JornadaDetailPage`. → **Consolidar em `NexusPanel` (Fase A)**.
2. **Popovers de referência** — `BibleVersePopover`, `CatechismPopover`, `MagisteriumPopover` são quase idênticos em estrutura. → Extrair `ReferencePopover` genérico (Fase A/B).
3. **Reader shell** — cada página monta o próprio chrome. → Extrair `ReaderShell` que consome `ReaderContent` (contrato já existe em `src/core/content/contracts/ReaderContent.ts`).

## Ordem canônica dos buckets por módulo

| Módulo | Buckets (ordem) |
|---|---|
| Bíblia | catechism · glossary · saint · father · prayer · journey · liturgy |
| Catecismo | bible · glossary · saint · father · magisterium · prayer · journey |
| Glossário | bible · catechism · saint · father · magisterium · prayer · journey |
| Santos | bible · catechism · glossary · prayer · journey |
| Padres | bible · catechism · glossary · saint · magisterium |
| Missal / LH | bible · catechism · prayer · saint · father |
| Orações | bible · catechism · glossary · saint |
| Jornadas | bible · catechism · glossary · saint · prayer |
| Coleções | segue o item raiz |
| Magistério | bible · catechism · glossary · father |

## Fase A — entregue nesta sprint
- [x] `NexusPanel` unificado (`src/components/nexus/NexusPanel.tsx`)
- [x] Catecismo passa a renderizar `NexusPanel` com ordem canônica
- [x] Buckets do `catechismAutoNexus` expandidos para incluir `father`
- [x] Documento de auditoria (este arquivo)

## Fase B — próximos passos
- [ ] Extrair `ReferencePopover` genérico (bible/catechism/magisterium)
- [ ] Extrair `ReaderShell` consumindo `ReaderContent`
- [ ] Migrar `GlossaryTermPage.AutoNexusList` para `NexusPanel`
- [ ] Migrar `JornadaDetailPage` para `NexusPanel`
- [ ] Migrar `MysteryNexusPanel` para `NexusPanel`

## Fase C
- [ ] Missal / Liturgia das Horas / Orações consumindo `ReaderShell`
- [ ] Santos / Padres / Magistério consumindo `ReaderShell`

## Validação obrigatória
- `tsgo` limpo
- E2E existentes verdes: `nexus-bible-multi-viewport`, `bible-cic-helpers`
- `nexus-perf-guardrail` sem regressão
- Baseline a11y (axe) mantido em zero
