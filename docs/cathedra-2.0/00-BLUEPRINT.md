# Cathedra 2.0 — Blueprint

Documento único que liga a Constituição do Cathedra (Manifesto, Arquitetura da Informação, Jornadas, Design System, Wireframes) à execução real (componentes, rotas, banco, edge functions, Nexus, PCL, deploy).

Este é o **único documento que a equipe consulta antes de abrir sprint**. Se algo não está aqui, ou está desatualizado, ou não deveria existir.

---

## 0. Status

| Camada | Documento | Status |
|---|---|---|
| Missão | (implícita no Manifesto) | Fundação |
| Manifesto | `01-MANIFESTO.md` | ✅ Constituição |
| Arquitetura da Informação | `02-INFORMATION-ARCHITECTURE.md` | ✅ Constituição |
| Jornadas | `03-USER-JOURNEYS.md` | ✅ Constituição |
| Design System | `04-DESIGN-SYSTEM.md` | ✅ Constituição |
| Wireframes | `05-WIREFRAMES.md` | ✅ Constituição |
| Blueprint | `00-BLUEPRINT.md` (este) | ✅ Contrato de execução |
| Protótipo navegável | `/prototype-2.0` | 🟢 vivo (baixa fidelidade) |
| Implementação | sprints 2.0.1 → 2.0.6 | ⏳ a iniciar |

**Regra:** nenhum documento da Constituição é alterado sem ADR. Este Blueprint pode ser refinado a cada sprint, mas suas seções §3 (regras de execução) e §5 (roadmap por ambientes) são congeladas até o fim do 2.0.

---

## 1. Cadeia de causalidade

```text
              MISSÃO
                │  "levar o tesouro da fé à mesa do usuário"
                ▼
             MANIFESTO           ── quem somos, o que não somos
                │
                ▼
         ARQUITETURA DA           ── 5 ambientes + camadas transversais
          INFORMAÇÃO
                │
                ▼
             JORNADAS             ── J1..J6, critérios de sucesso
                │
                ▼
          DESIGN SYSTEM           ── grid, tipografia, tokens, cartões
                │
                ▼
            WIREFRAMES            ── 5 telas âncora
                │
                ▼
           COMPONENTES            ── shell, leitor universal, cartões
                │
                ▼
              ROTAS               ── /, /estudar, /rezar, /formar-se, /minha-jornada
                │
                ▼
              BANCO               ── TemaCanonico, Verbete, NexusEdge, DiarioEntry…
                │
                ▼
         EDGE FUNCTIONS           ── search, nexus-suggest, logos-ai, pcl-*
                │
                ▼
              NEXUS               ── grafo consolidado, versionado
                │
                ▼
               PCL                ── Perpetual Continuous Learning (telemetria → curadoria)
                │
                ▼
             DEPLOY               ── PWA · Lovable Cloud · custom domain
```

Cada seta é uma **obrigação de rastreabilidade**: qualquer decisão em uma camada precisa apontar para a camada anterior. Nada aparece "do nada".

---

## 2. Vocabulário oficial

A partir daqui, o vocabulário do projeto muda. Vale para código, PRs, ADRs, tickets, comunicação com usuário.

### Antes → Agora

| Antes (módulos) | Agora (ambientes) |
|---|---|
| Módulo Bíblia | Conteúdo dentro do **Ambiente Estudar** (via Leitor Universal) |
| Módulo Catecismo | Conteúdo dentro do Ambiente Estudar |
| Módulo Magistério | Conteúdo dentro do Ambiente Estudar |
| Módulo Rosário / Ofício / Lectio | Conteúdo dentro do **Ambiente Rezar** |
| Módulo Jornadas / Itineraria / Trilhas | Conteúdo dentro do **Ambiente Formar** |
| Módulo Busca / ⌘K | **Ambiente Pesquisar** (cômodo) + camada ⌘K |
| Módulo Diário / Favoritos / Perfil | **Ambiente Minha Jornada** |
| Módulo Logos IA | **Camada Logos** (transversal, nunca cômodo) |
| "Feature X" | "Conteúdo/comportamento dentro do Ambiente Y" |

### Regra léxica

> **"Módulo" refere-se a conteúdo (Bíblia, CIC, Padres…). "Ambiente" refere-se a estrutura (Átrio, Estudar, Rezar, Formar, Pesquisar, Minha Jornada). Nunca use "módulo" para se referir a uma tela ou fluxo.**

---

## 3. Regras de execução (congeladas até o fim do 2.0)

Toda entrega — código, design, texto, ADR — passa por estas três perguntas antes de ser aberta:

1. **Qual ambiente da arquitetura estamos construindo?** (um só por sprint)
2. **Qual jornada (J1..J6) essa entrega completa?** (do início ao fim, sem deixar pendências)
3. **Quais documentos da Constituição fundamentam essa implementação?** (citar §)

Se qualquer resposta for vaga, o sprint **não abre**.

Regras adicionais:

- **Um ambiente por sprint.** Zero paralelismo de ambientes.
- **Zero módulos novos.** Todo conteúdo entra por dentro de um ambiente já implementado.
- **Zero libs novas** sem ADR próprio. O 2.0 privilegia o stack existente.
- **Zero telas fora dos wireframes.** Nova tela → primeiro atualizar `05-WIREFRAMES.md`.
- **Zero decisão visual fora do Design System.** Novo token/cartão → primeiro atualizar `04-DESIGN-SYSTEM.md`.
- **Relatório antes×depois obrigatório** ao fim de cada sprint (métricas objetivas: LCP, INP, cobertura, contagem de rotas, erros).

---

## 4. Mapa de peças (o que existe × o que falta)

### 4.1 Componentes

| Componente | Papel | Estado |
|---|---|---|
| `PrototypeShell` | Casca das 5 telas do protótipo | ✅ (baixa fidelidade) |
| `LeitorUniversal` | Casca única para Bíblia/CIC/Padres/Mag/… | 🔴 falta (existe 1 por fonte hoje) |
| `CartaoLeitura` / `CartaoAcao` | Dois cartões oficiais do DS v2 | 🔴 falta |
| `AmbienteHeader` | Header padrão dos 5 ambientes | 🟡 rascunho no protótipo |
| `BottomNav` (5 ambientes) | Nav global | 🟡 existe versão 1.0, precisa refatorar |
| `CommandCenter` (⌘K) | Overlay unificado busca+Nexus | 🟡 existe, precisa unificação |
| `NexusPopover` | Popover não-modal sob âncora | 🔴 falta |
| `ModoPrece` (provider) | Estado global esconde nav/logos/popovers | 🔴 falta |
| `LogosFloating` | Botão flutuante contextual | 🟡 existe, precisa rerotular |

### 4.2 Rotas (destino final v2)

| Ambiente | Rota | Estado |
|---|---|---|
| Átrio | `/` | 🟡 existe 1.0, precisa reescrita |
| Estudar | `/estudar/*` | 🔴 falta (hoje: `/bible`, `/catechism`, `/magisterium`, …) |
| Rezar | `/rezar/*` | 🔴 falta (hoje: `/rosary`, `/liturgia`, `/lectio`, …) |
| Formar-se | `/formar-se/*` | 🔴 falta (hoje: `/jornadas`, `/itineraria`, `/trilhas`) |
| Pesquisar | `/pesquisar` + ⌘K | 🟡 existe `/buscar`, precisa unificar |
| Minha Jornada | `/minha-jornada/*` | 🔴 falta (hoje: `/profile`, `/diario`, `/favorites`, …) |
| Admin | `/admin/*` | ✅ já isolado |

Mapa 1‑pra‑1 de redirects: fica em `06-ARC-MAP-v2.md` (a produzir no início da Sprint 2.0.1).

### 4.3 Banco (contratos de dados)

Novas tabelas exigidas pela Constituição, ainda a modelar:

| Tabela | Papel | Referência |
|---|---|---|
| `tema_canonico` | Identidade de um tema (Perdão, Videira…) e cobertura por fonte | Wireframes T2b, Revisão §R1 |
| `nexus_edge` | Arestas do grafo (fonteA § → fonteB §) com peso/curadoria | Revisão §R2 |
| `verbete` | Unificação Enciclopédia + A-Z + Glossário + Dogmas | AI §2, Revisão §R3 |
| `testemunho_ref` | Referências a santos/papas/aparições ligadas a temas | AI §2 |
| `jornada_v2` | Refatoração de Jornadas/Itineraria/Trilhas em um só | AI §4 |
| `diario_entry` | Destino único do "Anotar" transversal | AI §6 |
| `continuidade` | Últimas 3 sessões por usuário (retomar universal) | AI camadas |

Contrato SQL de cada uma: definido no início de cada sprint que precisar da tabela (não antes).

### 4.4 Edge functions

| Função | Papel | Sprint |
|---|---|---|
| `search-universal` | Busca unificada (⌘K + `/pesquisar`) | 2.0.4 |
| `nexus-suggest` | Sugere âncoras a partir de referência | 2.0.5 |
| `nexus-graph-build` | Job de consolidação do grafo | 2.0.5 |
| `logos-explain` / `logos-guide` / `logos-deepen` | 3 verbos do Logos | após 2.0.6 |
| `pcl-collect` | Coleta telemetria anônima de uso → curadoria | após 2.0.6 |

Nada é criado antes de a interface que consome existir.

### 4.5 Nexus

- **Contrato de qualidade** (mínimo de cobertura por tema, revisão editorial, versão do grafo) → definido na Sprint 2.0.5, não antes.
- Até lá, Nexus aparece **apenas como placeholder** no protótipo/UI, nunca como promessa ao usuário.

### 4.6 PCL (Perpetual Continuous Learning)

Loop **telemetria anônima → curadoria → conteúdo → produto**. Fora do MVP 2.0 inicial. Só faz sentido após 2.0.6.

### 4.7 Deploy

- PWA já em produção (`cathedradigital.com.br`). Não muda de infra no 2.0.
- Cada sprint tem release próprio, atrás de feature flag por ambiente (`ff_atrio_v2`, `ff_estudar_v2`, …).
- Rota `/prototype-2.0` **é permanente** durante toda a construção: serve como referência viva do destino.

---

## 5. Roadmap por ambientes (não por módulos)

**Regra:** uma sprint = um ambiente = uma feature flag = um release. Não abre a próxima antes da anterior estar em produção com métricas medidas.

### Sprint 2.0.1 — Ambiente Átrio

- **Ambiente:** Átrio.
- **Jornadas completadas:** J1 (Primeiro acesso), J6 (Continuação), parte de J3 (entrada em oração).
- **Fundamentação:** Manifesto §Pilares, AI §1, Jornadas §J1/J6, DS §Cartões, Wireframes §Tela 1.
- **Entrega:** rota `/` reescrita, header/nav novos, Ritual do Dia funcional (mesmo com dados stub), Continuidade real, ambient litúrgico.
- **Fora de escopo:** qualquer coisa dentro dos outros 4 ambientes.
- **Sai atrás de** `ff_atrio_v2`.

### Sprint 2.0.2 — Ambiente Estudar (estrutura)

- **Ambiente:** Estudar.
- **Jornadas completadas:** navegação "Por Tema / Por Fonte / Testemunhos / Verbete" — ainda sem conteúdo real dentro.
- **Fundamentação:** AI §2, Jornadas §J2 (parcial), Wireframes §Tela 2.
- **Entrega:** `/estudar/*`, tabela `tema_canonico`, ~50 temas curados sem cobertura completa, Estudo Composto como shell.
- **Fora de escopo:** Leitor real (vem na 2.0.3). Nexus (vem na 2.0.5).

### Sprint 2.0.3 — Ambiente Estudar (Leitor Universal)

- **Ambiente:** Estudar (mesmo ambiente, agora com conteúdo).
- **Jornadas completadas:** J2 completo, base para J3/J4/J5/J6.
- **Fundamentação:** Manifesto §Pilar "conteúdo é meio", DS §Leitor, Wireframes §Tela 3.
- **Entrega:** um único componente `LeitorUniversal`; migração de Bíblia → CIC → Magistério (nesta ordem) para dentro dele. Bíblia removida como rota isolada.
- **Fora de escopo:** Padres/Concílios/Aquino (entram como conteúdo depois, sem novo componente).

### Sprint 2.0.4 — Ambiente Pesquisar

- **Ambiente:** Pesquisar (cômodo + ⌘K).
- **Jornadas completadas:** J4.
- **Fundamentação:** AI §5, Wireframes §Tela 4.
- **Entrega:** `search-universal` edge function, overlay ⌘K unificado, `/pesquisar` como superfície, sintaxe rápida (`jo 15`, `cic 1234`).
- **Fora de escopo:** Nexus embutido nos resultados (chega na 2.0.5).

### Sprint 2.0.5 — Nexus

- **Ambiente:** camada transversal (não é cômodo).
- **Jornadas completadas:** aprofunda J2 e J4.
- **Fundamentação:** Revisão §R2, AI §Camadas, DS §Popover.
- **Entrega:** `nexus_edge`, `nexus-graph-build`, `NexusPopover`, ícone ° no Leitor e Pesquisa, política de qualidade.
- **Bloqueante:** sem contrato de qualidade, não vai a produção.

### Sprint 2.0.6 — Ambiente Minha Jornada

- **Ambiente:** Minha Jornada.
- **Jornadas completadas:** J5 completo, fecha o ciclo de todas as outras (destino do "Anotar", "Favoritar", "Retomar").
- **Fundamentação:** AI §6, Wireframes (a produzir para esta tela).
- **Entrega:** `/minha-jornada/*`, Diário, Favoritos, Notas, funil de Assinatura, `diario_entry`, `continuidade`.

### Depois de 2.0.6

- Ambiente Rezar (não entra como sprint numerada porque é migração pura do 1.0 para dentro do Leitor Universal + Modo Prece).
- Ambiente Formar-se (idem: migração de Jornadas/Itineraria/Trilhas para `jornada_v2`).
- Logos IA (3 verbos), Certamen, Adoração silenciosa, Comunidade — todos com ADR próprio, fora do MVP 2.0.

---

## 6. Checklist oficial de abertura de sprint

Nenhum sprint 2.0.x abre sem este checklist assinado no ADR:

```text
[ ] Ambiente-alvo declarado (um só)
[ ] Jornada(s) que a entrega completa listada(s)
[ ] Documentos da Constituição citados (§ específicos)
[ ] Wireframes atualizados (se houver tela nova)
[ ] Design System atualizado (se houver token/cartão novo)
[ ] Contrato de dados definido (tabelas + GRANTs + RLS)
[ ] Feature flag criada
[ ] Métricas antes registradas (LCP, INP, contagem de rotas, erros)
[ ] Plano de redirect das rotas 1.0 afetadas
[ ] Critério objetivo de "pronto" declarado
```

E este checklist para **fechar** o sprint:

```text
[ ] Todas as jornadas declaradas passam end-to-end no protótipo real
[ ] Nenhuma rota 1.0 afetada quebrou (redirects verificados)
[ ] Métricas depois registradas + comparativo antes×depois
[ ] Feature flag ativa em produção
[ ] Nenhuma nova rota fora do ambiente-alvo
[ ] `00-BLUEPRINT.md` §4 (Mapa de peças) atualizado
```

---

## 7. Governança

- **Guardião do Blueprint:** o usuário (arquiteto de produto). Nenhuma alteração em §3 e §5 sem aprovação dele.
- **Frequência de revisão:** ao fim de cada sprint, seção §4 é atualizada; §1, §2, §3, §5 só mudam com ADR.
- **Fonte de verdade:** este arquivo. Se um ADR diverge daqui, o ADR está errado.

---

## 8. Encerramento da fase de arquitetura

A partir da aprovação deste Blueprint, a fase de **produção de documentação** está encerrada.

Novos documentos só nascem a serviço de um sprint ativo (ex.: `06-ARC-MAP-v2.md` na Sprint 2.0.1, contrato de qualidade do Nexus na 2.0.5). Nada de documento "geral" adicional.

A próxima entrega esperada não é um documento. É a **Sprint 2.0.1 — Ambiente Átrio**, aberta segundo o checklist do §6.
