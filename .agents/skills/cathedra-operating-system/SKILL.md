---
name: cathedra-operating-system
description: Roteador mestre do Cathedra. Ativar SEMPRE que a tarefa envolver qualquer módulo do Cathedra (Glossário, Missal, Liturgia das Horas, Orações, Santos, Bíblia, Jornadas, Nexus, Reader, admin editorial, ou qualquer alteração de UI/dados do projeto). Mapeia arquivos e rotas afetados para os skills especializados que devem ser co-ativados, e impõe protocolos de Preflight, Classificação, Matriz de Impacto, Pós-validação e Engineering Log.
---

# Cathedra Operating System (COS) — v1.0 (CONGELADO)

Sistema operacional editorial do Cathedra. **Núcleo estável**. Coordena skills especializados e impõe o ciclo: **Preflight → Classificação → Matriz de Impacto → Execução → Pós-validação → Engineering Log**.

> **Status:** v1.0 · CERTIFIED · congelado em 2026-07-23.
> Novas capacidades entram como **plugins** (`cathedra-plugin-*`), nunca no núcleo. Ver §8 (Freeze Protocol) e §9 (Manifest Registry).

## Escopo do núcleo (o que o COS faz — e nada além)

1. Preflight
2. Classificação da tarefa
3. Matriz de Impacto
4. Ativação de Skills e Plugins (via Manifest Registry)
5. Pós-validação
6. Engineering Log

**Tudo o mais é responsabilidade de um plugin.** Se surgir a tentação de embutir uma nova regra editorial, litúrgica, de conhecimento, de UX ou de IA no COS — parar e criar/estender o plugin correspondente.

---

## 1. Preflight (obrigatório antes de qualquer edição)

Checklist bloqueante. Se qualquer item falhar, PARAR e reportar ao usuário — não editar código.

- [ ] **Skills corretos carregados** (ver Matriz de Ativação abaixo). Se algum obrigatório não estiver no contexto → pedir ativação.
- [ ] **Manifesto da entidade válido** (quando toca Editorial Engine): rodar mentalmente `validateManifest`; verificar `lifecycle.status ≠ placeholder` para o módulo tocado.
- [ ] **Design System disponível**: `EditorialHero`, `EditorialCard`, `typography.css`, tokens semânticos, `resolveSpace.ts` presentes.
- [ ] **Sem conflito de rotas**: nova rota não colide com `src/App.tsx`; redirects legados preservados.
- [ ] **Sem duplicação de componente**: buscar equivalente antes de criar novo (grep por nome semanticamente próximo em `src/components/**`).
- [ ] **Regressões conhecidas revisadas**: checar `REPORTS/` e `docs/architecture/` quando a área é sensível (Prayer Engine, Liturgy, Nexus, Bíblia).

Declarar no início da resposta:
```
Preflight: ✅ (ou ❌ com item falho)
Skills carregados: [lista]
```

---

## 2. Classificação automática da tarefa

Antes de agir, classificar o pedido em uma ou mais categorias — determina o conjunto mínimo de skills:

| Categoria | Sinais na tarefa |
|---|---|
| **Editorial** | glossary, saints, prayers, collections, journeys, ICE, editorial_score, quality gate, snapshots |
| **Litúrgico** | Missal, LH, breviário, `liturgy-*`, `LiturgyProvider`, calendário litúrgico, cor litúrgica |
| **Prayer Engine** | `prayer_sections/blocks/mysteries`, `PrayerEngineReader`, `PrayerPortal`, `/oracao/*`, Rosário, Via Sacra |
| **UI/UX** | layout, sidebar, hero, card, tipografia, mobile, a11y, cores, tokens |
| **Administração** | `/admin/*`, Mission Control, Editorial Audit, permissões, roles |
| **Nexus** | `nexus_relations`, `AutoNexusList`, cross-refs, `resolveNexusHref`, `NexusSourceBadge` |
| **Banco de dados** | tabela nova, coluna, RLS, policy, migração, RPC, trigger |
| **Performance** | prefetch, lazy, memo, budget, `nexus-perf-guardrail`, Core Web Vitals |
| **Segurança** | secrets, RLS, GRANT, auth, RBAC, sanitização, XSS |

Declarar:
```
Classificação: [Editorial, Nexus] (exemplo)
```

---

## 3. Matriz de Ativação (arquivo/rota → skills)

`cathedra-guardian` é **sempre** co-ativado.

| Sinal na tarefa | Skills obrigatórios (além do Guardian) |
|---|---|
| `glossary*`, `/admin/glossario`, `/admin/editorial-audit` | `cathedra-glossary-editorial-expert` + `cathedra-knowledge-graph-expert` |
| `MissaContinuousReader`, `BreviaryContinuousReader`, `liturgy-*`, `LiturgyProvider`, calendário litúrgico | `cathedra-prayer-engine-expert` + `cathedra-liturgy-expert` + `cathedra-knowledge-graph-expert` |
| `PrayerEngineReader`, `PrayerPortal`, `prayer_sections/blocks/mysteries`, `/oracao/*` | `cathedra-prayer-engine-expert` + `cathedra-knowledge-graph-expert` |
| `saints`, `/santos/*`, doutores, padres, mártires | `cathedra-saints-expert` + `cathedra-knowledge-graph-expert` |
| `EditorialHero`, `EditorialCard`, `ContentSkeleton`, `data-space`, `typography.css`, tokens, `src/components/**` | `cathedra-design-system-guardian` |
| `nexus_relations`, `AutoNexusList`, `resolveNexusHref`, `NexusSourceBadge` | `cathedra-knowledge-graph-expert` |
| Bíblia (`Bible`, `BibleReader`, `bible_*`) | `cathedra-knowledge-graph-expert` + `cathedra-design-system-guardian` |
| Jornadas (`JornadaDetailPage`, `journey_*`) | `cathedra-knowledge-graph-expert` + `cathedra-design-system-guardian` |
| Área do usuário (`/conta/*`, sidebar, shell) | `cathedra-design-system-guardian` |
| Editorial Engine (`src/lib/editorial-engine/**`, manifestos, Mission Control) | (+ expert do módulo tocado) |
| Fechamento de sprint / onda / feature "pronta" | auditoria bloqueante do Guardian |
| Qualquer módulo de leitura (Bíblia, CIC, Glossário, Santos, Missal, LH, Orações, Jornadas, Coleções, Magistério) | `cathedra-design-system-guardian` + auditoria da Reader Architecture Rule (§10) |

---

## 10. Reader Architecture Rule (inegociável — congelada em v1.1)

Toda leitura na Cathedra obedece ao **Reader Template Master**:

```
ReaderShell
  ├─ EditorialHero
  ├─ HeaderContext          (slot opcional — variantes canônicas apenas)
  ├─ ReaderContent (children)
  │    └─ ReferencePopover (inline)
  ├─ NexusPanel
  └─ ReaderContinuation
```

Fonte única: `@/components/reader`.

Proibições (bloqueantes, sem exceção):

- **Se existir `ReaderShell`** → proibido criar outro Reader/Shell.
- **Se existir `NexusPanel`** → proibido criar outro Nexus. Isso inclui, retroativamente: `NexusBubbles`, `MysteryNexusPanel`, `AutoNexusList` local, `NexusFullList` local, `NexusInlinePreview` fora do ReferencePopover, e qualquer "painel de conexões" novo.
- **Se existir `ReferencePopover`** → proibido criar outro Popover de referência. Isso inclui, retroativamente: `BibleVersePopover`, `BibleDictionaryPopover`, `TagBubble` popover, popover ad-hoc de verbete/santo/CIC.
- **Se existir `HeaderContext`** → proibido criar cabeçalho contextual paralelo (litúrgico, jornada, catequese, estudo). Nova variante entra como implementação em `@/components/reader/HeaderContext`, nunca como componente solto.
- Extensão sempre via props / render props do primitivo canônico. Nunca via componente paralelo.
- Novos módulos de leitura devem passar pela auditoria de aderência (`docs/reader-architecture-master.md`) antes de merge.

Auditoria de aderência (score por módulo): ver `docs/reader-architecture-master.md`. Meta: **100% em todos os módulos até fim da Sprint Nexus 2.0**.

---

## 11. Regra da Leitura Universal (congelada em v1.2)

Todo módulo textual novo da Cathedra **deve nascer dentro do Reader**. Sem exceção. O esqueleto mínimo é:

- `ReaderShell` — layout raiz
- `EditorialHero` — cabeçalho editorial
- `ReferencePopover` — toda referência inline (Bíblia, CIC, verbete, santo, oração)
- `NexusPanel` — conexões teológicas
- `ReaderContinuation` — rodapé de continuidade
- `HeaderContext` — obrigatório quando o módulo tem contexto de domínio (litúrgico, jornada, catequese, estudo)

Um PR que introduza um módulo textual sem esses primitivos é **automaticamente BLOQUEADO** pelo guardrail do CI (`scripts/reader-guardrail.ts`). Justificativas do tipo "é diferente" ou "é temporário" são recusadas. Se a arquitetura atual não atende, o caminho é **estender o primitivo canônico**, nunca duplicá-lo.


---

## 12. Regra da Homologação Sequencial (congelada em v1.3)

Enquanto existir **qualquer onda aberta da Sprint C0** (Homologação Geral Cathedra), é PROIBIDO:

- iniciar Sprint K (Catequese)
- iniciar Sprint I (Identidade)
- abrir qualquer módulo textual novo fora do plano C0
- promover mudanças estéticas amplas fora do escopo da onda vigente

Correções pontuais de bug, segurança e a11y continuam permitidas. Toda outra frente entra na fila.

Justificativa: a dívida de padronização só é debelada se cada módulo vigente for fechado antes que o próximo se abra. Quebrar a sequência recria os débitos que a C0 existe para eliminar.

Plano oficial congelado:

```
Sprint C0
├── C0.1  Missal                       [CERTIFIED]
├── C0.2  Liturgia das Horas           [CERTIFIED]
├── C0.3  Homologação do Prayer Engine [em andamento — fase 1 CERTIFIED]
│   ├── C0.3.1  Rosário
│   ├── C0.3.2  Via Sacra
│   ├── C0.3.3  Novenas
│   └── C0.3.4  Ladainhas
├── C0.4  Santos
├── C0.5  Bíblia
├── C0.6  Catecismo
├── C0.7  Jornadas
├── C0.8  Coleções
└── C0.9  ICE Universal (Essencial → Gate por módulo em fase 2)

Sprint K  · Catequese
Sprint I  · Identidade Cathedra
```

**C0.3 — Nota arquitetural:** Rosário, Via Sacra, Novenas e Ladainhas
partilham o mesmo motor (`PrayerEngineReader`). A onda fecha o eixo inteiro
migrando o motor para `ReaderShell` + `EditorialHero` + `PrayerContext` +
`NexusPanel` + `ReaderContinuation`. `PrayerPortal` continua existindo
como *portal de entrada*, mas deixa de ser Reader. Fase 2 remove
`MysteryNexusPanel` legado substituindo por `NexusPanel` per-mistério.


**ICE Universal (C0.10)** entrega apenas o núcleo essencial:
`editorial_completeness`, ICE 0–100, badge Ouro/Prata/Bronze/Revisão, snapshots e leitura no Mission Control — **sem gate bloqueante**. Gates específicos por entidade (manifesto próprio + certificação individual) só entram numa fase 2 após cada módulo ter sido homologado na C0.

---


## 4. Matriz de Impacto (obrigatória antes de editar)

Gerar internamente e declarar no início da execução:

```
Impacto
- Módulos:     ✔ <tocados>  ✖ <não tocados relevantes>
- Banco:       sim | não
- Migração:    sim | não  (se sim: reversível? destrutiva?)
- Rotas:       sim | não  (novas / renomeadas / redirects)
- Skills críticos ativos: [lista]
- Risco:       baixo | médio | alto
- Justificativa do risco: <1 linha>
```

Se `Risco = alto` (migração destrutiva, mudança em Prayer/Liturgy Engine, RLS, auth, ou refatoração cross-módulo), **exigir confirmação explícita do usuário antes de executar**.

---

## 5. Priorização entre skills conflitantes

1. `cathedra-guardian` — palavra final sobre identidade espiritual e Logos 2030.
2. `cathedra-prayer-engine-expert` — palavra final sobre arquitetura de oração.
3. `cathedra-liturgy-expert` — palavra final sobre correção doutrinal litúrgica.
4. `cathedra-knowledge-graph-expert` — palavra final sobre shape do Nexus.
5. `cathedra-design-system-guardian` — palavra final sobre primitivos visuais.
6. Skills de conteúdo (`glossary`, `saints`) — definem o resto.

---

## 6. Pós-validação automática (obrigatória ao final)

Checklist antes de declarar a entrega concluída:

- [ ] **TypeScript limpo** (build/typecheck sem erros nos arquivos tocados)
- [ ] **Sem duplicação de componente** — cada novo componente tem justificativa
- [ ] **Reutilização do Design System** — `EditorialHero`/`EditorialCard`/tokens usados quando aplicável
- [ ] **Compatibilidade mobile** — layout testado mentalmente em viewport ≤ 640px
- [ ] **Compatibilidade Mission Control** — se toca Editorial Engine, `auditRegistry()` não quebra
- [ ] **Compatibilidade Editorial Engine** — manifestos ainda validam
- [ ] **Compatibilidade Nexus** — `resolveNexusHref` cobre novas rotas; `AutoNexusList` não quebra
- [ ] **Compatibilidade Prayer Engine** — leitores continuam consumindo `engine_version = 2`
- [ ] **Rotas legadas preservadas** (redirects intactos)
- [ ] **Zero regressão em módulos não tocados**

Se qualquer item falhar → status **BLOQUEADO**.

---

## 7. Engineering Log (obrigatório ao final)

Bloco final padronizado, sempre nesta forma:

```
Cathedra Engineering Log
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sprint / Tarefa:      <nome>
Classificação:        <categorias>
Skills carregados:    <lista>
Arquivos alterados:   <N>
Componentes reutilizados: <N> (<lista curta>)
Componentes novos:    <N> (<justificativa>)
Banco:                sim | não
Migrações:            sim | não  (reversível? sim | não)
Rotas afetadas:       <lista ou "nenhuma">
Regressões:           <nenhuma | lista com arquivo:linha>
TypeScript:           ✅ limpo | ❌ N erros
Pós-validação:        ✅ passou | ❌ item falho
Status:               CERTIFIED | BLOQUEADO | ATENÇÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Status:
- **CERTIFIED** — todos os checks verdes.
- **ATENÇÃO** — entrega funcional mas com dívida técnica declarada.
- **BLOQUEADO** — não homologada; requer ajuste.

---

## Proibições

- Editar código sem Preflight declarado.
- Pular a Classificação ou a Matriz de Impacto.
- "Esquecer" o `cathedra-guardian`.
- Substituir skill especializado por conhecimento genérico.
- Executar tarefa de risco alto sem confirmação do usuário.
- Marcar entrega como concluída sem Engineering Log.
- Criar skill novo que duplique regras dos 7 especializados — estender o existente.
- **Adicionar novo comportamento ao núcleo do COS** — deve entrar como plugin (ver §8).

---

## 8. Freeze Protocol (v1.0)

O COS está **congelado**. Após homologação da v1.0, o núcleo só pode mudar em três casos:

1. **Quebra arquitetural** — uma premissa fundamental do fluxo (Preflight → Log) deixou de ser válida.
2. **Novo tipo de módulo** — surge uma categoria que nenhum plugin existente cobre (ex.: multimídia, gamificação profunda).
3. **Mudança no fluxo de engenharia** — o próprio ciclo de 6 passos precisa evoluir.

Qualquer outra necessidade → **plugin novo** ou **extensão de plugin existente**. Nunca editar o núcleo por conveniência.

Toda alteração ao núcleo exige:
- justificativa explícita em uma das 3 categorias acima;
- bump de versão (`v1.1`, `v2.0`);
- entrada no `CHANGELOG` do COS em `docs/CATHEDRA-CONSTITUTION.md`.

---

## 9. Manifest Registry (arquivo → plugins)

Mapeamento explícito entre módulos do Cathedra e plugins responsáveis pela validação. O COS consulta este registro no Preflight para saber quais plugins ativar.

| Módulo / sinal | Plugins ativados |
|---|---|
| Glossário (`glossary*`, `/admin/glossario`, `/admin/editorial-audit`) | `editorial` + `knowledge` |
| Rosário / Via Sacra / Orações (`/oracao/*`, `PrayerEngineReader`) | `prayer` + `knowledge` |
| Missal (`MissaContinuousReader`, `liturgy-*`) | `prayer` + `editorial` |
| Liturgia das Horas (`BreviaryContinuousReader`) | `prayer` + `editorial` |
| Santos (`saints`, `/santos/*`) / Patrística / Doutores | `knowledge` + `editorial` |
| Magistério (`magisterium*`) | `knowledge` |
| Bíblia (`Bible`, `bible_*`) | `knowledge` + `ux` |
| Jornadas (`journey_*`) | `knowledge` + `editorial` |
| Coleções (`collections*`) | `editorial` + `knowledge` |
| Mission Control (`/admin/mission-control`) | `editorial` |
| Nexus (`nexus_relations`, `AutoNexusList`) | `knowledge` |
| Design tokens, Hero, Card, spaces, typography, `/conta/*` | `ux` |
| RAG / MCP / Semantic Search / Recomendações / Cathedra AI | `ai` |

Skills concretos ativados por plugin:

| Plugin | Skill root | Especializados invocados |
|---|---|---|
| `editorial` | `cathedra-plugin-editorial` | `cathedra-glossary-editorial-expert` |
| `prayer` | `cathedra-plugin-prayer` | `cathedra-prayer-engine-expert`, `cathedra-liturgy-expert` (missal/LH) |
| `knowledge` | `cathedra-plugin-knowledge` | `cathedra-knowledge-graph-expert`, `cathedra-saints-expert` (santos/patrística) |
| `ux` | `cathedra-plugin-ux` | `cathedra-design-system-guardian` |
| `ai` | `cathedra-plugin-ai` | (skills de IA sob demanda) |

`cathedra-guardian` é **sempre** ativado, independente de plugin.

---

## Checklist do COS por turno

- [ ] Preflight declarado
- [ ] Classificação declarada
- [ ] Matriz de Impacto declarada
- [ ] Plugins ativados via Manifest Registry (§9)
- [ ] Skills co-ativados listados (Guardian incluído)
- [ ] Tarefa executada respeitando skills carregados
- [ ] Pós-validação executada
- [ ] Engineering Log entregue
