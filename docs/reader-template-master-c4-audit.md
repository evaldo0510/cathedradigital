# C.4 — Liturgical Reader Platform · Auditoria de Duplicação (pré-migração)

**Status:** somente leitura. Nenhum arquivo foi modificado nesta etapa.
**Escopo:** Missal + Liturgia das Horas.
**Meta pós-C.4:** Missal 100 · LH 100 · dentro da cadeia canônica `ReaderShell → EditorialHero → ReaderContent → ReferencePopover → NexusPanel → ReaderContinuation`.

## A. Inventário

| Path | O que renderiza | Equivalente canônico |
|---|---|---|
| `src/components/cathedra/MissalPage.tsx:307-370` | Hero centralizado (já usa `EditorialHero`) + tabs `celebracao/proprio/ordinario` + `LiturgyDateNav` | `EditorialHero` presente; **sem** `ReaderShell` — hero/conteúdo/nexus/continuation vivem soltos |
| `MissalPage.tsx:196-266` | Header de reader (voltar, `ReaderTypographyControl`) + `PrayerEngineReader` + nav prev/next de etapas (`:228-264`) | `ReaderShell` (não usado — delega a `PrayerEngineReader`, ele mesmo `pending`/allowlisted); nav prev/next é candidato a `ReaderContinuation` |
| `MissaContinuousReader.tsx:56-166` | `SlotCard` local reimplementando "cartão de leitura" genérico | Sem primitivo canônico em `@/components/reader`; próximo é `LiturgyReadingCard`/`LiturgyPsalmCard` já em `primitives/liturgy` — duplicação **interna** |
| `MissaContinuousReader.tsx:352-362` | Cabeçalho de dia + `LiturgyRichHeader` (tempo, cor, celebração, saltério) | **É exatamente o "LiturgicalContext" pedido pelo arquiteto** — já existe e já renderiza season/color/grade/celebration |
| `MissaContinuousReader.tsx:394-405` | `MissaClosingActionCard` + `ReaderContinuation` (uso correto do canônico) | `ReaderContinuation` |
| `MissaContinuousReader.tsx:416-435` | `BackToTopFab` local | Sem canônico; pequeno, baixo risco |
| `BreviaryContinuousReader.tsx:66-112` | `SlotCard` local (quase idêntico ao do Missal, variantes `antiphon/psalm/concluding`) | Mesma duplicação — dois `SlotCard` divergentes fazendo a mesma coisa |
| `BreviaryContinuousReader.tsx:162-186` | `HourSection` header (tempo litúrgico via `office.season_note` apenas — versão empobrecida do LiturgicalContext) | `LiturgyRichHeader` |
| `BreviaryContinuousReader.tsx:341-363` | `ReaderContinuation` (uso correto) | canônico |
| `BreviaryPage.tsx:460-573` | Hero manual em HTML puro (h1 + p, **não** usa `EditorialHero`) | `EditorialHero` — **gap real** |
| `BreviaryHourInline.tsx:120-133` | Hero manual em HTML puro + `LiturgyRichHeader` inline | Mesmo gap: não usa `EditorialHero`, mas já usa `LiturgyRichHeader` |
| `primitives/liturgy/LiturgyRichHeader.tsx` | Chips: tempo, cor, celebração, santo, saltério | **Fonte canônica candidata do novo slot `LiturgicalContext`** |
| `primitives/liturgy/LiturgyDayHeader.tsx` | Cabeçalho de dia paralelo — **não referenciado** por Missal/Breviário | Órfão/duplicado de `LiturgyRichHeader` (usado só em `LiturgiaPage.tsx`) |
| `primitives/liturgy/LiturgyDateNav.tsx` | Navegador de data (usa `Popover` shadcn direto — não é referência inline, ok) | Primitivo de domínio legítimo |
| `primitives/liturgy/ReaderTypographyControl.tsx` | Controle de densidade tipográfica | Primitivo de app-shell reutilizável |
| `primitives/liturgy/HourRecommendationCard.tsx` | Cartão "próxima hora" com CTA | Sobreposição conceitual parcial com `ReaderContinuation` (pré-leitura, não pós) |
| `hooks/useMissalProper.ts`, `useDailyLiturgy.ts`, `useRecommendedHour.ts`, `useReaderTypography.ts`, `useWakeLock.ts` | Hooks de domínio/app-shell puros | Não duplicam Reader/Nexus/Popover — corretos |
| `core/liturgy/LiturgyProvider.ts` | `DailyLiturgy` (season, cor, colorToken, liturgia) | Fonte de dados correta do LiturgicalContext |
| `core/knowledge/adapters/liturgyAutoNexus.ts` | Adapter `ReaderAutoNexus` — **não usado** por Missal/Breviário (usam `resolvePrayerAutoNexus`) | Adapter órfão frente ao escopo C.4 — resolver antes de plugar `NexusPanel` |

## B. Tabela de Duplicação

| Item | Classificação | Substituto canônico | Risco |
|---|---|---|---|
| `SlotCard` em `MissaContinuousReader.tsx:56-83` | **adaptar** | `LiturgyBlockCard` único em `primitives/liturgy/` (fundir com `LiturgyReadingCard`/`LiturgyPsalmCard`) | Médio — variantes divergem entre Missa e LH |
| `SlotCard` em `BreviaryContinuousReader.tsx:66-112` | **adaptar** | idem acima | Médio |
| Hero manual (`h1`+`p`) em `BreviaryPage.tsx:468-481` | **adaptar** | `EditorialHero` | Baixo |
| Hero manual em `BreviaryHourInline.tsx:120-133` | **adaptar** | `EditorialHero` + slot Context com `LiturgyRichHeader` | Baixo |
| `HourSection` header em `BreviaryContinuousReader.tsx:181-185` (só `season_note`) | **remover** | `LiturgyRichHeader` | Baixo |
| `LiturgyDayHeader.tsx` | **remover** (após confirmar uso só em `LiturgiaPage.tsx`) | `LiturgyRichHeader` | Médio — confirmar antes |
| Nav prev/next de etapas do Ordinário (`MissalPage.tsx:228-264`) | **adaptar** | `ReaderContinuation` em modo `liturgical` (via suggestions pré-computadas) | Baixo-médio |
| `HourRecommendationCard` | **reutilizar** | Não é duplicata direta (é pré-leitura) | Baixo |
| `BackToTopFab` em `MissaContinuousReader.tsx:416-435` | **reutilizar/manter local** | Sem canônico; não viola COS | Baixo |
| `LiturgyRichHeader.tsx` | **reutilizar** | Candidato oficial do slot `LiturgicalContext` | Baixo |
| `LiturgyDateNav`, `ReaderTypographyControl`, `RitualOptionSelector`, `MissaClosingActionCard`, `HourSpiritCard`, `MissalProperCards`, `LiturgyHoursOfficeCards` | **reutilizar** | Primitivos de domínio legítimos | Baixo |
| Uso de `resolvePrayerAutoNexus` em vez de `resolveLiturgyAutoNexus` | **adaptar** (decisão de produto) | Avaliar migração para `liturgyAutoNexus` antes de plugar `NexusPanel` | Médio |
| `AutoNexusList`/`NexusFullList`/Reader/Popover/Shell local | **nenhum encontrado** nos 5 arquivos-alvo | — | — |

## C. Slots ausentes por página

**MissalPage.tsx**
- ❌ `ReaderShell` wrap
- ✅ `EditorialHero` (sem slot Context populado com dado litúrgico completo)
- ❌ `NexusPanel`
- ✅ `ReaderContinuation` (fora do shell)
- ❌ `ReferencePopover` inline nas leituras (`ReadingsSlot`, `MissaContinuousReader.tsx:92-103`)

**BreviaryPage / BreviaryContinuousReader / BreviaryHourInline**
- ❌ `ReaderShell` wrap
- ❌ `EditorialHero` (HTML puro em `BreviaryPage.tsx:468-481` e `BreviaryHourInline.tsx:120-133`)
- ❌ `NexusPanel`
- ✅ `ReaderContinuation` (fora do shell)
- ❌ `ReferencePopover` inline em salmodia (`BreviaryContinuousReader.tsx:211-228`)

## D. Novas capacidades

### D.1 — Slot `LiturgicalContext` em `ReaderShell`
- Fonte de dados pronta: `LiturgyRichHeader.tsx` já consome `DailyLiturgy` + `MissalProperRow`.
- Contrato: adicionar `liturgicalContext?: React.ReactNode` opcional em `ReaderShellProps` (`reader/ReaderShell.tsx:26-41`), renderizado entre `hero` e `content` num `<div data-reader-slot="liturgical-context">`, análogo aos slots `nexus`/`continuation`.
- Retrocompatibilidade: prop opcional; os 8 módulos existentes não são afetados.
- Ação paralela: fundir `LiturgyDayHeader` em `LiturgyRichHeader` antes de virar fonte oficial.

### D.2 — Modo `"liturgical"` de `ReaderContinuation`
- **Rota de menor risco:** usar `suggestions` pré-computadas (`ReaderContinuation.tsx:291, 319-323`) alimentadas por um novo `liturgyContinuationAdapter`, **sem** estender o union `kind`.
- O adapter reúne: próxima Hora canônica (reaproveita `useRecommendedHour`/`HOUR_ICON`, hoje duplicado em `BreviaryPage.tsx:51-70`), próxima etapa do Ordinário (hoje em `MissalPage.tsx:145-152`), "Missa de hoje" / "Hora atual" como fallback.
- Alternativa maior (não recomendada em C.4): adicionar `'liturgical'` ao `ReaderContinuationKind` (`ReaderContinuation.tsx:24-31`) e um `case` no switch de `buildSuggestions`. Blast radius maior sobre 7 kinds existentes.

## E. Ordem de migração (menor risco → maior)

1. Unificar os dois `SlotCard` locais em `LiturgyBlockCard` único (`primitives/liturgy/`).
2. Trocar hero HTML por `EditorialHero` em `BreviaryPage.tsx` e `BreviaryHourInline.tsx`.
3. Popular `EditorialHero` com `LiturgyRichHeader` como Context/Meta, eliminando cabeçalho duplicado dentro dos leitores contínuos.
4. Adicionar slot `liturgicalContext` em `ReaderShell` (item D.1) + teste em `reader-template-chain.static.test.ts`.
5. Envolver `MissaContinuousReader`/`BreviaryContinuousReader` num `<ReaderShell>` real, movendo hero/nexus-slot/continuation para os slots formais.
6. Adicionar `NexusPanel` (definir antes: `liturgyAutoNexus` vs `prayerAutoNexus`).
7. Introduzir `ReferencePopover` nas leituras bíblicas/salmos inline.
8. Implementar modo `"liturgical"` de `ReaderContinuation` via adapter (item D.2), substituindo nav prev/next manual do Ordinário e "hora sugerida" duplicada.
9. Promover `missal` e `breviary` em `src/config/reader-modules.ts` para `status: 'certified', blocking: true` e remover as 4 entradas correspondentes do `GUARDRAIL_ALLOWLIST`.

## Open questions

- Confirmar via `rg -n "LiturgyDayHeader" src` que o uso é exclusivo de `LiturgiaPage.tsx` antes de remover.
- Rodar `bun scripts/reader-template-audit.ts` para o score numérico atual de Missal/Breviário (baseline pré-C.4).
- Confirmar via `rg -n "resolveLiturgyAutoNexus" src` se o adapter litúrgico está realmente órfão ou se `LiturgiaPage.tsx` o consome — decide qual adapter alimenta o `NexusPanel` no passo 6.
