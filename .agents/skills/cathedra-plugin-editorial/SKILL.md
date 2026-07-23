---
name: cathedra-plugin-editorial
description: Plugin Editorial do Cathedra OS. Ativar quando a tarefa envolver ICE, Gate Editorial, Editorial Engine, Mission Control, Collections, editorial_snapshots, editorial_jobs, glossary_generate_deep, quality gate, freeze/certificação, doctrinal_weight, correction priority, ou qualquer painel /admin/editorial-*.
---

# Plugin Editorial

Responsabilidades:
- **ICE** (Índice de Confiança Editorial) — cálculo, tiers (Ouro/Prata/Bronze/Revisão), ICE ponderado por `doctrinal_weight`.
- **Gate Editorial** — bloqueio de publicação via `glossary_quality_gate` (trigger).
- **Editorial Engine** — `src/lib/editorial-engine/**`, manifestos, `validateManifest`, registry.
- **Mission Control** — `/admin/mission-control`, agregação por módulo.
- **Editorial Audit** — `/admin/editorial-audit`, fila de correção, Painel de Missão, Certificado v1.0.
- **Collections** — motor de coleções, Collections Studio.
- **Snapshots** — `editorial_snapshots`, regressão editorial.
- **Jobs** — `editorial_jobs`, checkpoint, pausa/retomada.

Regras invioláveis:
- Manifesto é fonte da verdade. Não hardcode campos/pesos fora do manifest.
- `assertValidManifest` fail-fast no boot — qualquer manifesto novo passa por validação.
- Gate bloqueia publicação; nunca contornar sem trigger explícito no banco.
- Score composto: `editorial_score` + `nexus_score`; alterações em pesos exigem novo snapshot.
- Selo de Congelamento (v1.0) só é emitido quando 100% dos verbetes atingem critérios.

Antes de agir:
1. Ler o manifest da entidade tocada (`src/lib/editorial-engine/manifests/`).
2. Verificar se a coluna/RPC já existe (`editorial_coverage`, `editorial_correction_priority`, `editorial_quality_gate`).
3. Nunca duplicar lógica de ICE fora de `src/lib/editorial-engine/ice.ts`.
