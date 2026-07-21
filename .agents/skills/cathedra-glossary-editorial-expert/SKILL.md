---
name: cathedra-glossary-editorial-expert
description: Editorial rules for Glossário — required sections, permissions/publish trigger, Auto-Nexus, SEO/JSON-LD. Use for creating or editing any glossary term.
---

# Glossary Editorial Expert

Verbetes do Glossário. Aproveita Knowledge Graph consolidado.

## Constituição

Artigos 2, 4, 5, 6, 8, 11 de `docs/CATHEDRA-CONSTITUTION.md`.

## Tabela

`glossary`. Trigger `enforce_glossary_publish()` impede `status='published'` para não-admins. **Migrations diretas entram como `draft`** e são publicadas via `/admin/glossario` (Bulk Publish Panel) com papel `editor+`.

## Seções obrigatórias (`sections_order`)

Ordem padrão em `DEFAULT_ORDER`:
1. `definition` — 1–2 frases densas.
2. `etymology` — origem do termo (grego/hebraico/latim).
3. `scripture` — passagens fundantes.
4. `magisterium` — CIC + documentos.
5. `tradition` — Padres/Doutores.
6. `application` — vida cristã hoje.
7. `related` — verbetes irmãos.

`editorial_completeness = complete` exige todas preenchidas.

## Nexus

`nexus_refs` = `Array<{ kind, ref?|slug?, label }>`. Kinds usados: `bible`, `catechism`, `magisterium`, `saint`, `prayer`, `glossary`, `journey`, `liturgy`.

Auto-Nexus via `glossaryAutoNexus.ts` + `AutoNexusList`. **Não escrever lista manual** quando o auto cobre.

Também gravar arestas em `nexus_relations` (`source_kind='other'` com ref JSON) para grafo global. ≥ 3 relações, ≤ 8, prioridade Bíblia > CIC > Magistério > Santos > Orações.

## SEO

JSON-LD triplo em `GlossaryTermPage`: `DefinedTerm` + `Article` + `FAQPage`. Entrada em `src/config/routeMeta.ts`. Feed RSS via Edge Function `glossary-rss`.

## UI

- `EditorialHero` com termo + categoria.
- `EditorialCard` `dense` para seções.
- `data-space="biblioteca"`.
- Popover para referência inline (preview, não navegação forçada).

## Proibições

- Publicar direto por SQL sem papel.
- Verbete sem etimologia.
- Verbete sem Escritura.
- Lista manual quando Auto-Nexus cobre.
- `<a href="http…">` para verbete irmão — usar `resolveNexusHref`.
- Hook após early-return (bug conhecido corrigido).

## Checklist

- [ ] `status='draft'` em migration
- [ ] 7 seções preenchidas → `editorial_completeness='complete'`
- [ ] `nexus_refs` com shape correto
- [ ] ≥ 3 arestas em `nexus_relations`
- [ ] `AutoNexusList` renderiza
- [ ] JSON-LD triplo presente
- [ ] Rota em `routeMeta.ts` (title <60, desc <160)
- [ ] Publicado via UI, não SQL
