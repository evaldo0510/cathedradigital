# Sprint 6.2 — Editorial Engine

Refatoração de infraestrutura. **Zero mudança visual, zero regressão funcional** no `/admin/editorial-audit` atual. O objetivo é transformar toda a lógica hoje acoplada a `glossary` em um núcleo genérico configurável por entidade, para que Santos, Orações, Coleções e Jornadas sejam plugadas sem duplicar código.

## Princípio

Uma entidade editorial (Glossário, Santos, Orações…) é descrita por um **manifesto** que declara: tabela, campos obrigatórios, pesos, gate, macroáreas doutrinárias e prompts de IA. O motor executa: audit → ICE → gate → nexus → generator → snapshot → certification usando esse manifesto.

## Arquitetura

```text
supabase/
├── migrations/
│   └── editorial_engine_core.sql       (tabelas genéricas + RPCs paramétricas)
└── functions/
    └── editorial-generate/             (generator paramétrico, substitui glossary-generate-deep)

src/lib/editorial-engine/
├── types.ts                            (EntityManifest, FieldSpec, GateRule, Bucket, Snapshot)
├── manifests/
│   ├── glossary.manifest.ts            (migração do que hoje está hardcoded)
│   └── index.ts                        (registry de entidades)
├── useEditorialAudit.ts                (hook genérico: recebe manifest, devolve rows/totals/coverage/buckets)
├── useEditorialQueue.ts                (fila com priorização, pause/resume, checkpoint, histórico)
├── ice.ts                              (calculator puro)
├── nexus-validator.ts                  (score Nexus por manifest)
└── freeze-manager.ts                   (5 critérios paramétricos + hash)

src/pages/admin/
├── EditorialAudit.tsx                  (rewire: passa a receber ?entity=glossary; renderiza via engine)
└── MissionControl.tsx                  (novo — Cathedra Mission Control, agrega todas as entidades)
```

## Tarefas

### 1. Núcleo de tipos e manifesto
- `EntityManifest`: `{ id, label, table, slugField, statusField, fields: FieldSpec[], gate: GateRule[], doctrinalAreas?, aiPrompts, weight }`.
- `FieldSpec`: `{ key, label, group: "editorial"|"nexus"|"meta", required, weight, validate?(value) }`.
- Registrar `glossary.manifest.ts` reproduzindo 1:1 os campos atuais (`deep_interpretation`, `faq`, `logos_meditation`, `bible_verses`, `catechism_references`, `fathers_refs`, etc.), pesos, gate ≥85, macroáreas.

### 2. Migração SQL — tornar RPCs genéricas
- Substituir `glossary_doctrinal_coverage()`, `glossary_correction_priority()`, `glossary_quality_gate()`, `glossary_doctrinal_area()` por versões `editorial_*_by_entity(_entity text)`.
- Manter as antigas como wrappers finos (`SELECT * FROM editorial_coverage('glossary')`) para não quebrar consumidores.
- Generalizar `editorial_snapshots` (já genérica) e `editorial_jobs` (já tem coluna `module`).

### 3. Edge Function `editorial-generate`
- Recebe `{ entity, slug, field }` → carrega manifesto do banco (`editorial_manifests` seed table) ou de constante compartilhada em `_shared/editorial-manifests.ts` → seleciona prompt correto → chama Lovable AI Gateway → grava no campo mapeado.
- `glossary-generate-deep` vira wrapper que chama `editorial-generate` com `entity: "glossary"`.

### 4. Hooks genéricos
- `useEditorialAudit(manifest)` devolve exatamente a mesma forma de dados que hoje (`rows, totals, coverage, priorityRows, snapshot, prevSnapshot`), lendo pelo manifesto.
- `useEditorialQueue(manifest)` — extrai a fila inteligente (priorização, pause/resume, checkpoint em `localStorage` chaveado por `entity`, histórico via `editorial_jobs`).

### 5. Refatorar `EditorialAudit.tsx`
- Rota vira `/admin/editorial-audit?entity=glossary` (default = glossary; mantém `/admin/editorial-audit` funcionando).
- Componente lê o manifesto do query param e delega tudo aos hooks/engine.
- Todos os cards atuais (Certificação, Mission Panel Sprint 6.1.2, Cobertura, Prioridade, Fila, Histórico, Quality Gate, Certificado v1.0) passam a ser sub-componentes que recebem `{ manifest, data }`.
- **Critério de sucesso:** diff visual zero em `/admin/editorial-audit`.

### 6. `MissionControl.tsx` (nível superior)
- Rota nova `/admin/mission-control`.
- Lista todas as entidades registradas no manifest registry.
- Para cada uma: card com ICE, barra, Nexus %, tier, status ("Pronto para Certificação" / "Em progresso" / "Fundação"), link para o audit específico.
- Rodapé com "Sistema" agregado (média ponderada, últimas auditorias, próxima ação recomendada).
- Nesta sprint só o **Glossário** aparecerá real; demais entidades ficam como placeholders "Não configurado" até 6.3+.

## Escopo NEGATIVO (não fazer nesta sprint)

- Não criar manifesto de Santos, Orações, Coleções ou Jornadas.
- Não gerar conteúdo novo.
- Não mudar UI/UX visível do audit atual.
- Não migrar dados existentes.
- Não tocar em `PrayerPortal`, readers, ou qualquer superfície pública.

## Critérios de aceite

- `/admin/editorial-audit` renderiza pixel-idêntico ao atual, com dados vindos do engine.
- `/admin/mission-control` funciona mostrando apenas Glossário.
- `glossary-generate-deep` continua respondendo (via wrapper).
- `bunx tsgo --noEmit` limpo.
- Suite Vitest de integridade editorial continua verde.
- Snapshot pós-refactor idêntico ao pré (ICE ponderado, buckets, cobertura).

## Detalhes técnicos

- **Registry**: constante TS em `src/lib/editorial-engine/manifests/index.ts` (não tabela) — decisões de campos/gate são código versionado, não dado.
- **Compat SQL**: nada de `DROP FUNCTION`; sempre `CREATE OR REPLACE` + wrappers. Se um wrapper causar assinatura ambígua, versionar com sufixo `_v2` e apontar o wrapper antigo.
- **Prompts de IA**: extrair os 11 prompts atuais de `glossary-generate-deep` para `supabase/functions/_shared/prompts/glossary.ts` e importar no manifesto.
- **Hash de certificação**: passa a receber `entity` no input, para hashes independentes por módulo.
- **Cache**: manifests carregam uma vez no bootstrap; hooks reidratam via React Query com `queryKey: ["editorial", entity, ...]`.

## Depois desta sprint

- 6.3 Santos: criar `saints.manifest.ts` + prompts. Zero código novo de infraestrutura.
- 6.4 Orações, 6.5 Coleções, 6.6 Jornadas: idem.
- Mission Control ganha entidades reais à medida que os manifestos são registrados.
