# Sprint B.1 — Refinamento da Biblioteca Cathedra

**Escopo:** transformar `/biblioteca` no hub único de descoberta, sem criar módulos novos e sem quebrar a arquitetura homologada até C0.5.b. Toda a implementação reutiliza `EditorialCard`, `EditorialHero`, `ReaderShell`, `NexusPanel`, `ReferencePopover` e tabelas já existentes.

**Fora do escopo (adiado para C0.6+):** ICE Universal (badge/score/manifest para Bíblia/Missal/LH/Coleções/Jornadas), IA Cathedra, offline, peregrinação, Sprint K.

---

## Diagnóstico rápido (feito antes do plano)

- `/biblioteca` hoje = `AtriumBibliotecaPage` estático + `/biblioteca-legacy` (tabs, filtros por eixo, arrays hardcoded).
- Busca cross-módulo parcial: `GlobalSearchPage` cobre **5 domínios** (santos, glossário, comunidade, temas, jornadas) via RPCs `search_*_fuzzy`. Faltam: bíblia, catecismo, magistério, orações, coleções, patrística.
- `EditorialCard` (compound: `.Eyebrow/.Title/.Description/.References/.Media/.CTA`) já é oficial e tem 3 densidades — **base para todos os cards**.
- Recents/favoritos hoje = `localStorage`. Já existem tabelas DB genéricas por `content_type`: `reading_marks`, `user_history`, `bible_favorites` (chave `content_type`).
- ICE Badge / score não existem como componente nem coluna (`ice_score` = 0 hits). Só `editorial_completeness` (glossário). B.1 introduz badge **derivado** de `editorial_completeness` — o **score numérico** entra na C0.6.
- Tabelas de conteúdo prontas: `glossary`, `catechism_official`, `saints`, `prayers`, `collections`, `journeys`, `spiritual_contents` (magistério provável), `themes`, `tags`, `content_tags`.
- `HomeUnified` já usa padrão adapter-driven (`atriumAdapters`) — B.1 segue o mesmo shape.

---

## Ondas (sequenciais, cada uma auditável)

### Onda B.1.1 — Fundação (adapters, tipos, unified card)

- Criar `src/modules/biblioteca/types.ts` com `LibraryItem` unificado:
  `{ id, module, title, slug, summary, category?, themes?, ice?, nexusCount?, readingMinutes?, href, badge?, updatedAt? }`.
- Criar `src/modules/biblioteca/adapters/` (um arquivo por domínio: `glossary.ts`, `bible.ts`, `catechism.ts`, `saints.ts`, `prayers.ts`, `collections.ts`, `journeys.ts`, `magisterium.ts`, `patristics.ts`, `liturgy.ts`). Cada adapter expõe `list({ limit, offset, filters })` e `resolveHref(item)`. Reusa hooks/RPCs existentes; não introduz Edge Functions nem tabelas.
- Criar `LibraryCard` **como wrapper fino de `EditorialCard`** (não substitui). Recebe `LibraryItem` e monta `.Eyebrow` (ícone + módulo), `.Title`, `.Description`, `.References` (tema + ICE + Nexus + tempo), `.CTA`. Zero markup próprio de card.
- Criar `IceBadge` (novo componente coeso, único badge editorial) derivado de `editorial_completeness` (`draft | review | complete`). Sem `ice_score` numérico nesta sprint.
- Governança: `scripts/biblioteca-card-audit.ts` — falha se qualquer página da Biblioteca renderizar card fora de `LibraryCard`/`EditorialCard`.

### Onda B.1.2 — Busca unificada (extensão do GlobalSearchPage)

- Novo hook `useLibrarySearch(query, { modules, themes })` que **estende** `useFuzzySearch` chamando em paralelo:
  - RPCs existentes: `search_saints_fuzzy`, `search_glossary_fuzzy`, `search_tags_fuzzy`, `search_journeys_fuzzy`.
  - Novos RPCs mínimos (via `supabase--migration`): `search_catechism_fuzzy`, `search_collections_fuzzy`, `search_prayers_fuzzy`, `search_magisterium_fuzzy`, `search_bible_fuzzy` — todos SECURITY DEFINER retornando `id, title, snippet, rank, module` com `GRANT EXECUTE TO anon, authenticated`.
- Cada resultado normalizado em `LibraryItem` via adapters da B.1.1.
- Filtros instantâneos (módulo, tema, `editorial_completeness`) client-side sobre o resultado consolidado; debounce 200ms; ordenação por `rank`.
- Substitui a tab-per-domain de `GlobalSearchPage` por lista unificada com `LibraryCard`. `GlobalSearchPage` original é mantido como shim compatível com `/buscar` legado.

### Onda B.1.3 — Hub `/biblioteca` (visualizações inteligentes)

- Reescrever `AtriumBibliotecaPage` para consumir os adapters. Estrutura:
  - `EditorialHero` (kicker "Biblioteca", título, subtítulo, meta com estatísticas).
  - Barra de busca (chama `useLibrarySearch`, resultados inline).
  - Chips de filtro por módulo (13 módulos) e por tema (13 temas fixos: Deus, Trindade, Sacramentos, Maria, Igreja, Liturgia, Moral, Vida Espiritual, Oração, Santos, Escatologia, Catequese, Escritura).
  - Trilhas: **Continuar leitura** (`reading_marks` DESC), **Recentes** (`user_history`), **Favoritos** (`bible_favorites` cross-module), **Mais estudados** (heurística por `user_history` GROUP BY content_id LIMIT 20), **Recomendados** (por tema do último item aberto), **Descobertas** (últimos publicados/atualizados).
  - Cada trilha é um `<section>` com `LibraryCard` virtualizado via `react-window` (já disponível no projeto? confirmar; se não, `Intersection Observer` + paginação manual).
- Migra recents do `localStorage` (`useBibliotecaRecents`) para `user_history` DB-backed, com fallback ao localStorage para anônimos.
- `/biblioteca-legacy` mantido durante 1 sprint como escape hatch, com banner "esta é a versão legada".

### Onda B.1.4 — Temas & Jornadas (visões cruzadas)

- Novas rotas dentro do hub (não novas páginas soltas):
  - `/biblioteca?tema=<slug>` — usa `themes` + `theme_contents` + fallback por `content_tags` para agregar itens de todos os módulos naquele tema.
  - `/biblioteca?jornada=<slug>` — agrupa por tempo litúrgico (Advento, Quaresma, Páscoa, Pentecostes, Ano Litúrgico) e trilhas de iniciação/sacramentos, resolvidos via `journeys.category`.
- Hub de estudos lateral (desktop ≥lg): componente `LibraryStudyRail` com "Referências relacionadas" (Nexus do item ativo via `NexusPanel`), "Próximo estudo" (do adapter recomendador), "Progresso" (`journey_progress` + `collection_progress` agregados). Não aparece em mobile — usa o rodapé `ReaderContinuation` já existente.

### Onda B.1.5 — Performance, estatísticas, homologação

- Estatísticas no `EditorialHero.meta`: publicados / com selo `complete` / módulos homologados (lê `docs/c0-homologation-checklist.md`). Sem novo dashboard.
- Performance:
  - Virtualização em toda lista >30 itens.
  - Prefetch do próximo item ao hover de `LibraryCard`.
  - Cache TanStack Query com `staleTime` 5min por adapter.
  - Paginação infinita via `useInfiniteQuery`.
- Auditoria bloqueante `scripts/biblioteca-audit.ts`:
  - 0 imports de componentes de card legados (`SearchResultCard`, `CathedraCard`) dentro de `src/modules/biblioteca/` e `src/pages/AtriumBibliotecaPage.tsx`.
  - `LibraryCard` presente em toda seção.
  - Search hook cobre os 9+ módulos.
- Teste estático `src/test/biblioteca.static.test.ts` + spec E2E `tests/e2e/biblioteca.spec.ts` (busca, filtros, continuar leitura, tema, jornada).
- Integrar as duas auditorias ao `.github/workflows/seo-and-tests.yml`.

---

## Detalhes técnicos

### Estrutura de pastas

```text
src/modules/biblioteca/
  types.ts
  adapters/
    index.ts
    glossary.ts   bible.ts   catechism.ts   saints.ts
    prayers.ts    collections.ts   journeys.ts
    magisterium.ts   patristics.ts   liturgy.ts
  hooks/
    useLibrarySearch.ts
    useLibraryTrail.ts       # Continuar / Recentes / Favoritos / etc.
    useLibraryStats.ts
  components/
    LibraryCard.tsx          # wrapper de EditorialCard
    LibraryFilters.tsx
    LibraryTrail.tsx
    LibraryStudyRail.tsx
    IceBadge.tsx
```

### Banco

- Migrações apenas para RPCs de busca faltantes (fuzzy `catechism`, `collections`, `prayers`, `magisterium`, `bible`). Sem novas tabelas nem colunas. `GRANT EXECUTE` para `anon`/`authenticated` em cada função.
- `user_history` já existe e é usado para "Recentes" cross-módulo. `reading_marks` já é usado para "Continuar leitura". Nenhuma migração de dados.

### Compatibilidade

- `/library`, `/biblioteca`, `/biblioteca-legacy`, `/buscar` preservados.
- `SearchResultCard` mantido apenas dentro de `GlobalSearchPage` legado, com JSDoc `@deprecated — usar LibraryCard`.
- `CathedraCard` fora do escopo (é card de dashboard, não da Biblioteca).

### Riscos

- **Alto** apenas na Onda B.1.2 (RPCs novas). Reversível: cada migração cria função nova, sem alterar existentes; rollback = `DROP FUNCTION IF EXISTS`.
- **Baixo** nas demais ondas.

### Critério de aceite (fim da B.1.5)

- `/biblioteca` é a única porta de descoberta, cobrindo 13 módulos.
- Busca unificada retorna resultados de ≥ 9 domínios em ≤ 400ms (dataset atual).
- Todo item renderizado é `LibraryCard` sobre `EditorialCard`.
- `scripts/biblioteca-audit.ts` verde no CI.
- Zero regressão em Reader/Prayer/Chrome (auditorias C0.3/C0.4/C0.5/C0.5.b continuam verdes).
- Pronta para receber ICE Universal (C0.6) sem refatoração adicional.

---

## Como valido no fim de cada onda

1. `bunx tsx scripts/biblioteca-*-audit.ts` verde.
2. `bunx vitest run src/test/biblioteca.static.test.ts` verde.
3. `tsgo --noEmit` sem erros nos arquivos tocados.
4. Playwright: `/biblioteca` responde em ≤ 400ms na busca.
5. Engineering Log padrão COS ao fim de cada onda.

Confirmar para eu abrir a **Onda B.1.1** já.
