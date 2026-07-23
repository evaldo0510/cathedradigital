---
name: cathedra-operating-system
description: Roteador mestre do Cathedra. Ativar SEMPRE que a tarefa envolver qualquer módulo do Cathedra (Glossário, Missal, Liturgia das Horas, Orações, Santos, Bíblia, Jornadas, Nexus, Reader, admin editorial, ou qualquer alteração de UI/dados do projeto). Mapeia arquivos e rotas afetados para os skills especializados que devem ser co-ativados, e impõe protocolo de abertura/fechamento de qualquer sprint ou onda.
---

# Cathedra Operating System (COS)

Sistema operacional editorial do Cathedra. **Não substitui** os skills especializados — apenas coordena quais devem ser co-ativados por tarefa e impõe o ritual de entrega.

## Protocolo de abertura (obrigatório antes de qualquer edição)

1. Ler o pedido e identificar os módulos tocados (arquivos, rotas, tabelas).
2. Cruzar com a **Matriz de Ativação** abaixo para listar os skills a co-ativar.
3. Declarar no início da resposta:
   - `Skills carregados: [lista]`
   - Se algum skill obrigatório para a tarefa **não estiver injetado no contexto**, PARAR e solicitar ativação — não editar código.
4. Só então executar a tarefa.

## Matriz de Ativação (arquivo/rota → skills)

| Sinal na tarefa | Skills obrigatórios (além do COS) |
|---|---|
| `src/pages/GlossaryTermPage`, `glossary`, `nexus_relations`, `/admin/glossario`, `/admin/editorial-audit` | `cathedra-glossary-editorial-expert` + `cathedra-knowledge-graph-expert` + `cathedra-guardian` |
| `MissaContinuousReader`, `BreviaryContinuousReader`, `liturgy-*`, `LiturgyProvider`, calendário litúrgico | `cathedra-prayer-engine-expert` + `cathedra-liturgy-expert` + `cathedra-knowledge-graph-expert` + `cathedra-guardian` |
| `PrayerEngineReader`, `PrayerPortal`, `prayer_sections/blocks/mysteries`, `/oracao/*`, Rosário, Via Sacra | `cathedra-prayer-engine-expert` + `cathedra-knowledge-graph-expert` + `cathedra-guardian` |
| `saints` (tabela), `/santos/*`, doutores, padres, mártires | `cathedra-saints-expert` + `cathedra-knowledge-graph-expert` + `cathedra-guardian` |
| `EditorialHero`, `EditorialCard`, `ContentSkeleton`, `PrayerPortal`, `data-space`, `typography.css`, tokens semânticos, qualquer componente `src/components/**` | `cathedra-design-system-guardian` + `cathedra-guardian` |
| `nexus_relations`, `AutoNexusList`, `resolveNexusHref`, `NexusSourceBadge` | `cathedra-knowledge-graph-expert` + `cathedra-guardian` |
| Bíblia (`Bible`, `BibleReader`, `bible_*`) | `cathedra-knowledge-graph-expert` + `cathedra-design-system-guardian` + `cathedra-guardian` |
| Jornadas (`JornadaDetailPage`, `journey_*`) | `cathedra-knowledge-graph-expert` + `cathedra-design-system-guardian` + `cathedra-guardian` |
| Área do usuário (`/conta/*`, sidebar, layout shell) | `cathedra-design-system-guardian` + `cathedra-guardian` |
| Editorial Engine (`src/lib/editorial-engine/**`, manifests, Mission Control) | `cathedra-guardian` (+ o expert do módulo tocado) |
| Fechamento de sprint / onda / feature "pronta" | `cathedra-guardian` (auditoria bloqueante) |

Regra geral: **`cathedra-guardian` é sempre co-ativado**. Ele é o auditor final.

## Priorização entre skills conflitantes

Se dois skills discordarem sobre uma decisão:

1. `cathedra-guardian` tem palavra final sobre identidade espiritual e Logos 2030.
2. `cathedra-prayer-engine-expert` tem palavra final sobre arquitetura de oração.
3. `cathedra-liturgy-expert` tem palavra final sobre correção doutrinal litúrgica.
4. `cathedra-knowledge-graph-expert` tem palavra final sobre shape do Nexus.
5. `cathedra-design-system-guardian` tem palavra final sobre primitivos visuais.
6. Skills de conteúdo (`glossary`, `saints`) definem o resto.

## Protocolo de fechamento (obrigatório ao final de qualquer entrega significativa)

Reportar, nesta ordem, em bloco final:

```
Skills carregados: <lista>
Componentes reutilizados: <lista de primitivos/hooks/páginas reaproveitados>
Componentes novos: <lista com justificativa (por que não coube em existente)>
Regras respeitadas: <checklist dos skills ativados>
TypeScript: ✅ limpo | ❌ N erros
Regressões: <nenhuma | lista com arquivo:linha>
```

Se qualquer campo for negativo (erros TS, regressões, componente novo sem justificativa), a entrega é declarada **BLOQUEADA** e não homologada.

## Proibições

- Editar código sem antes declarar os skills carregados.
- "Esquecer" o `cathedra-guardian` — ele é sempre obrigatório.
- Substituir um skill especializado por conhecimento genérico ("eu sei que shadcn faz assim") quando o skill do módulo definiu regra específica.
- Marcar entrega como concluída sem o bloco de fechamento.
- Criar skill novo que duplique regras já cobertas por um dos 7 especializados — em vez disso, estender o existente.

## Checklist do COS por turno

- [ ] Módulos identificados
- [ ] Skills co-ativados listados
- [ ] Guardian ativo
- [ ] Tarefa executada respeitando as regras dos skills carregados
- [ ] Bloco de fechamento entregue
- [ ] TypeScript validado
