
# Biblioteca Católica — Frente Unificada

Unifica **Escritos dos Santos**, **Patrística**, **Magistério** e **Clássicos** em uma única experiência com o mesmo `ReaderShell`, mesma ficha editorial, mesmo sistema de progresso e mesmo grafo (Nexus).

## Preflight (COS)

- Skills carregados: guardian, design-system, knowledge-graph, glossary-editorial, saints-expert
- Classificação: Editorial + Banco + Nexus + UX
- Risco: **alto** — cross-módulo + nova tabela pivô + refatoração de rotas
- Requer confirmação explícita antes de executar

## Princípio arquitetural

**Não** duplicar conteúdo. Criar uma **view de leitura unificada** (`library_items`) sobre as tabelas canônicas existentes:

```text
saint_works ──┐
              ├──► library_items (view materializada)  ──► LibraryReader
magisterium ──┤                                           (ReaderShell único)
              │
patristica  ──┘ (já é saint_works com category ∈ padres/doutores)

clássicos = saint_works com category='classic' (novo valor de enum)
```

Progresso continua nas tabelas nativas de cada módulo — a Biblioteca só **agrega** e **lê**.

## Fase 1 — Schema (migration única, aditiva)

1. Estender enum `saint_work_category` com `'classic'` (para autores fora dos Padres/Doutores: Newman, Chesterton, Guardini, Ratzinger acadêmico).
2. Criar tabela `library_kinds` (`saint_work | magisterium | classic | patristic`) — enum + labels PT-BR.
3. Criar **VIEW** `public.library_items_v1`:
   - Campos: `library_kind`, `id`, `slug`, `title`, `author_label`, `author_href`, `category_label`, `year`, `synopsis`, `themes[]`, `access_type`, `cover_image_url`, `reading_minutes`, `ficha_completeness`, `status`, `href`, `search_tsv`.
   - `UNION ALL` entre `saint_works` (published) e um SELECT análogo em `magisterium_documents` (ou tabela equivalente já existente — a auditar antes).
   - `href` resolve via `resolveNexusHref`.
4. `GRANT SELECT ON public.library_items_v1 TO anon, authenticated`.
5. Estender `nexus_relations`: nenhum novo tipo — reuso de `see_also` + `explains`.

## Fase 2 — Serviço + tipos

- `src/types/library.ts`: `LibraryItem`, `LibraryKind`, `LibraryFilter`.
- `src/services/libraryService.ts`:
  - `listLibrary(filter)` — paginado, com FTS.
  - `getLibraryItem(kind, id)` — hidrata do módulo canônico.
- Adaptador `toLibraryItem(source)` para cada módulo.

## Fase 3 — Rota unificada

Novas rotas SPA:

- `/biblioteca` — landing (hero + 4 filtros por `library_kind`).
- `/biblioteca/acervo` — grade unificada com busca híbrida.
- `/biblioteca/:kind/:slug` — ficha editorial (redireciona internamente para a rota canônica: `/biblioteca/escritos/...`, `/magisterio/...`).

Rotas legadas **preservadas** (redirects, não breaking).
Meta em `routeMeta.ts` (dinâmico via `DYNAMIC_PATTERNS`).

## Fase 4 — LibraryReader (reuso, não novo)

- `LibraryReaderShell.tsx` = wrapper fino sobre `ReaderShell` que resolve `library_kind` → componente de leitor canônico já existente:
  - `saint_work` → `SaintWorkReaderPage`
  - `magisterium` → `MagisteriumReaderPage`
  - `classic` → `SaintWorkReaderPage` (mesma engine)
- Zero fork de leitor. Apenas **roteamento inteligente**.

## Fase 5 — Progresso unificado

- View `public.library_progress_v1` agregando:
  - `saint_work_chapters_read` (a criar se ainda não existir — auditar) ou `reading_marks`
  - progresso do Magistério
- `useLibraryProgress(userId)` — hook único para dashboard `/conta`.
- **Não** criar nova tabela de progresso; agregar as existentes.

## Fase 6 — UI

- `BibliotecaLandingPage.tsx`: 4 cards (Escritos, Patrística, Magistério, Clássicos) usando `EditorialCard` + hero em pergaminho.
- Reuso de `BibliotecaAcervoPage.tsx` (já existe) — expandir para incluir Magistério e Clássicos via `library_items_v1`.
- Filtros: `library_kind`, `category`, `access_type`, `ficha_completeness`, `themes[]`.
- Busca híbrida (FTS + trigram) via RPC.

## Fase 7 — Nexus + SEO

- `AutoNexusList` reconhece `library_item` como agregação e resolve para módulo canônico.
- Sitemap: incluir `library_items_v1` (published apenas).
- JSON-LD `Collection` na landing + `Book` na ficha.

## Fase 8 — Admin

- `/admin/biblioteca` — dashboard agregando contagens por `library_kind` × `ficha_completeness` × `status`.
- **Não** duplicar `/admin/biblioteca-patristica` (que continua para gestão editorial fina de `saint_works`).

## Fora de escopo (ondas futuras)

- Importação em massa do Magistério (Sprint separada — depende de conteúdo).
- Recomendações personalizadas (RAG) — Sprint AI.
- Coleções curadas cross-módulo — Sprint Collections Studio v2.

## Detalhes técnicos

- **Sem tabela pivô física** — só views. Reversível, zero risco de deriva de dados.
- Ordem canônica de migração respeitada (CREATE → GRANT → RLS/RULES → policies onde aplicável; views herdam do subjacente).
- Zero componente novo além de: `BibliotecaLandingPage`, `LibraryReaderShell` (roteador), `useLibraryProgress`.
- `ReaderShell`, `EditorialHero`, `EditorialCard`, `EditorialClosure` — **reuso 100%**.

## Entregáveis por fase (em ordem)

```text
Onda 1 (Fundação)   → Fase 1 + 2 + Auditoria de magisterium_documents
Onda 2 (Rotas)      → Fase 3 + 4
Onda 3 (Progresso)  → Fase 5
Onda 4 (UI+Nexus)   → Fase 6 + 7
Onda 5 (Admin)      → Fase 8
```

## Critério de aceitação

- Toda ficha renderiza com `EditorialHero` + `EditorialClosure`.
- Zero regressão em `/biblioteca/escritos/*` e `/magisterio/*`.
- Busca única retorna resultados dos 4 tipos.
- Dashboard `/conta` mostra progresso agregado.
- `tsgo` limpo, sitemap atualizado, `headings-audit` verde.

## Pergunta antes de executar

1. **Fonte do Magistério**: qual tabela canônica hoje armazena documentos (Vatican.va importados)? Vi `catechism_official` e `vatican_cache`, mas não uma `magisterium_documents` como tal. **Confirmar antes da Fase 1** — impacta o SQL da view.
2. **Enum `classic`**: aprovar adição ao `saint_work_category` ou preferimos criar tabela separada `classic_works`?
3. **Ordem de execução**: começo pela Onda 1 (Fundação) e pauso para homologação, seguindo Regra 12 (Homologação Sequencial) do COS?
