# STAB-001 — Inventário Funcional

**Projeto:** CATHEDRA STABILIZATION  
**Fase:** STAB-001 (Inventário)  
**Data:** 2026-07-16  
**Método:** Auditoria automatizada via Playwright headless contra `http://localhost:8080` (dev server ativo, usuário anônimo, viewport 1280×1800). Cada rota foi carregada com `wait_until=domcontentloaded` + `networkidle` (8s) + settle de 1,2s. Coletados: erros de console, `pageerror`, respostas HTTP ≥400 (separando Supabase/Edge do resto) e falhas de rede.

## Legenda

- ✅ **OK** — carrega sem erro de console, sem falha de rede, sem 4xx/5xx
- ⚠️ **DEGRADED** — carrega, mas com warnings/erros de console **ou** falhas de rede secundárias (ex.: imagens externas bloqueadas)
- ❌ **CRITICAL** — `pageerror` disparado, 500 em Supabase/Edge, ou tela de erro visível para o usuário

## Matriz — 37 rotas auditadas

| # | Módulo | Rota | Status | Observação |
|---|--------|------|:---:|---|
| 1 | Home | `/` | ✅ | — |
| 2 | Bíblia | `/bible` | ✅ | — |
| 3 | **Catecismo (índice)** | `/catechism` | ✅ | Índice de partes renderiza corretamente. |
| 4 | **Catecismo (parágrafo direto)** | `/catechism?paragraph=N` | ⚠️ | Query-param ignorado — mostra o índice em vez do parágrafo. **Não navega para leitura.** Precisa investigação do handler de query. |
| 5 | **Magistério (índice)** | `/magisterium` | ✅ | Lista 35 documentos, filtros por categoria renderizam. |
| 6 | **Magistério (viewer por slug)** | `/magisterium/deus-caritas-est`, `/magisterium/laudato-si`, `/magisterium/evangelii-gaudium` | ❌ | Tela **"Ops! Documento não encontrado ou URL não configurada"**. Cards no índice **não expõem `<a href>` navegável** (`querySelectorAll("a[href^='/magisterium/']")` → 0). Bug real e visível. |
| 7 | Busca Global | `/buscar` | ✅ | — |
| 8 | Hoje | `/hoje` | ✅ | — |
| 9 | Lectio Divina | `/lectio` | ✅ | — |
| 10 | Jornadas | `/jornadas` | ✅ | — |
| 11 | Itinerária | `/itineraria` | ✅ | — |
| 12 | Santos | `/santos` | ⚠️ | Imagem do Wikimedia bloqueada (`ERR_BLOCKED_BY_ORB`). |
| 13 | Liturgia | `/liturgia` | ⚠️ | Mesma imagem bloqueada do Wikimedia. |
| 14 | Biblioteca | `/biblioteca` | ✅ | — |
| 15 | Oração | `/oracao` | ✅ | — |
| 16 | Rosário | `/rosary` | ✅ | — |
| 17 | Via Crucis | `/viacrucis` | ✅ | — |
| 18 | Glossário | `/glossary` | ✅ | — |
| 19 | Favoritos | `/favorites` | ✅ | — |
| 20 | Notas | `/notes` | ✅ | — |
| 21 | Perfil | `/profile` | ✅ | Redireciona para auth (esperado sem sessão). |
| 22 | Auth | `/auth` | ✅ | — |
| 23 | Logos | `/logos` | ✅ | — |
| 24 | Aquinas | `/aquinas` | ✅ | — |
| 25 | Temas | `/temas` | ✅ | — |
| 26 | Enciclopédia | `/encyclopedia` | ✅ | — |
| 27 | Papas | `/papas` | ⚠️ | 10 imagens Wikimedia bloqueadas (`ERR_BLOCKED_BY_ORB`) — grade fica sem retratos. |
| 28 | Aparições | `/aparicoes` | ⚠️ | React DOM warning: **`<button>` aninhado dentro de `<button>`** em `AparicoesPage`. HTML inválido, risco a11y. |
| 29 | Dogmas | `/dogmas` | ✅ | — |
| 30 | Missal | `/missal` | ✅ | — |
| 31 | Breviário | `/breviary` | ✅ | — |
| 32 | Confessionário | `/confession` | ✅ | — |
| 33 | Conquistas | `/achievements` | ✅ | — |
| 34 | Configurações | `/settings` | ✅ | — |
| 35 | Sobre | `/about` | ✅ | — |
| 36 | Transparência | `/transparencia` | ✅ | — |
| 37 | Design System | `/design-system` | ✅ | — |
| 38 | Admin | `/admin` | ✅ | — |
| 39 | Telemetria | `/telemetry` | ⚠️ | React error: **"Encountered two children with the same key `/admin`"** em `AppHeader` (nav). |
| 40 | Magistério viewer (com detalhes) | `/magisterium/*` | ❌ | React error: **duplicate key `/magisterium`** em `AppHeader` + fallback de "documento não encontrado". |

## Consolidação por prioridade

### P0 — Bloqueadores funcionais visíveis ao usuário
1. **Magistério · viewer por slug quebrado** (`/magisterium/:id`)
   - Sintoma: qualquer slug retorna "Documento não encontrado ou URL não configurada".
   - Causa provável: (a) resolver de slug → id não bate com dados existentes, ou (b) edge `vatican-document` / `vatican_cache` sem entradas, ou (c) cards do índice não emitem links navegáveis (auditoria confirmou `href` ausente).
   - Impacto: **usuário não consegue abrir nenhum documento do Magistério.**

2. **Catecismo · abertura direta de parágrafo via `?paragraph=`**
   - Sintoma: URL `/catechism?paragraph=100` mostra o índice, não o parágrafo.
   - Causa provável: handler de query param removido/quebrado no `Catechism.tsx` ou o roteamento espera outra chave (`?p=`, `/catechism/100`, etc.).
   - Impacto: **deep-link para parágrafo não funciona** (afeta busca, favoritos, Nexus, compartilhamento).

### P1 — Regressões de UI/console
3. **`/aparicoes`** — `<button>` dentro de `<button>` (HTML inválido, a11y).
4. **`/telemetry` e `/magisterium/*`** — chave duplicada `/admin` / `/magisterium` em `AppHeader` (renderização de nav duplicada).

### P2 — Degradação de conteúdo externo
5. **Imagens do Wikimedia** bloqueadas por `ERR_BLOCKED_BY_ORB` em `/santos`, `/liturgia`, `/papas`.
   - Origem: política `Cross-Origin-Resource-Policy` do Wikimedia. Solução: proxy próprio, hospedar cópia em Storage ou usar CDN alternativa.

### ✅ Módulos sem regressão detectada no smoke
Bíblia, Home, Busca, Hoje, Lectio, Jornadas, Itinerária, Biblioteca, Oração, Rosário, Via Crucis, Glossário, Favoritos, Notas, Auth, Logos, Aquinas, Temas, Enciclopédia, Dogmas, Missal, Breviário, Confessionário, Conquistas, Configurações, Sobre, Transparência, Design System, Admin.

> **Nota:** smoke sem sessão. Rotas atrás de `AuthGuard` (Perfil, Diário, Jornadas step, etc.) precisam segundo passe autenticado em STAB-001b se o usuário quiser cobertura completa.

## Reprodução

Script: `/tmp/browser/stab001/audit.py` (audit smoke) + `/tmp/browser/stab001/deep.py` (probes CIC/Mag).  
Artefatos: `/tmp/browser/stab001/results.json`, `/tmp/browser/stab001/deep.json`, `/tmp/browser/stab001/shots/*.png`.

## Próximos passos propostos (para aprovação do usuário)

- **STAB-002 · Correção P0** — corrigir Magistério viewer e Catecismo `?paragraph`. Meta: qualquer usuário consegue abrir qualquer documento e qualquer parágrafo por link direto.
- **STAB-003 · Cobertura autenticada + P1** — segundo passe logado, corrigir warnings de nav/DOM.
- **STAB-004 · Performance** — só após STAB-002/003 verdes.
- **STAB-005 · Arquitetura** — só após STAB-004.

Nada além disso deve ser executado sem novo `STAB-*` aprovado.
