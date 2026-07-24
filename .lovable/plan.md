# Sprint Santos S2 — Doutores da Igreja (36)

## Objetivo
Levar os 36 Doutores da Igreja a `editorial_status='published'` com conteúdo editorial mínimo, curadoria manual e nexus completo. Reutilizar `/admin/saints` e edge functions já existentes (`saint-import`, `admin-incremental-reimport-saints`).

## Escopo
Lista canônica dos 36 Doutores. Já no banco: 19 (3 completos, 16 stubs — score 0). Faltam ~17 novos IDs (Alberto Magno, Beda, Bonaventura, Efrém, João Crisóstomo, Cirilo Alexandrino, Cirilo Jerusalém, Damasceno, Hilário, Ambrósio, Gregório Magno, Pedro Damião, Pedro Crisólogo, Francisco de Sales, Ildefonso, Ireneu, Gregório de Narek, João de Ávila, Hildegarda). Consolidar duplicatas (Teresinha ×2, Teresa de Lisieux).

## Fluxo editorial (aprovado)
`draft` → `editorial_review` → `doctrinal_review` → `published`. Revisor humano no `/admin/saints`. Nada publica sozinho.

## Etapas

### S2.1 — Higiene e seed dos IDs faltantes
- Migration: mesclar `teresinha` + `terezinha` + `teresa-lisieux` num único ID canônico via `merged_into`.
- Insert dos ~17 doutores faltantes como stub mínimo (`id, name, category='doctor', editorial_status='draft', feast_day, century, source_url`).
- Trigger `trg_saints_editorial_transition` valida transições e exige campos mínimos para sair de `draft`.

### S2.2 — Ingestão em lote
- Novo botão no `SaintsEnrichmentPanel`: "Ingerir todos os Doutores pendentes".
- Chama `saint-import` (já existe) em fila com throttle 1/2s; grava resultado em `saints_enrichment_runs` (já existe).
- Sempre grava em `draft` — nunca publica direto.

### S2.3 — Painel de revisão
- Nova aba em `/admin/saints`: **Fila de Revisão**.
- Lista santos com `editorial_status ∈ {draft, editorial_review, doctrinal_review}` e `category='doctor'`.
- Card por santo com: score, campos faltantes, diff bruto→editado, botões **Aprovar (avança 1 estágio)** / **Reprovar (volta pra draft com nota)** / **Editar inline**.
- Ação `Publicar` só aparece quando `doctrinal_review` + score ≥ 85 + checklist mínimo verde.

### S2.4 — Guardrail editorial
- `scripts/saints-editorial-integrity.ts`: valida bio curta ≥ 150 chars, bio longa ≥ 800, ≥ 1 escrito, ≥ 1 iconografia, ≥ 3 nexus_relations, oração associada.
- Workflow `.github/workflows/saints-editorial.yml` roda em PRs que tocam `supabase/seeds/saints*` ou `src/data/saints*`.
- Falha bloqueia merge.

### S2.5 — Nexus e closure
- Para cada doutor aprovado: gera ≥ 3 arestas em `nexus_relations` (1 Bíblia, 1 CIC, 1 obra própria).
- Preenche `editorial_closure` conforme schema Zod já vigente.

## Detalhes técnicos

- Reuso: `SaintsAdmin`, `SaintsEnrichmentPanel`, `SaintsReimportRunsPanel`, `saint-import` edge function, `saints_enrichment_runs`, `saints_reimport_runs`, `saint_import_logs`.
- Novo: 1 migration (higiene + inserts + trigger), 1 componente `DoctorReviewQueue.tsx`, 1 RPC `saints_advance_editorial_stage(id, next_status, note)`, 1 script guardrail, 1 workflow.
- Sem novas deps.
- Todas as mutações passam por `AdminGuard` + `has_role('editor'|'admin')`.

## Entregáveis
1. 36 Doutores no banco com IDs canônicos.
2. Fila de revisão funcional em `/admin/saints`.
3. Ingestão em lote disparável do painel.
4. Guardrail editorial no CI.
5. Relatório final: antes×depois (score médio, cobertura editorial, nexus/santo).

## Ordem de execução
S2.1 → S2.2 → S2.3 → S2.4 → S2.5. Cada etapa entrega um marco navegável. Homologação sequencial (Regra 12 do COS).
