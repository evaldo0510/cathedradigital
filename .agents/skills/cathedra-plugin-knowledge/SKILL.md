---
name: cathedra-plugin-knowledge
description: Plugin Knowledge do Cathedra OS. Ativar quando a tarefa envolver Nexus Theologicus, Knowledge Graph, nexus_relations, AutoNexusList, resolveNexusHref, NexusSourceBadge, ReaderAutoNexus, Glossário, Santos, Padres, Doutores, Patrística, Magistério, Bíblia, cross-references teológicas, ou qualquer grafo de conhecimento do Cathedra.
---

# Plugin Knowledge

Responsabilidades:
- **Nexus Theologicus** — cross-references curadas entre todos os módulos.
- **nexus_relations** — schema canônico `(source_kind, source_id, target_kind, target_id, weight)`.
- **AutoNexusList** — geração automática a partir do banco.
- **ReaderAutoNexus** — adapters (Bíblia, CIC, Magistério, Santo, Liturgia, Oração, Glossário, Jornada).
- **resolveNexusHref** — resolução SPA (nunca `<a href>` externo para conteúdo interno).
- **NexusSourceBadge** — proveniência visual do link.
- **Glossário** (`glossary`, 47+ verbetes).
- **Santos** (`saints`, doutores/padres/mártires).
- **Magistério** (documentos vaticanos).
- **Bíblia** (soberania de dados local).

Regras invioláveis:
- Cross-refs sempre por `nexus_relations`; nunca hardcode.
- Kind/ID validados (evitar dangling references).
- Novos conteúdos precisam de conexões curadas OU via `AutoNexusList`.
- Guardrail de perf: `scripts/nexus-perf-guardrail.ts` dentro do budget.
- Não quebrar contexto do usuário (popovers, não navegação forçada).

Antes de agir:
1. Se cria conteúdo → definir conexões Nexus na mesma entrega.
2. Se altera rota → atualizar `resolveNexusHref` no mesmo commit.
3. Se adiciona novo `kind` → registrar em `RouteRegistry.ts` + adapter.
