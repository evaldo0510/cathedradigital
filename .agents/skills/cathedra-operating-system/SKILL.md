---
name: cathedra-operating-system
description: Roteador mestre do Cathedra. Ativar SEMPRE que a tarefa envolver qualquer módulo do Cathedra (Glossário, Missal, Liturgia das Horas, Orações, Santos, Bíblia, Jornadas, Nexus, Reader, admin editorial, ou qualquer alteração de UI/dados do projeto). Mapeia arquivos e rotas afetados para os skills especializados que devem ser co-ativados, e impõe protocolos de Preflight, Classificação, Matriz de Impacto, Pós-validação e Engineering Log.
---

# Cathedra Operating System (COS)

Sistema operacional editorial do Cathedra. **Não substitui** os skills especializados — coordena quais devem ser co-ativados por tarefa e impõe o ciclo completo: **Preflight → Classificação → Matriz de Impacto → Execução → Pós-validação → Engineering Log**.

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

---

## Checklist do COS por turno

- [ ] Preflight declarado
- [ ] Classificação declarada
- [ ] Matriz de Impacto declarada
- [ ] Skills co-ativados listados (Guardian incluído)
- [ ] Tarefa executada respeitando skills carregados
- [ ] Pós-validação executada
- [ ] Engineering Log entregue
