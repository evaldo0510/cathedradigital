
# Sprint E1 — Biblioteca Patrística (Fundação)

## Preflight COS

- **Classificação**: Editorial + Prayer/Reader Architecture + Nexus + Banco + UI
- **Skills**: Cathedra Guardian, Library Curator, Knowledge Graph Expert, Design System Guardian
- **Reader Architecture Rule §10**: leitor DEVE usar `ReaderShell` + `ReaderToolbar`. Zero componente de leitura novo.
- **Regra 1 Architecture Guardian**: buscar antes de criar. Reuso obrigatório: `EditorialHero`, `EditorialCard`, `AutoNexusList`, `ReferencePopover`, edge function de meditação IA.

## Matriz de Impacto

- Módulos tocados: Santos (leitura), Biblioteca, Nexus. Não tocados: Bíblia, Catecismo, Missal, LH, Orações.
- Banco: **sim** (2 tabelas novas, aditivo, reversível).
- Migração: **sim** (não destrutiva).
- Rotas: **sim** (novas, sem colisão).
- Risco: **médio** — schema novo + política de licença. Sem risco alto porque não altera módulos existentes.

## Escopo aprovado

- **Piloto**: 5 obras / 5 autores.
- **Ingestão**: híbrida — importador de DP + revisão editorial no `/admin/escritos` antes de publicar.

## Entregas técnicas

### 1. Schema (`saint_works`, `saint_work_chapters`)

`saint_works`:
- `saint_id` FK → `saints.id`
- `slug`, `title`, `original_title`, `language`, `category` (patristica|escolastica|mistica|monastica|carmelita|franciscana|dominicana|doutor|espiritualidade)
- `year_written`, `is_public_domain` (bool), `license`, `source_url`, `translation_credit`
- `status` (draft|in_review|published), `editorial_score`, `abstract`, `cover_image_url`
- Timestamps + trigger `updated_at`

`saint_work_chapters`:
- `work_id` FK, `order`, `title`, `body_html`, `body_plain` (para busca), `reading_minutes`
- Unique `(work_id, order)`
- GIN index em `body_plain` (tsvector portuguese)

RLS: leitura pública para `status='published'`; escrita restrita a admin/editor (reusa `has_role`).
GRANTs: SELECT anon+auth (published), ALL service_role, INSERT/UPDATE authenticated (RLS filtra por role).

### 2. Serviço + tipos

- `src/types/saintWorks.ts`
- `src/services/saintWorksService.ts` — `listByAuthor`, `listByCategory`, `getWorkBySlug`, `getChapter`, `searchInWork`
- Extende `saintNexusService` para expor obras do santo via nova relação `wrote` (já existe no `nexus_relation_types`).

### 3. Rotas + Páginas

```
/biblioteca/escritos                    → BibliotecaEscritosPage (índice por escola)
/biblioteca/escritos/:autorSlug/:obraSlug          → SaintWorkOverviewPage (capa, TOC)
/biblioteca/escritos/:autorSlug/:obraSlug/:cap    → SaintWorkReaderPage (ReaderShell)
```

Ficha do Santo (`SaintDetail`) ganha seção **📚 Obras** listando `saint_works` publicadas do autor com link para overview.

### 4. Leitor (reuso 100%)

`SaintWorkReaderPage` monta `ReaderShell` com:
- `HeaderContext` slot: autor + obra + capítulo
- `ReaderToolbar` (fonte, dark, TTS, prev/próx cap, retomar)
- Conteúdo: `body_html` sanitizado + `ReferencePopover` ativo em citações
- `AutoNexusList` no rodapé (obra ↔ verbetes/CIC/Bíblia via `nexus_relations`)
- IA contextual: botão "Explicar este trecho" → edge function `saint-work-commentary` (fork da `liturgy-meditation` com prompt patrístico)

### 5. Admin `/admin/escritos`

- Lista de `saint_works` com filtro por status.
- Editor de capítulos com preview.
- Campo `license` **obrigatório** para publicar (gate no backend via trigger).
- Botão "Importar de DP" chama edge function `saint-work-import` (Wikisource PT / Docvaticana).

### 6. Piloto de conteúdo (5 obras, todas DP)

| Autor | Obra | Fonte DP | Cap. iniciais |
|---|---|---|---|
| Agostinho | Confissões | Wikisource PT / trad. anônima séc. XIX | Livro I completo |
| Tomás de Aquino | Suma Teológica — seleção | Wikisource PT | Prima Pars q.1–5 |
| Teresinha | História de uma Alma | trad. carmelitas 1930s DP | Cap. I–III |
| Kempis | Imitação de Cristo | trad. clássica DP | Livro I completo |
| Agostinho | Solilóquios | Wikisource PT | Livro I |

Cada obra entra como `status='in_review'`; publicação manual após revisão.

### 7. Nexus

Popular `nexus_relations`:
- `saint → wrote → saint_work` (5 relações)
- `saint_work → cites → bible_verse` (piloto: 20 relações em Confissões)
- `saint_work → explains → glossary` (piloto: 10 verbetes ligados a Suma)

### 8. Governança (COS)

- Adicionar §11 no COS: **Editorial License Rule** — nenhum `saint_work` publica sem `license` preenchida e `is_public_domain` validado.
- Adicionar ao Manifest Registry: `saint_works` → plugin `knowledge` + `editorial`.

## Fora do escopo (Onda 2+)

- TTS server-side de obras longas
- Anotações persistidas por capítulo (já existe infra `user_notes`, integrar depois)
- Exportação PDF
- Tradução própria Cathedra
- Comentário IA persistido/compartilhável

## Ordem de execução

1. Migração (schema + RLS + GRANTs + trigger de license gate)
2. Types + serviço
3. Rotas + páginas index/overview/reader
4. Integração na ficha do Santo (seção Obras)
5. Admin `/admin/escritos` + edge function de import
6. Seed dos 5 pilotos + Nexus
7. Testes: unit do serviço, E2E do leitor (Playwright reusando padrão da Bíblia)
8. Engineering Log + Certified

## Riscos e mitigações

- **Licença duvidosa**: gate em banco + admin bloqueia.
- **Textos longos travando render**: paginação por capítulo (não carregar obra inteira).
- **Regressão em Santos**: seção Obras só aparece se `saint_works` retorna >0.
