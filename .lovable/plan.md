## Contexto

Auditoria confirmou 2 bloqueios reais:

1. **P0 funcional — Nexus/RouteRegistry desalinhado.** `src/core/navigation/RouteRegistry.ts` mapeia 6 templates `/estudar/*` que não existem no `App.tsx`. Todo clique no Nexus que resolve para `study.*` cai em 404.
2. **Gaps de CI.** Não há gate axe nem execução automática das suítes `nexus-popover-*` no mobile.

Escopo abaixo cobre P0 + os 4 pedidos operacionais. Nenhuma refatoração além do necessário.

---

## 1. P0 — Realinhar RouteRegistry às rotas reais

**Arquivo:** `src/core/navigation/RouteRegistry.ts` (+ `types.ts` se necessário).

Mapeamento comprovado contra `src/App.tsx`:

| Chave lógica | Antes (quebrado) | Depois (rota real) |
|---|---|---|
| `study.bible` | `/estudar/biblia/:book/:chapter` | `/bible?book=:book&chapter=:chapter` |
| `study.catechism` | `/estudar/catecismo/:paragraph` | `/catechism?p=:paragraph` |
| `study.magisterium` | `/estudar/magisterio/:doc` | `/magisterium/:doc` |
| `study.saint` | `/estudar/santos/:slug` | `/santos/:slug` |
| `study.father` | `/estudar/padres/:slug` | **a confirmar** (rota real não encontrada) |
| `study.composed` | `/estudar/tema/:slug` | `/temas/:slug` (a confirmar) |

**Ações:**
- Investigar as 2 rotas "a confirmar" antes de alterar (padres/temas). Se não existirem, gerar TODO e apontar destino provisório para `/biblioteca` (sem 404) marcando `resolveLink` como parcial.
- Suportar query-string no `RouteRegistry.resolve()` (hoje só substitui `:param` no path).
- Atualizar `src/core/knowledge/seed.ts` só se os slugs precisarem casar com IDs reais do banco (verificar `/magisterium/:id` — usa `id` numérico ou `slug`).

**Validação:**
- Rodar suíte `KnowledgeGraph.test.ts` já existente.
- Adicionar teste unitário `RouteRegistry.test.ts` que percorre todas as chaves e verifica que o template resultante começa por uma rota registrada no App.tsx (parse simples do arquivo).

## 2. Gate de acessibilidade no CI (axe WCAG AA — mobile)

**Novo:** `tests/e2e/a11y-mobile.spec.ts` (Playwright + `@axe-core/playwright`).

- Viewport iPhone 12 (390×844).
- Percorrer lista fixa de rotas: `/`, `/bible`, `/catechism`, `/buscar`, `/biblioteca`, `/formacao`, `/santos`, `/rosary`, `/viacrucis`, `/missal`, `/breviary`, `/litanies`, `/oracao`, `/community`, `/profile/favorites`.
- Rodar axe filtrando `wcag2a, wcag2aa, wcag21aa`. Falhar o job em qualquer violação `serious` ou `critical`.
- Anexar `a11y-report.json` como artifact.
- Instalar `@axe-core/playwright` em devDeps (aviso: nova dep — confirmar antes de instalar).

**Ajuste CI:** adicionar step no workflow existente (ou criar `.github/workflows/a11y.yml` se ainda não houver).

## 3. Execução automática das suítes Nexus no mobile no CI

**Arquivos existentes:** `tests/e2e/nexus-popover-*.spec.ts`.

- Criar projeto Playwright `nexus-mobile` em `playwright.config.ts` com `devices['Pixel 5']` e filtro `testMatch: /nexus-popover-.*\.spec\.ts/`.
- Adicionar job dedicado no workflow (`nexus-mobile-e2e`) rodando `npx playwright test --project=nexus-mobile --reporter=html,json`.
- Publicar `playwright-report/` como artifact + comentar sumário no PR via `dorny/test-reporter` (ou similar já em uso, verificar).

## 4. Rodar as suítes `nexus-popover-*` em Pixel 5 agora e trazer relatório

Após ajuste do config acima, rodar localmente uma vez para gerar baseline. Relatório entregue no chat:
- Cenários de **foco** (trap, restore ao fechar, `Escape`).
- Cenários de **scroll** do body (não trava com popover aberto).
- Cenários de **deep-linking** (`?nexus=...` abre popover ancorado ao anchor certo).
- Lista de falhas com screenshot + selector.

## 5. Auditoria axe manual em todas rotas mobile (evidências)

Antes do gate entrar no CI, rodar `a11y-mobile.spec.ts` localmente e entregar apenas as violações **serious/critical** WCAG AA com:
- Rota, seletor, `help`, `helpUrl`, snippet do HTML.
- Screenshot do elemento infrator.
- Sem propor correção para itens `moderate`/`minor` neste ciclo.

---

## Ordem de execução proposta

1. Investigar rotas `padres`/`temas` (P0) — 1 leitura de arquivos.
2. Aplicar correção do RouteRegistry + suportar query-string.
3. Adicionar teste unitário do RouteRegistry.
4. Escrever `a11y-mobile.spec.ts` + rodar baseline → entregar relatório de violações.
5. Escrever config do projeto `nexus-mobile` + rodar suíte → entregar relatório dos cenários.
6. Integrar ambos como jobs bloqueantes no workflow.

## Perguntas antes de executar

1. **Dependência nova:** posso instalar `@axe-core/playwright` (~mit, ~ok)?
2. **Rotas ausentes** (`study.father`, `study.composed`): mapear para `/biblioteca` provisoriamente ou pausar até você definir a rota canônica?
3. **Severidade do gate axe:** falhar em `serious+critical` (recomendação) ou também em `moderate`?

Responda 1/2/3 e sigo na ordem acima.
