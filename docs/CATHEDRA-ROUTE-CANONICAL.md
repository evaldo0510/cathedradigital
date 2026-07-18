# Rotas Canônicas — Cathedra 2.0

Documento operacional resultado da **Onda 1 — Navegação** (ver `docs/CATHEDRA-INTEGRATION-BACKLOG.md`). Fonte da verdade para menus, breadcrumbs, deep links, SEO e prefetch.

Regra: **toda navegação nova deve usar a rota canônica**. Aliases existem apenas para compatibilidade com links externos antigos e podem ser removidos após 6 meses de deprecação.

---

## Rotas canônicas (fonte única)

Definidas em `src/config/routes.ts` (`APP_ROUTES`). Todas apontam **diretamente** para a rota real registrada em `src/App.tsx`, sem hop de redirect.

### Core
| Slug canônico | Label | showInMenu |
|---|---|---|
| `/` | Início | ✓ |
| `/bible` | Bíblia | ✓ |
| `/catechism` | Catecismo | ✓ |
| `/magisterium` | Magistério | ✓ |
| `/buscar` | Busca Global | ✓ |

### Peregrinação
| Slug canônico | Label | showInMenu |
|---|---|---|
| `/hoje` | Hoje | ✓ |
| `/jornadas` | Jornadas | ✓ |
| `/itineraria` | Itinerários | ✓ |
| `/santos` | Santos do Dia | ✓ |
| `/liturgia` | Liturgia | ✓ |

### Conteúdo
| Slug canônico | Label | showInMenu |
|---|---|---|
| `/biblioteca` | Biblioteca | ✓ |
| `/oracao` | Orações | ✓ |
| `/rosary` | Rosário | ✓ |
| `/viacrucis` | Via Sacra | ✓ |
| `/bible-recovery` | Recovery Bíblia | ✓ |
| `/glossary` | Glossário | ✓ |

### Órfãs catalogadas (rota real existe, `showInMenu: false`)
Antes da Onda 1: rotas registradas em `App.tsx` sem entrada em `APP_ROUTES` (inacessíveis pelo menu, sem metadados).
Depois: catalogadas com identidade/label, promovidas ao menu quando produto decidir.

| Slug canônico | Label | Categoria |
|---|---|---|
| `/temas` | Temas | content |
| `/aquinas` | Aquinas | content |
| `/papas` | Papas | content |
| `/aparicoes` | Aparições | content |
| `/dogmas` | Dogmas | content |
| `/az-faith` | A–Z da Fé | content |
| `/lectio` | Lectio Divina | content |
| `/confession` | Confissão | content |
| `/breviary` | Breviário | content |
| `/missal` | Missal | content |
| `/calendar` | Calendário Litúrgico | content |
| `/litanies` | Ladainhas | content |
| `/guia-modulos` | Guia de Módulos | content |
| `/community` | Comunidade | user |
| `/diario` | Diário Espiritual | user (visível) |
| `/spiritual-profile` | Perfil Espiritual | user |
| `/onboarding` | Boas-vindas | user |

### Usuário
`/profile`, `/favorites`, `/achievements`, `/settings` (visíveis) + `/about`, `/partners`, `/privacy`, `/terms`, `/transparencia`, `/design-system` (ocultos).

### Admin
`/admin`, `/admin/audit`, `/admin/telemetry`, `/admin/security` (todos ocultos).

---

## Aliases (compatibilidade — links externos antigos)

Mantidos em `src/App.tsx` como `<Route path="X" element={<Navigate to="Y" replace />} />`. **Não usar em código novo.**

| Alias antigo | → Canônica |
|---|---|
| `/home` | `/` |
| `/biblia` | `/bible` |
| `/catecismo` | `/catechism` |
| `/magisterio` | `/magisterium` |
| `/search` | `/buscar` |
| `/library` | `/biblioteca` |
| `/prayer` | `/oracao` |
| `/prayers` | `/oracao` |
| `/via-crucis` | `/viacrucis` |
| `/journeys` | `/jornadas` |
| `/notes` | `/diario` |
| `/login` | `/auth` |
| `/dashboard` | `/hoje` |
| `/chat` | `/logos` |
| `/telemetry` | `/admin/telemetry` |
| `/security` | `/admin/security` |
| `/catechism-explorer` | `/catechism` |

Prazo de deprecação sugerido: **6 meses** a contar da Onda 1 (revisar antes de remover — verificar analytics).

---

## Rotas removidas / a decidir

- `/legacy-home` — rota interna sem consumidor; decisão de manter ou remover fica para próxima onda.
- `/encyclopedia` — duplicata funcional de `/az-faith` (mesma tela `AZFaithPage`). Sugerido deprecar `/encyclopedia` como alias na próxima onda.
- `/__test/theological-text` — **já protegida** por `!import.meta.env.PROD` (`src/App.tsx:614-616`). Nenhuma ação necessária.
- `/prototype-2.0/*` — fora do escopo desta onda (Onda 5).

---

## RouteRegistry (`src/core/navigation/RouteRegistry.ts`)

**Status**: arquitetura fantasma (INTEGRATION-AUDIT §2). Nenhum consumidor de tela.
Decisão sobre manter/remover fica para **Onda 3**. Nesta onda, `APP_ROUTES` é a única fonte de rotas canônicas para navegação real.

---

## Como usar

- **Navegar em código novo**: use o slug canônico direto (`navigate('/biblioteca')`, nunca `navigate('/library')`).
- **Adicionar rota nova**: registrar em `src/App.tsx` E adicionar entrada em `APP_ROUTES` com `showInMenu` explícito e `category` correta.
- **Adicionar link no menu**: mudar `showInMenu: true` na entrada correspondente. `Sidebar` e `BottomNav` filtram por essa flag automaticamente.
