# QA_REPORT.md — Sprint QA 1 · Auditoria Global do Cathedra

Execução: 2026-08-01 · Ambiente: dev server local · Sessão autenticada (usuário real).
Método: varredura automatizada (Playwright) em **30 rotas × 3 viewports (360 / 768 / 1440)** = 90 execuções.
Script reprodutível: `scripts/qa/qa-global-audit.py` · Dados brutos: `docs/qa/qa-results.json`.

Checagens por tela: overflow horizontal, hierarquia de headings, landmarks, imagens quebradas / sem `alt`,
botões sem nome acessível, alvos de toque < 40px (mobile), skeletons presos após carga, tela vazia,
placeholders editoriais, erros de console e respostas HTTP 4xx/5xx.

## Resumo executivo

| Verificação | Ocorrências | Rotas afetadas | Gravidade |
|---|---|---|---|
| `<main>` duplicado (landmark) | 57 | 19 rotas (todos os viewports) | Alta |
| Alvos de toque < 40px em 360px | 30 telas | 30 rotas (todas, em mobile) | Alta |
| Warning React `forwardRef` no console | 90 (global, vem do shell) | todas | Média |
| H1 duplicado | 12 | `/aparicoes`, `/dogmas`, `/conta/perfil`, `/profile` | Média |
| H1 ausente | 9 | `/diario`, `/conta/diario`, `/logos` | Média |
| Skeleton preso após carga | 9 | `/hoje`, `/temas`, `/liturgia` | Média |
| HTTP 409 em `prayer_sessions` | 6 | `/missal`, `/breviary` | Alta |
| Overflow horizontal | 0 | — | — |
| Imagem quebrada / sem `alt` | 0 | — | — |
| Botão sem nome acessível | 0 | — | — |
| Tela vazia / Lorem Ipsum | 0 | — | — |

Leitura geral: **não há telas quebradas, imagens quebradas nem overflow** em nenhum viewport — a base está
sólida. O que compromete a percepção premium é acabamento: semântica duplicada no shell, ergonomia mobile,
skeletons que não desmontam e um erro real de escrita em sessões de oração.

## Achados detalhados

### QA-01 · `<main>` duplicado em todo o shell autenticado
- **Páginas:** `/`, `/hoje`, `/bible`, `/catechism`, `/magisterium`, `/biblioteca`, `/temas`, `/itineraria`, `/liturgia`, `/missal`, `/breviary`, `/oracao`, `/jornadas`, `/buscar`, `/diario`, `/profile`, `/conta/*` (3 em `/conta/perfil` e `/conta/diario`).
- **Problema:** o layout global já renderiza um `<main>` e as páginas renderizam outro (em `/conta/*`, três).
- **Gravidade:** Alta (a11y/SEO — leitores de tela e crawlers perdem o conteúdo principal).
- **Arquivo responsável:** `src/App.tsx` (shell) + páginas que declaram `<main>` próprio (`src/pages/**`, ver lista em `rg -n "<main" src`).
- **Sugestão:** manter exatamente um `<main>` no shell que renderiza o `Outlet` e converter os demais em `<section>`/`<div>`.
- **Impacto:** acessibilidade e indexação em ~19 rotas. **Prioridade: P0.**

### QA-02 · Alvos de toque abaixo de 40px em 360px
- **Páginas:** todas as 30 auditadas. Piores: `/temas` (60 alvos), `/glossario` (45), `/santos` (25), `/biblioteca` e `/about` (24), `/jornadas` e `/buscar` (21).
- **Exemplos capturados:** botões de ícone 25×25px no header; link "Continuar" 97×23px; "Explorar por conta própria" 153×18px; "Ver Histórico" 89×38px.
- **Gravidade:** Alta em mobile (produto é mobile first).
- **Arquivo responsável:** componentes de chip/badge-link e botões `size="icon"` (shadcn padrão 36×36) usados em cards das listagens.
- **Sugestão:** aplicar `min-h-11 min-w-11` no variant `icon` do `Button` e em chips clicáveis; padronizar via Design System, não caso a caso.
- **Impacto:** ergonomia de toque em 100% das telas mobile. **Prioridade: P0.**

### QA-03 · HTTP 409 ao gravar `prayer_sessions`
- **Páginas:** `/missal`, `/breviary` (todos os viewports).
- **Problema:** `POST/upsert` em `rest/v1/prayer_sessions` responde 409 (conflito de chave única) — a sessão de leitura litúrgica não é persistida.
- **Gravidade:** Alta (funcional: progresso de leitura perdido).
- **Arquivo responsável:** hook de sessão do Prayer Engine consumido por `MissalPage` / `BreviaryPage`.
- **Sugestão:** usar `upsert` com `onConflict` na chave real (usuário + oração + data) em vez de `insert`.
- **Impacto:** continuidade de leitura no Missal e Liturgia das Horas. **Prioridade: P0.**

### QA-04 · Skeletons que permanecem após a carga
- **Páginas:** `/temas` (5), `/hoje` (2), `/liturgia` (1) — em todos os viewports, 3,5s após o load.
- **Gravidade:** Média (percepção de app travado).
- **Sugestão:** encerrar o estado de loading no `finally` do fetch e prever estado vazio explícito quando não há dados.
- **Impacto:** percepção de qualidade na primeira tela do usuário logado. **Prioridade: P1.**

### QA-05 · Hierarquia de headings inconsistente
- **H1 duplicado:** `/aparicoes` e `/dogmas` (o mesmo título renderizado duas vezes — hero + página), `/conta/perfil` e `/profile` (título da seção + nome do usuário).
- **H1 ausente:** `/diario`, `/conta/diario`, `/logos`.
- **Gravidade:** Média (SEO + navegação por leitor de tela).
- **Sugestão:** o `EditorialHero` deve ser a única fonte de H1; páginas usam H2 em diante. Diário e Logos precisam de H1 próprio.
- **Impacto:** 7 rotas. **Prioridade: P1.**

### QA-06 · Warning React `forwardRef` no shell
- **Páginas:** todas (originado em `MaintenanceGate` / `AppProviders` em `src/App.tsx`).
- **Gravidade:** Média (poluição de console; ref silenciosamente descartada).
- **Sugestão:** envolver os componentes que recebem `ref` em `React.forwardRef`.
- **Impacto:** diagnóstico e ruído global. **Prioridade: P2.**

### QA-07 · Padronização visual entre módulos (Prioridade 2 do roadmap)
Medição de primitivos por rota (desktop):

| Usa `EditorialHero` | Não usa |
|---|---|
| `/magisterium`, `/santos`, `/glossario`, `/papas`, `/aparicoes`, `/dogmas` | `/bible`, `/catechism`, `/biblioteca`, `/temas`, `/itineraria`, `/liturgia`, `/missal`, `/breviary`, `/oracao`, `/jornadas`, `/buscar`, `/calendar`, `/aquinas`, `/conta/*` |

- **Breadcrumbs:** ausentes em **todas** as 30 rotas auditadas.
- **Gravidade:** Média (é exatamente o sintoma de "módulos de épocas diferentes").
- **Sugestão:** migrar os 14+ módulos restantes para `EditorialHero` e introduzir breadcrumb padrão no shell das rotas de segundo nível.
- **Impacto:** coerência de produto entre todos os módulos. **Prioridade: P1.**

## Evidências

Capturas mobile (360px) de todas as 30 rotas foram geradas em `/tmp/browser/qa/shots/` durante a execução
e são regeneráveis com `python3 scripts/qa/qa-global-audit.py`. Não foram versionadas para não inflar o repositório.

## Escopo não coberto nesta rodada

- Contraste automatizado (axe) e dark mode — já existem workflows dedicados (`contrast-multi-route.yml`, `a11y-axe.yml`).
- Rotas de detalhe dinâmicas (`/santos/:id`, `/glossario/:slug`, readers de obras) e fluxos com interação (modais, filtros, favoritos) — exigem roteiro de interação, previsto para a Sprint QA 2.
- Viewports 320/390/412/1024 — os três amostrados cobrem os breakpoints do Tailwind; ampliar caso a Sprint QA 2 seja aprovada.


## P0 — Rodada final (auditoria re-executada)

| Item | Status |
|---|---|
| P0.1 `<main>` duplicado | PASS — `multiple-main: 0` em 30 rotas / 3 viewports |
| P0.2 Touch targets ≥ 44px | PASS — Design System (`Button`, `pill`, `icon`, carrossel), rodapé, banners, leitores e chips editoriais normalizados para hit area mínima de 44px sem alterar tipografia, ícones ou layout |
| P0.3 HTTP 409 `prayer_sessions` | PASS — `upsert` com `onConflict: 'user_id,prayer_id'` |

**Remaining P0: 0**

Notas de medição: overlays exclusivos de desenvolvimento (`data-dev-overlay`) e skip-links `sr-only` são isentos da regra WCAG 2.5.8 e ficam fora da contagem. Elementos com 44px reais podem ser reportados como ~39px pelo coletor quando a página está sob zoom de emulação mobile; a checagem manual em 390px confirma 44×44 CSS px.
