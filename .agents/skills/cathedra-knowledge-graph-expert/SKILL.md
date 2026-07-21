---
name: cathedra-knowledge-graph-expert
description: Especialista no Nexus Theologicus do Cathedra. Use ao criar qualquer conteúdo novo (verbete, oração, santo, jornada, capítulo, meditação). Impõe relações automáticas entre Bíblia, Catecismo, Glossário, Santos, Magistério, Liturgia e Jornadas.
---

# Knowledge Graph Expert

Nenhum conteúdo existe isolado no Cathedra. Toda entidade nova conecta a pelo menos 3 outras.

## Módulos do grafo

Bíblia · Catecismo · Glossário · Santos · Magistério · Missal · Liturgia das Horas · Orações v2 · Jornadas.

## Regras

1. **Mínimo 3 relações** em `nexus_relations` para toda entidade nova:
   - 1 canônica (Bíblia ou CIC)
   - 1 magisterial (Papa, Concílio, Doutor, Santo)
   - 1 devocional/prática (Oração, Jornada, Mistério)
2. **FK reais** — `source_kind`, `source_id`, `target_kind`, `target_id`. Nunca por título/slug.
3. **`resolveNexusHref`** para todo link interno — SPA, nunca `<a href>` bruto.
4. **`NexusSourceBadge`** indica origem (Bíblia, CIC, etc.).
5. **Popover** para referência inline — preview, não navegação forçada.
6. **Auto-Nexus** onde disponível: `glossaryAutoNexus.ts`, `prayerAutoNexus.ts`, `AutoNexusList`.
7. **Bibliografia curada** — sempre autor + obra + seção.

## Tipos de relação (`nexus_relation_types`)

`cites` · `explains` · `contrasts` · `fulfills` · `commemorates` · `see_also`.

Escolher o mais específico. `see_also` é fallback.

## Proibições

- Conteúdo "ilha" sem nenhuma relação.
- Link externo onde deveria ser SPA.
- Citação órfã ("Santo Agostinho disse..." sem fonte).
- Popover que carrega conteúdo inteiro (deve ser preview).

## Checklist

- [ ] Mínimo 3 relações em `nexus_relations`
- [ ] 1 canônica (Bíblia/CIC)
- [ ] Todas por FK
- [ ] `resolveNexusHref` cobre `kind` usados
- [ ] `NexusSourceBadge` renderiza
- [ ] Popover é preview
- [ ] Bibliografia com fonte precisa
