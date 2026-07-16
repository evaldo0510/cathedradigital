# STAB-001R — Reexecução do Inventário Funcional

**Projeto:** CATHEDRA STABILIZATION
**Fase:** STAB-001R (revalidação pós STAB-002)
**Data:** 2026-07-16
**Método:** Mesmo script Playwright headless do STAB-001, ampliado com 4 probes específicos dos P0 fechados (`/catechism?paragraph=`, `/catechism?p=`, `/magisterium/dce`, `/magisterium/deus-caritas-est`, `/magisterium/nao-existe-xyz`). Artefatos: `/tmp/browser/stab001R/results.json`, `/tmp/browser/stab001R/shots/*.png`, `/tmp/browser/stab001R/audit.log`.

## Resultado consolidado

| | Antes (STAB-001) | Depois (STAB-001R) |
|---|:---:|:---:|
| **P0 CRITICAL** | **2** | **0** ✅ |
| P1 DEGRADED (regressões de UI/console) | 3 | 3 |
| P2 DEGRADED (imagens Wikimedia bloqueadas) | 3 | 3 |
| Rotas OK | 31 | 31 |
| `pageerror` disparados | 0 | 0 |
| Novas rotas com 500 / RLS | 0 | 0 |

**Nenhum `CRITICAL` remanescente. Os dois P0 do STAB-001 foram eliminados.**

## Verificação dos P0

| P0 | Probe | Resultado |
|---|---|:---:|
| Magistério · viewer por slug | `/magisterium/dce` (canônico curto) | ✅ resolve, sem "não encontrado" |
| Magistério · alias legível | `/magisterium/deus-caritas-est` | ✅ resolve via alias STAB-002A |
| Magistério · 404 amigável | `/magisterium/nao-existe-xyz` | ✅ mensagem "Documento não encontrado", **sem pageerror** |
| Magistério · navegação semântica | `a[href^='/magisterium/']` no índice | ✅ 30+ `<a href>` reais no DOM |
| Catecismo · deep-link canônico | `/catechism?p=100` | ✅ modo reading |
| Catecismo · alias STAB-002B | `/catechism?paragraph=100` | ✅ mesmo estado do canônico |

## Rotas DEGRADED remanescentes (todas conhecidas — backlog STAB-003)

| Rota | Origem | Prioridade | Já mapeado no STAB-001? |
|---|---|:---:|:---:|
| `/aparicoes` | `<button>` dentro de `<button>` | P1 | Sim |
| `/telemetry` | Chave duplicada `/admin` em `AppHeader` | P1 | Sim |
| `/magisterium/:id` (qualquer slug válido) | Chave duplicada `/magisterium` em `AppHeader` | P1 | Sim |
| `/santos`, `/liturgia`, `/papas` | Imagens Wikimedia bloqueadas por `ERR_BLOCKED_BY_ORB` | P2 | Sim |

## Novo achado (visível apenas com slug válido — não estava no STAB-001)

**⚠ P1-NOVO** — `/magisterium/:id` dispara requisições ao Supabase com `theme_id=eq.undefined`:

```
400 GET /rest/v1/theme_contents?select=*&theme_id=eq.undefined&limit=10
Error fetching Relatio connections:
  invalid input syntax for type uuid: "undefined" (22P02)
```

- **Origem provável:** `Relatio` (painel de conexões contextuais) recebendo `theme_id` indefinido no contexto do viewer.
- **Impacto:** funcional zero (a página abre e renderiza corretamente), mas polui logs e o painel de Relatio deve ficar vazio nesse contexto.
- **Não estava no STAB-001** porque a auditoria original só visitou slugs inválidos (que curto-circuitam antes desse componente). Descoberto agora porque o STAB-002A adicionou probes com slugs que resolvem de fato.
- **Ação:** entra no backlog **STAB-003** — fora do escopo desta revalidação.

## Mudança de fase

Com P0 = 0 confirmado, o projeto passa oficialmente de:

- **Modo Estabilização Crítica** → **Modo Estabilização Evolutiva**

Regra de operação em vigor: **nenhuma nova funcionalidade entra enquanto houver P0 aberto.**

## Roadmap atualizado

- STAB-001 ✅ Inventário
- STAB-002 ✅ Correções críticas (Magistério + Catecismo)
- STAB-001R ✅ Revalidação (P0 = 0)
- STAB-003 🔜 Rotas secundárias: `/aparicoes`, `AppHeader` (chave `/admin` e `/magisterium`), Wikimedia, `Relatio theme_id=undefined` no viewer
- STAB-004 Performance
- STAB-005 Arquitetura

## Reprodução

- Script: `/tmp/browser/stab001R/audit.py`
- Resultados: `/tmp/browser/stab001R/results.json`
- Log: `/tmp/browser/stab001R/audit.log`
- Screenshots: `/tmp/browser/stab001R/shots/*.png`
- Testes automatizados persistentes:
  - Unit: `src/lib/__tests__/queryParams.test.ts` (11 casos, 100% verde)
  - E2E: `tests/e2e/magisterium-links.spec.ts` (aliases, `<a href>`, Ctrl+Click, botão do meio, 404 sem crash)
