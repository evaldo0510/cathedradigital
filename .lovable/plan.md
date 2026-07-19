# Reconstrução da Linguagem Visual — Editorial*

Escopo grande demais para 1 execução. Divido em 6 sprints entregáveis. Cada sprint = 1 aprovação sua antes de seguir.

**Regras invioláveis (todas as sprints):**
- Zero mudança de lógica, rotas, hooks, services, queries, contratos de props de domínio.
- Apenas troca de wrapper visual + consumo de tokens `stitch-*`.
- Nenhuma primitiva Editorial* importa hook de domínio ou faz fetch.
- Cada sprint entrega antes×depois validado via Playwright (desktop + mobile SE).

---

## Sprint E1 — Primitivas faltantes (fundação)
Criar em `src/components/editorial/` (sem consumir ainda):
1. `EditorialKicker` — versalete dourado standalone
2. `EditorialMeta` — linha contextual discreta
3. `EditorialDivider gold-marker` — variante com marcador central
4. `EditorialProgress` — barra dourada 2px + marcador
5. `EditorialQuote` + `EditorialMarginalia` — citação e numeração marginal
6. `EditorialEmptyState` — vazio contemplativo
7. `EditorialBreadcrumb` — trilha em versalete
8. `EditorialCTA` — botão editorial (fio inferior dourado)
9. `EditorialPanel` — para Nexus/popovers
10. `EditorialBookCover` — capa 3D com linho
11. `EditorialTimeline` + `EditorialChapterCard` — Jornadas

Entrega: primitivas + storybook mínimo em rota `/dev/editorial` (dev-only).

## Sprint E2 — Camada A: Heros de página
Migrar para `EditorialHero`:
- `HomeUnified`, `AboutPage`, `JornadasPage`, `BibleHome`, `GlobalSearchPage`
- `CommunityPage`, `DogmasPage`, `AparicoesPage`, `EncyclopediaPage`, `BreviaryPage`, `AZFaithPage`, `AchievementsPage`, `FavoritesPage`, `DiagnosticoPage`

## Sprint E3 — Camada B: Readers restantes
Aplicar `EditorialReaderHeader` em:
- `AquinasOpera`, `DocumentViewer`, bloco de leitura de `Bible.tsx`

## Sprint E4 — Camada C: Seções, dividers, breadcrumbs
Substituir `<section>`/`<hr>`/breadcrumbs ad-hoc por `EditorialSection` + `EditorialHeader` + `EditorialDivider` + `EditorialBreadcrumb` nas páginas já migradas em E2/E3.

## Sprint E5 — Camada D: Popovers e Nexus
Aplicar `EditorialPanel` em:
- `BibleVersePopover`, `CatechismPopover`, `BibleDictionaryPopover`, painel lateral Nexus, `CrossReferencePanel`

## Sprint E6 — Camada E+F: Jornadas + capas + rodapé
- Timeline de `JornadasPage` → `EditorialTimeline` + `EditorialChapterCard`
- Capas inline de `BibliotecaPage` → `EditorialBookCover`
- `Footer.tsx` → consumir `EditorialFooter`
- Cleanup: remover cores hardcoded remanescentes

---

## Critérios de aceite (por sprint)
- Build passa
- Rotas atingidas idênticas em navegação, dados e estado
- Screenshots antes×depois anexados (desktop 1280 + mobile 375)
- Sem regressão de acessibilidade (contraste AA, focus visível)
- Nenhum import de domínio dentro de `src/components/editorial/`

---

**Começo pela Sprint E1 (primitivas) — só fundação, zero impacto em telas existentes. Aprova?**
