# QA_BACKLOG.md — Sprint QA 1

Backlog derivado de `docs/qa/QA_REPORT.md`. Ordem de execução recomendada: de cima para baixo.

## P0 — Bloqueiam a percepção de produto utilizável

| # | Item | Rotas | Onde | Esforço |
|---|---|---|---|---|
| P0-1 | Remover `<main>` duplicado: um único landmark no shell, páginas passam a `<section>` | 19 rotas | `src/App.tsx` + páginas com `<main>` próprio | M |
| P0-2 | Corrigir 409 em `prayer_sessions` (upsert com `onConflict` correto) | `/missal`, `/breviary` | hook de sessão do Prayer Engine | P |
| P0-3 | Alvos de toque ≥ 44px em mobile: `Button size="icon"` e chips clicáveis via Design System | todas | `src/components/ui/button.tsx` + chips de listagem | M |

## P1 — Padronização e acabamento

| # | Item | Rotas | Onde | Esforço |
|---|---|---|---|---|
| P1-1 | Encerrar skeletons presos e prever estado vazio explícito | `/temas`, `/hoje`, `/liturgia` | páginas correspondentes | P |
| P1-2 | H1 único por página (hero como fonte); remover duplicidade | `/aparicoes`, `/dogmas`, `/conta/perfil`, `/profile` | páginas + `EditorialHero` | P |
| P1-3 | Adicionar H1 ausente | `/diario`, `/conta/diario`, `/logos` | páginas correspondentes | P |
| P1-4 | Migrar módulos sem `EditorialHero` para o primitivo oficial | 14 rotas (Bíblia, Catecismo, Biblioteca, Temas, Itinerária, Liturgia, Missal, Breviário, Orações, Jornadas, Busca, Calendário, Aquinas, Conta) | páginas + `EditorialHero` | G |
| P1-5 | Breadcrumb padrão nas rotas de segundo nível (hoje ausente em 100% das telas) | todas de 2º nível | shell de layout | M |

## P2 — Higiene técnica

| # | Item | Rotas | Onde | Esforço |
|---|---|---|---|---|
| P2-1 | Eliminar warning `forwardRef` (ref em function component) | global | `MaintenanceGate`, `AppProviders` em `src/App.tsx` | P |
| P2-2 | Integrar `scripts/qa/qa-global-audit.py` ao CI como gate não-bloqueante com diff de achados | — | `.github/workflows/` | M |

## P3 — Ampliação da cobertura (Sprint QA 2)

| # | Item | Escopo |
|---|---|---|
| P3-1 | Auditar rotas de detalhe dinâmicas (`/santos/:id`, `/glossario/:slug`, readers de obras, `/jornadas/:id/step`) |
| P3-2 | Roteiros de interação: modais, filtros, busca, favoritos, histórico, popovers do Nexus |
| P3-3 | Ampliar viewports para 320 / 390 / 412 / 1024 |
| P3-4 | Auditoria de dark mode e contraste consolidada com os workflows axe existentes |
