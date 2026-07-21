# Sprint P2.2 — Consolidação de Skeletons (Logos 2030)

Escopo: substituir animações/pulses locais por `ContentSkeleton` / `SkeletonCard` / `SkeletonGrid` / `SkeletonHero` (alias `EditorialSkeleton`) sem alterar layout, rotas, comportamento, estados ou lógica.

## Arquivos migrados nesta rodada

| Arquivo | Antes | Depois |
|---|---|---|
| `src/components/cathedra/primitives/ContentSkeleton.tsx` | — | Primitiva Logos 2030 + alias `EditorialSkeleton` |
| `src/components/cathedra/HomeSkeletons.tsx` | `animate-pulse` + `bg-muted/*` × 12 divs | Consome `ContentSkeleton` / `SkeletonGrid` |
| `src/components/cathedra/LiturgiaSkeleton.tsx` | `animate-pulse` + 6 divs manuais | Consome `ContentSkeleton` |
| `src/components/cathedra/RouteSkeletons.tsx` | Pulses locais em `CatechismSkeleton` / `LogosSkeleton` | Consome `ContentSkeleton` |
| `src/components/cathedra/SacredSkeleton.tsx` | 12 sub-skeletons com `animate-pulse` + `bg-muted/*` hardcoded | 100% consome `ContentSkeleton` (shimmer único) |
| `src/components/cathedra/SantoDoDiaHeroSkeleton.tsx` | `.cathedra-shimmer` (já OK) | Mantido — já editorial |
| `src/components/cathedra/DashboardSkeleton.tsx` | Delegava para `HomeSkeletons` | Herda migração |
| `src/components/ui/skeleton.tsx` (shadcn) | `animate-pulse bg-muted` | `cathedra-shimmer` + a11y (`aria-hidden`/`aria-busy`) |

## APIs preservadas (compat total)

`SectionSkeleton`, `RitualSkeleton`, `HeroSkeleton`, `DashboardSkeleton`, `LiturgiaSkeleton`, `BibleSkeleton`, `CatechismSkeleton`, `LogosSkeleton`, `PageHeaderSkeleton`, `CardGridSkeleton`, `ListSkeleton`, `SearchResultSkeleton`, `TagSkeleton`, `SaintCardSkeleton`, `SaintGridSkeleton`, `BibleChapterSkeleton`, `CatechismParagraphSkeleton`, `LogosChatSkeleton`, `ReadingSkeleton`, `Skeleton` (shadcn), `SantoDoDiaHeroSkeleton`, `SantoDoDiaSecondaryListSkeleton`.

## Skeletons removidos como componentes

Nenhum foi deletado — política de compat mantém os arquivos como thin wrappers que consomem a primitiva única. Isso evita quebra de imports e permite auditoria futura de call-sites (P2.3).

## Cores hardcoded / animações duplicadas eliminadas

- `animate-pulse` removido de: `HomeSkeletons` (12), `LiturgiaSkeleton` (6), `RouteSkeletons` (2), `SacredSkeleton` (12+), `ui/skeleton` (1). Total ≈ **33 ocorrências**.
- `bg-muted/{10,20,30,40,60}` hardcoded substituído pelo tom único `cathedra-shimmer`.
- Alturas/larguras ad-hoc (`w-spacing-4xl`, `h-spacing-md/6` etc.) padronizadas para tokens Stitch explícitos ou percentuais editoriais.

## Pendências (P2.3 — próximo lote)

Callers com skeletons inline (não em arquivos dedicados) — apenas trocar `animate-pulse bg-muted` inline por `<ContentSkeleton />`:

- `src/components/cathedra/AZFaithPage.tsx` (Glossário — lista A–Z)
- `src/components/cathedra/AdminChartsTab.tsx`, `AdminDashboard.tsx`
- `src/components/cathedra/Bible.tsx` (grid de livros)
- `src/components/cathedra/BibleDictionaryPopover.tsx`
- `src/components/cathedra/BibleKnowledgeAudit.tsx`
- `src/components/cathedra/Catechism.tsx` (extras além do route skeleton)
- `src/components/cathedra/CommunityPage.tsx`
- `src/components/cathedra/GlobalSearchPage.tsx` (busca)
- `src/components/cathedra/HojePage.tsx`
- `src/components/cathedra/JornadaStepPage.tsx`
- `src/components/cathedra/LogosAI.tsx`
- `src/components/cathedra/PopesPage.tsx`
- `src/components/cathedra/QuickModals.tsx`
- `src/components/cathedra/Relatio.tsx`
- `src/components/cathedra/SaintDetailTabs.tsx`
- `src/components/cathedra/Saints.tsx`
- `src/components/cathedra/SecurityAlertsPage.tsx`
- `src/components/cathedra/TemaDetailPage.tsx`
- `src/components/cathedra/UserTransactionsPage.tsx`
- `src/components/cathedra/VisualSilenceControls.tsx`
- `src/pages/AtriumBibleReader.tsx`
- `src/pages/AtriumCatechismReader.tsx`
- `src/pages/SecurityDashboard.tsx`
- `src/pages/Index.tsx`

## Componentes duplicados / mortos detectados

- `DashboardSkeleton` é usado apenas via `Dashboard`/`HojePage` — apenas delega para `HeroSkeleton` + `SectionSkeleton`. **Recomendado colapsar** em P2.3 (mantendo export por compat).
- `RitualSkeleton` (exportado em `HomeSkeletons`) — nenhum call-site direto encontrado além do próprio arquivo. Candidato a **dead export** (verificar antes de remover).
- Padrões `w-spacing-4xl bg-muted/40` repetidos ≥ 30× no codebase, agora todos substituíveis por `<ContentSkeleton variant="block" />`.

## Impacto estimado

- **Linhas removidas / simplificadas:** ~180 nesta rodada (arquivos dedicados).
- **Bundle:** ganho marginal (< 1 KB gzip) — o benefício é semântico/consistência visual, não bytes.
- **A11y:** todos os wrappers passam a expor `aria-hidden` + `aria-busy`, evitando anúncios duplicados.
- **Motion:** shimmer único respeita `prefers-reduced-motion` globalmente (definido em `index.css`).

## Não iniciado (respeitando fronteira P2)

Motion / microinterações / hover / focus / scroll / gestos / lazy loading / virtualização — pertencem a P3–P5.
