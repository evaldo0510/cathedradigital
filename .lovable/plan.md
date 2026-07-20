# Sprint Sanctorum 2.0

Congelar o visual do Hero atual e focar em **conteúdo, profundidade e conexão**. Nada de novos módulos — apenas dignificar o Santo do Dia até virar um capítulo de livro vivo.

## Objetivo

Transformar `/santos` de catálogo em **biblioteca viva**: cada santo com biografia completa, timeline, vida espiritual aplicada e Nexus total com todo o ecossistema Cathedra.

## Escopo (5 ondas)

### Onda 1 — Schema editorial expandido (banco)
Migração aditiva em `public.saints` (sem quebrar leitura atual):
- `biography_full` (jsonb): blocos editoriais `{ origem, chamado, missao, fidelidade, testemunho, heranca, aprendizado }`
- `historical_context` (text), `century` (int, já derivável)
- `timeline` (jsonb): `[{ year, event, type: 'birth'|'conversion'|'mission'|'martyrdom'|'canonization'|'feast' }]`
- `virtues` (text[]), `quotes` (jsonb `[{ text, source }]`), `miracles` (jsonb), `works` (jsonb)
- `iconography` (jsonb `{ symbols[], attributes[], colors[] }`), `patronages` (text[])
- `curiosities` (text[]), `sources` (jsonb `[{ title, author, url }]`)
- `spiritual_practice` (jsonb `{ prayer, purpose, examination, practice }`)
- `content_status` (enum: `stub | partial | complete`) — controla badges "em curadoria"

Grants + RLS mantidos (leitura pública, escrita admin). Índice em `content_status` e `feast_date`.

### Onda 2 — Página do santo como capítulo editorial
Refatorar `SaintDetail.tsx` (mantendo `EditorialReaderChrome`):
- Blocos narrativos em vez de "Vida" única: **A origem → O chamado → A missão → A fidelidade → O testemunho → A herança → O que aprendemos hoje**
- Componente `SaintTimeline.tsx` (linha vertical elegante, ícones por tipo de evento)
- Componente `SaintIconography.tsx` (símbolos, cores litúrgicas, patronatos)
- Componente `SaintQuotes.tsx` (citações com fonte)
- Componente `SaintSources.tsx` (bibliografia ao final, estilo acadêmico)
- Fallbacks graciosos com `content_status`: se `stub`, mostra apenas o que existe + selo "Ficha em curadoria"
- Skeletons já existentes reaproveitados

### Onda 3 — Vida Espiritual aplicada
Novo bloco `SaintSpiritualPractice.tsx` no fim da página:
- **Como viver hoje** (texto curto contextual)
- **Oração do dia** (do próprio santo ou associada)
- **Propósito** (1 frase acionável)
- **Exame de consciência** (3 perguntas)
- **Prática concreta** (1 ação do dia)
- CTA "Adicionar ao meu dia" (marca em `reading_marks`/`ritual_progress`, reaproveita infra existente)

### Onda 4 — Nexus total automático
Estender `resolveLink()` e curadoria (`nexus_contributions`) para santos:
- Botão/painel lateral Nexus já existente passa a resolver, para cada santo:
  - **Bíblia** (passagens da liturgia da memória + citadas na biografia)
  - **Catecismo** (parágrafos por virtude/tema — via tags)
  - **Magistério** (encíclicas que citam o santo — via `content_tags`)
  - **Padres da Igreja** (relação em `nexus_relations` tipo `cited_by`/`teacher_of`)
  - **Outros santos relacionados** (mesma escola, discípulos, contemporâneos)
  - **Devoções, Liturgia do dia, Calendário, Glossário, Jornadas, Trilhas**
- Auditoria: rodar `nexus-coverage` já existente incluindo `saints.*` no grafo
- Fallback: se 0 relações, exibir "Estamos tecendo os fios deste santo" (não vazio mudo)

### Onda 5 — Pipeline de conteúdo real
Edge function `saints-content-enrich` (não substitui curadoria, prepara terreno):
- Para cada santo com `content_status='stub'`:
  - Preenche campos objetivos automatizáveis: `century` (do `feast_date`/`death_year`), `patronages`, `iconography.symbols` (heurística por tags), datas/locais faltantes
  - Marca campos narrativos (`biography_full.*`, `quotes`) como `needs_review` em `saints_audit`
- Painel `/admin/sanctorum` (reaproveita padrão `/admin/seo`):
  - Lista santos por `content_status`, campos vazios, "próximos da memória"
  - Botão "enriquecer" e edição inline dos blocos narrativos
  - Export CSV/PDF do backlog

## Fora de escopo (próximas sprints, na ordem que você definiu)
Léxico Teológico → Jornadas → Trilhas → Liturgia → Rosário → Orações → Via Sacra → Breviário → Nexus final.

## Detalhes técnicos

- **Migração**: uma migração aditiva (nullable, defaults `'{}'::jsonb`/`ARRAY[]::text[]`) — zero risco de quebra. GRANTs completos + RLS.
- **Tipos**: regenerar `src/integrations/supabase/types.ts` após migração; adicionar `SaintFull` em `src/types/saint.ts` como superset seguro.
- **Reaproveitamento**: `EditorialReaderChrome`, `PassageActions`, `NexusPopover`, skeletons e `SaintsFetchError` já em produção — sem duplicar.
- **Testes**: E2E Playwright por bloco (`saint-detail-blocks.spec.ts`, `saint-timeline.spec.ts`, `saint-nexus-coverage.spec.ts`), Axe em cada onda, snapshot dark mode do novo detalhe.
- **Performance**: `biography_full` e `timeline` só na rota de detalhe (não em `Saints.tsx` listagem). Índice parcial `WHERE content_status='complete'` para ranking futuro.
- **Rollback**: `?legacy=1` mantém detalhe atual até validação.

## Entregáveis por onda (checkpoints)

```text
Onda 1  →  migração + tipos + seed de 3 santos "complete" para validar
Onda 2  →  nova página de detalhe com blocos editoriais + timeline
Onda 3  →  bloco Vida Espiritual funcional com CTA
Onda 4  →  Nexus total + auditoria de cobertura verde
Onda 5  →  admin de curadoria + pipeline de enriquecimento
```

Cada onda entrega **relatório antes×depois** (campos preenchidos, cobertura Nexus, contraste, LCP).

## Confirmação necessária

1. Começo pela **Onda 1 (migração + seed)** ou prefere ver primeiro um **mock estático** da nova página de detalhe (Onda 2 sem banco) para validar a experiência editorial?
2. Aprovo os 7 blocos narrativos (origem/chamado/missão/fidelidade/testemunho/herança/aprendizado) como estrutura fixa, ou quer ajustar?
