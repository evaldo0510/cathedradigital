
# Sprint Biblioteca Católica — Onda 3: Coleções Inteligentes

Preflight: ✅
Classificação: [Editorial, UI/UX, Nexus, Banco de dados]
Skills: cathedra-guardian, cathedra-glossary-editorial-expert (editorial), cathedra-knowledge-graph-expert, cathedra-design-system-guardian

## Impacto
- Módulos: ✔ Coleções, Acervo, Nexus, Busca, ReaderShell, /admin ✖ Prayer/Liturgy Engine
- Banco: sim — novas colunas em `collections`, nova coluna em `collection_items`
- Migração: sim, reversível, não destrutiva (ADD COLUMN + backfill)
- Rotas novas: `/acervo/colecoes/:slug`, `/admin/colecoes/metricas`
- Rotas preservadas: `/acervo`, `/colecoes`, `/colecoes/:slug` (redirect → `/acervo/colecoes/:slug`)
- Risco: médio (mudança editorial ampla, sem quebra de contrato)

---

## Escopo em 6 blocos

### Bloco 1 — Modelo de dados (Migração)
Ampliar `collections` para suportar trilhas de formação:

Novas colunas em `public.collections`:
- `estimated_reading_time_minutes int`
- `difficulty_level text` (enum-check: `iniciante|intermediario|avancado`)
- `recommended_for text[]`
- `hero_quote text`
- `hero_quote_author text`
- `learning_objectives text[]`
- `prerequisites uuid[]` (referências a outras coleções)
- `completion_message text`
- `certificate_eligible boolean default false`
- `program_slug text` (agrupamento futuro — Onda 4 · Centro de Formação)
- `track text` (Formação Fundamental / Santos / Liturgia / Vida Cristã)

Nova coluna em `public.collection_items`:
- `is_locked_until_prev boolean default false` (base para pré-requisitos por item)

RLS/GRANT: manter policies existentes; nenhuma nova policy.

### Bloco 2 — Catálogo oficial expandido
Popular via `supabase--insert` (não é schema):

**Formação Fundamental** (5): Primeiros Passos, Introdução à Bíblia, Introdução ao Catecismo, Como Rezar Diariamente, Como Estudar a Doutrina.
**Santos e Espiritualidade** (8): Doutores, Padres, Místicos Carmelitas, Franciscanos, Dominicanos, Missionários, Santos do Brasil, Mulheres Doutoras.
**Liturgia** (8): Advento, Natal, Quaresma, Semana Santa, Tempo Pascal, Pentecostes, Ano Litúrgico, A Santa Missa.
**Vida Cristã** (8): Virtudes, Vida Interior, Oração, Discernimento, Eucaristia, Confissão, Família Cristã, Santidade no Cotidiano.

Cada coleção: capa (usa `sacredPalette` como fallback), hero_quote, objetivos, tempo estimado, nível, 4–8 itens curados via VIEW `library_items_v1` já existente.

### Bloco 3 — Página dedicada `/acervo/colecoes/:slug`
Nova página `src/pages/acervo/CollectionDetailPage.tsx`:
- Hero editorial (`EditorialHero`) com capa, título, quote, nível, tempo estimado, contagem de itens
- Seção "Objetivos da Trilha" (learning_objectives)
- Seção "Pré-requisitos" (chips clicáveis)
- `CollectionProgressBar` (já existe) no topo sticky
- Botão primário: **Começar coleção** / **Continuar de onde parei**
- Lista guiada de conteúdos com estados: `concluído ✓`, `em andamento`, `próximo`, `bloqueado`
- `EditorialClosure` ao atingir 100% + `completion_message` + recomendações Nexus

Rotas:
- Adicionar em `src/App.tsx`: `/acervo/colecoes/:slug` → `CollectionDetailPage`
- Redirect legado: `/colecoes/:slug` → `/acervo/colecoes/:slug`

### Bloco 4 — Navegação inteligente
Novo hook `src/hooks/useCollectionNavigation.ts`:
- Deriva `nextItem`, `previousItem`, `isLocked(item)` a partir de `useCollectionProgress`
- "Começar coleção" resolve para primeiro item pendente

Card do Acervo (`CollectionCard.tsx`): exibir nível, tempo estimado, total de conteúdos, barra de progresso quando logado.

### Bloco 5 — Integração Nexus + Busca
- Ao concluir coleção: `EditorialClosure` já dispara Nexus; expandir `resolveNexusHref` para `kind = 'collection'` e mostrar 3–4 coleções relacionadas via `nexus_relations`.
- Adicionar `collections` como entidade pesquisável em `search_patristic_library` (nova aba "Coleções" no `BibliotecaBuscaPage`).
- Auto-Nexus por `track`: coleção da mesma track = `see_also`.

### Bloco 6 — Métricas editoriais
Nova página `src/pages/admin/CollectionsMetricsPage.tsx` (guardada por `RoleGuard` admin/editor):
- Total de coleções, itens por coleção, taxa de conclusão, tempo médio de conclusão, top iniciadas, top concluídas.
- RPC `collections_metrics_v1` agregando `collection_progress`.

---

## Detalhes técnicos

Arquivos criados:
- `supabase/migrations/*_collections_intelligent.sql`
- `src/pages/acervo/CollectionDetailPage.tsx`
- `src/hooks/useCollectionNavigation.ts`
- `src/components/collections/CollectionHeroBadges.tsx`
- `src/components/collections/CollectionItemStateBadge.tsx`
- `src/pages/admin/CollectionsMetricsPage.tsx`
- `src/lib/collections/officialCatalog.ts` (fonte de verdade dos seeds)

Arquivos alterados:
- `src/App.tsx` (rotas)
- `src/components/collections/CollectionCard.tsx` (nível, tempo, total)
- `src/pages/BibliotecaBuscaPage.tsx` (aba Coleções)
- `src/lib/nexus/resolveNexusHref.ts` (kind = collection)
- `src/hooks/useCollectionProgress.ts` (expor next/locked)

Reuso obrigatório: `EditorialHero`, `EditorialCard`, `CollectionProgressBar`, `CollectionCompletionCTA`, `EditorialClosure`, `SacredImage`, `useReadingMarks`, `AutoNexusList`.

Não escopo desta onda:
- Programas/Escolas (Onda 4 — Centro de Formação)
- Certificados emitidos (apenas flag `certificate_eligible`)
- Editor visual admin de coleções (usa `officialCatalog.ts` + Mission Control existente)

## Pós-validação prevista
Migração reversível, tipos gerados, rotas legadas preservadas, Prayer/Liturgy Engine intocados, mobile ≤640px validado, `resolveNexusHref` cobre `collection`, métricas admin protegidas por RLS.

## Ordem de execução
1. Migração `collections` + `collection_items` (aprovar antes)
2. `officialCatalog.ts` + seed via insert
3. `CollectionDetailPage` + rotas + navegação inteligente
4. Card com badges + Nexus + busca
5. Página de métricas
6. Engineering Log final
