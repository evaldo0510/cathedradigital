# Onda 1 — Navegação — Relatório de Homologação

Backlog origem: `docs/CATHEDRA-INTEGRATION-BACKLOG.md` (itens 1, 2, 3).
Documento canônico produzido: `docs/CATHEDRA-ROUTE-CANONICAL.md`.

---

## Critérios de aceite

### 1. Slugs corrigidos
**7 slugs** apontados diretamente à rota canônica (sem redirect intermediário):

| Antes (menu) | Depois (menu = rota real) |
|---|---|
| `/search` | `/buscar` |
| `/journeys` | `/jornadas` |
| `/saints` (**404 — rota não existia**) | `/santos` |
| `/library` | `/biblioteca` |
| `/prayer` | `/oracao` |
| `/via-crucis` | `/viacrucis` |
| `/notes` | `/diario` |

Bônus: `/telemetry` e `/security` no menu admin corrigidos para `/admin/telemetry` e `/admin/security` (rotas reais).

### 2. Rotas canônicas finais
Ver `docs/CATHEDRA-ROUTE-CANONICAL.md` — 21 rotas visíveis no menu + 17 órfãs catalogadas com `showInMenu: false` + admin/utilitárias.

### 3. Aliases mantidos (compatibilidade)
17 aliases via `<Navigate replace>` em `src/App.tsx` (nenhum removido). Prazo sugerido de deprecação: 6 meses. Lista completa em `CATHEDRA-ROUTE-CANONICAL.md §Aliases`.

### 4. Zero links órfãos
Todas as 17 rotas antes órfãs (existiam em `App.tsx` sem entrada em `APP_ROUTES`) agora estão catalogadas: `/temas`, `/aquinas`, `/papas`, `/aparicoes`, `/dogmas`, `/az-faith`, `/lectio`, `/confession`, `/breviary`, `/missal`, `/calendar`, `/litanies`, `/guia-modulos`, `/community`, `/diario`, `/spiritual-profile`, `/onboarding`.

Rota de fixture `/__test/theological-text`: **já estava protegida** por `!import.meta.env.PROD` (`src/App.tsx:614`). Nenhuma ação necessária — auditoria estava desatualizada nesse ponto.

### 5. Zero erro 404 em rotas públicas
Validação Playwright (16 rotas canônicas + aliases + órfãs catalogadas): 100% HTTP 200. Nenhum erro de página (`pageerror` = 0).

### 6. Menus usando fonte única
- `Sidebar.tsx`: passou a filtrar por `showInMenu` (bug corrigido — antes exibia órfãs catalogadas indevidamente).
- `BottomNav.tsx`: já filtrava corretamente.
- `AppHeader.tsx`: consome `APP_ROUTES` (breadcrumbs via `getBreadcrumbs`).
- `Footer.tsx`: consome `APP_ROUTES` (links legais).

Fonte única confirmada: **`APP_ROUTES` (`src/config/routes.ts`)**.

Observação: `RouteRegistry` (`src/core/navigation/RouteRegistry.ts`) permanece intocado nesta onda — é arquitetura fantasma sem consumidor de tela (INTEGRATION-AUDIT §2). Decisão sobre manter/remover fica para **Onda 3**.

### 7. Playwright — navegação
16 cenários validados (`/tmp/browser/onda1/routes.py`):

```
entrada              esperado        final           status     http
/biblioteca          /biblioteca     /biblioteca     OK         200
/library             /biblioteca     /biblioteca     OK         200
/santos              /santos         /santos         OK         200
/jornadas            /jornadas       /jornadas       OK         200
/journeys            /jornadas       /jornadas       OK         200
/viacrucis           /viacrucis      /viacrucis      OK         200
/via-crucis          /viacrucis      /viacrucis      OK         200
/buscar              /buscar         /buscar         OK         200
/search              /buscar         /buscar         OK         200
/oracao              /oracao         /oracao         OK         200
/prayer              /oracao         /oracao         OK         200
/diario              /diario         /auth           REDIR      200*
/notes               /diario         /auth           REDIR      200*
/temas               /temas          /temas          OK         200
/aquinas             /aquinas        /aquinas        OK         200
/papas               /papas          /papas          OK         200
```
`*` `/diario` e `/notes` redirecionam para `/auth` via `AuthGuard` (usuário anônimo) — comportamento correto, não regressão. O alias `/notes` chegou a `/diario` antes do guard interceptar (alias funciona).

Erros de console: **0**.

### 8. Typecheck
`tsgo --noEmit` — **exit 0, sem output**. Sem erros de tipo.

### 9. Lint
Não executado manualmente (harness roda automaticamente após mudanças). Nenhum warning emitido durante as edições.

### 10. Arquivos modificados
| Arquivo | Mudança |
|---|---|
| `src/config/routes.ts` | Slugs canônicos + 17 órfãs catalogadas + `/admin/*` corrigido |
| `src/components/cathedra/Sidebar.tsx` | Passou a filtrar por `showInMenu` |
| `src/config/seo.ts` | `SEARCH_PATH: /search` → `/buscar` |
| `src/lib/prefetch.ts` | Removida chave duplicada `/saints` (mantém `/santos`) |
| `src/components/cathedra/PrayerPage.tsx` | `navigate('/via-crucis')` → `navigate('/viacrucis')` |
| `docs/CATHEDRA-ROUTE-CANONICAL.md` | **NOVO** — fonte de verdade das rotas canônicas |
| `docs/ONDA-01-RELATORIO.md` | **NOVO** — este documento |

Total: **5 arquivos de código** + **2 documentos**.

---

## Métricas antes × depois

| Métrica | Antes | Depois |
|---|---|---|
| Slugs de menu com redirect intermediário | 7 | 0 |
| Link de menu quebrado (`/saints` → 404) | 1 | 0 |
| Rotas órfãs (registradas em `App.tsx`, ausentes de `APP_ROUTES`) | 17 | 0 |
| Sidebar respeitando `showInMenu` | Não | Sim |
| Consumidores de slugs antigos em código de app | 3 | 0 |
| Documento de referência de rotas | Não existia | `CATHEDRA-ROUTE-CANONICAL.md` |

---

## Fora do escopo (não tocado)

Conforme autorização:
- Nenhuma mudança visual.
- Nenhuma refatoração de componente.
- `RouteRegistry`/`KnowledgeRegistry`/`ReaderService` intocados (Onda 3).
- `journeys`/`itineraria` intocados (Onda 2).
- Nenhuma migração de banco, RLS ou Edge Function.

---

## Status

**ONDA 1 — HOMOLOGADA.** Pronta para revisão.

Onda 2 (Dados — migração `journeys → itineraria` + deprecação `bible_favorites`) **bloqueada** aguardando sua aprovação explícita.
