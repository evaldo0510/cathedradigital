---
name: cathedra-knowledge-graph-expert
description: Enforce Nexus rules — min 3 / max 8 relations, priority hierarchy, RouteRegistry-only navigation, shape of nexus_refs. Use for any new content, glossary, prayer, or cross-reference.
---

# Knowledge Graph Expert

Nenhum conteúdo existe isolado no Cathedra. Toda entidade nova conecta.

## Constituição — remissão

Ver `docs/CATHEDRA-CONSTITUTION.md`. Executa os artigos:
"Existe apenas um Knowledge Engine", "Todo conteúdo participa do Nexus",
"Toda rota passa pelo RouteRegistry", "Nenhuma URL hardcoded".

## Módulos do grafo

Bíblia · Catecismo · Magistério · Santos · Orações · Jornadas · Glossário · Liturgia.

## Regras de quantidade

- **Mínimo 3 relações** em `nexus_relations` por entidade nova.
- **Máximo recomendado 6–8** — mais que isso vira ruído.
- Se ultrapassar, curar. Preferir qualidade a quantidade.

## Prioridade das relações (nesta ordem)

1. Bíblia
2. Catecismo
3. Magistério
4. Santos
5. Orações
6. Jornadas
7. Glossário
8. Liturgia

Uma entidade nova deve cobrir os níveis mais altos primeiro. Ideal: pelo menos 1 canônica (Bíblia ou CIC) + 1 magisterial + 1 devocional/prática.

## Shape obrigatório

### `nexus_relations` (tabela principal)

`source_kind` e `target_kind` ∈ `['bible_verse','catechism_paragraph','magisterium_doc','patristic','other']`.
Entidades customizadas (prayer, glossary, saint, journey) usam `kind='other'` + `source_ref`/`target_ref` JSON com `{kind, slug|id, label}`.

Sempre por FK real ou `ref` estruturado — **nunca por título/slug solto em string**.

### `glossary.nexus_refs`

`Array<{ kind: string, ref?: string, slug?: string, label: string }>`.

## Navegação — regra de ouro

**Nunca criar links hardcoded.** Toda navegação passa por:

- `KnowledgeResolver.resolve(nodeId)` → `{ node, url }`
- `RouteRegistry.resolve(routeKey, params)` — nunca escrever `/oracao/${slug}` na mão.
- `resolveNexusHref(ref)` para SPA a partir de refs do Nexus.

Link externo (`<a href="http...">`, `target="_blank"`, `window.open`) proibido em componentes do Nexus. Guardião: `scripts/check-nexus-internal.mjs`.

## Tipos de relação (`nexus_relation_types`)

`cites` · `explains` · `contrasts` · `fulfills` · `commemorates` · `see_also`.

Escolher o mais específico. `see_also` é fallback.

## Auto-Nexus

Onde disponível: `glossaryAutoNexus.ts`, `prayerAutoNexus.ts`, `AutoNexusList`. Usar antes de escrever lista manual.

## UI

- `NexusSourceBadge` indica origem.
- Popover é **preview**, não navegação forçada nem carregar conteúdo inteiro.
- Bibliografia sempre com autor + obra + seção.

## Proibições

- Entidade "ilha" sem relação.
- Link externo onde deveria ser SPA.
- URL hardcoded fora do RouteRegistry.
- Citação órfã ("Santo Agostinho disse…" sem fonte).
- Popover que carrega documento inteiro.
- Mais de 8 relações sem curadoria.

## Checklist

- [ ] 3 ≤ relações ≤ 8
- [ ] 1 canônica (Bíblia/CIC) presente
- [ ] Prioridade respeitada (Bíblia > CIC > Magistério > …)
- [ ] Todas por FK ou `ref` estruturado
- [ ] Navegação via `resolveNexusHref` / `RouteRegistry` / `KnowledgeResolver`
- [ ] Zero URL hardcoded
- [ ] `NexusSourceBadge` renderiza
- [ ] Bibliografia com fonte precisa
