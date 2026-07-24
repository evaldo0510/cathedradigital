# Acervo Cathedra — Hub Unificado de Conhecimento

Ponto de inflexão aprovado: a "Biblioteca Católica" deixa de ser um menu de livros e passa a ser o **centro do conhecimento** do Cathedra. Toda navegação por Tradição (Bíblia, Catecismo, Santos, Magistério, Patrística, Liturgia, Clássicos) converge para o mesmo shell, mesma busca, mesmo Nexus, mesmo EditorialClosure.

Nomenclatura adotada: **Acervo Cathedra** (rota `/acervo`). "Biblioteca Católica" fica como subtítulo humano. Legado `/biblioteca/*` preservado via redirect.

---

## Preflight

- COS v1.3 ativo. Skills: `cathedra-guardian`, `cathedra-design-system-guardian`, `cathedra-knowledge-graph-expert`, `cathedra-prayer-engine-expert`, `cathedra-saints-expert`.
- Reuso agressivo: `ReaderShell`, `EditorialHero`, `EditorialCard`, `EditorialClosure`, `NexusPanel`, `library_items_v1`, `search_library_items`, `libraryService`.
- **Zero componente paralelo.** Toda nova superfície é composição dos primitivos existentes.

---

## Arquitetura conceitual

```text
Acervo Cathedra (/acervo)
│
├── Navegar por Tradição
│   ├── Escritos dos Santos      (saint_works: kind=writing)
│   ├── Padres da Igreja         (saints.category=father + works)
│   ├── Doutores da Igreja       (saints.category=doctor + works)
│   ├── Patrística               (saint_works.category=patristic)
│   ├── Magistério               (concílios, encíclicas, exortações...)
│   ├── Espiritualidade
│   ├── História da Igreja
│   ├── Liturgia                 (Missal + LH)
│   ├── Homilias
│   ├── Clássicos Católicos      (saint_works: kind=classic)
│   └── Favoritos                (user-scoped)
│
├── Busca Unificada              (RPC search_library_items ampliada)
│
├── Estudar (novo)               (/acervo/estudar/:tema)
│   └── Trilha temática: Bíblia → Catecismo → Santos → Magistério
│                        → Patrística → Reflexão → Oração → Continuar
│
└── Indicador de Profundidade    (chip em cada card/hero)
    Rápida (5m) · Média (25m) · Profunda · Referência
```

---

## Ondas de execução (sequenciais, com homologação entre cada)

### Onda 3 — Hub Acervo Cathedra (renomeação + IA visual)
- Renomear `/biblioteca/catolica` → `/acervo` (redirect legado preservado).
- `AcervoHomePage.tsx`: EditorialHero + grid de 11 categorias em `EditorialCard`.
- Menu principal e Sidebar atualizados.
- **Não** mexe em banco. Só composição visual.

### Onda 4 — Progresso agregado + Favoritos unificados
- `useLibraryProgress` (hook): consolida progresso de saint_works, catecismo, bíblia por usuário.
- Aba **Favoritos** puxa `bible_favorites` + reading_marks + collection_progress unificados.
- Chip de progresso no `SaintWorkCard`.

### Onda 5 — Indicador de Profundidade
- Migração: coluna `depth_level` (`quick` | `medium` | `deep` | `reference`) e `estimated_minutes` em `saint_works`. Trigger de auto-cálculo por word_count quando nulo.
- Componente `DepthIndicator.tsx` (barra ■■■□□□) reutilizado em cards, hero e listagens.
- Retro-preencher as 14 obras-âncora + Suma/Imitação/Solilóquios/História de uma Alma.

### Onda 6 — Magistério no Acervo
- Estender `library_items_v1` para incluir `magisterium_documents` (concílios, encíclicas, exortações, constituições, cartas).
- Categorias novas no filtro do Acervo.
- Reutiliza ReaderShell existente do Magistério.

### Onda 7 — Modo "Estudar" (temático)
- Tabela `study_themes` (slug, title, description, seed_terms, curated_items JSONB).
- Página `/acervo/estudar/:slug` com trilha vertical: Escritura → Catecismo → Santos → Magistério → Patrística → Reflexão → Oração → Continuar.
- Semear 5 temas-piloto: **Humildade, Caridade, Oração, Conversão, Eucaristia**.
- Curadoria manual + Nexus automático como sugestão.

### Onda 8 — Busca única cross-corpus
- Ampliar `search_library_items` para incluir Bíblia (verses) e Catecismo (paragraphs) com weight editorial.
- Página `/acervo/busca?q=humildade` retorna resultado agrupado por corpus, com CTA "Estudar este tema".

### Onda 9 — Admin consolidado + Sitemap
- `/admin/acervo`: dashboard de cobertura editorial cross-corpus (completude, ICE, stubs, pipeline).
- Sitemap unificado inclui `/acervo/*` e `/acervo/estudar/*`.
- Nexus enriquecido: relações temáticas alimentam trilhas.

---

## Detalhes técnicos (skippable para leitura de produto)

**Banco**
- Onda 5: `ALTER TABLE saint_works ADD depth_level, estimated_minutes` + trigger.
- Onda 6: `CREATE OR REPLACE VIEW library_items_v1` incorporando `magisterium_documents`.
- Onda 7: `study_themes` com RLS pública leitura / admin escrita + GRANT explícito.
- Onda 8: `search_library_items` reescrita com UNION tsvector Bíblia + Catecismo + Saint Works.

**Reuso obrigatório**
- Cards: `EditorialCard` (nova densidade `library` se necessário — não novo componente).
- Hero: `EditorialHero` (variante `hub`).
- Leitura: `ReaderShell` + `EditorialClosure` (já injetado via `resolveClosure`).
- Nexus: `NexusPanel` alimentado por `search_library_items` filtrada por tema.

**Rotas legadas** (preservadas com redirect):
`/biblioteca/catolica`, `/biblioteca/catolica/acervo`, `/biblioteca/patristica`, `/biblioteca/escritos` → `/acervo/*`.

**Não faremos nesta fase**
- App mobile nativo.
- Áudio narrado (fica para wave futura).
- Editor colaborativo de trilhas (só curadoria admin).

---

## O que peço agora

Confirmação para começar pela **Onda 3 (renomeação + hub visual)**, sem tocar banco. Homologa visualmente, e só então avanço para Onda 4.

Se preferir inverter (ex: Profundidade antes do Hub, ou Estudar como primeiro diferencial), me diga qual onda vira prioridade 1.
