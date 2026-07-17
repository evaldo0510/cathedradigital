# Plano: Nexus 100% interno + QA visual do tema Noir & Gold

Escopo dividido em 3 blocos independentes. Peço confirmação de **quais blocos executar** (posso rodar todos em sequência ou só o que priorizar).

---

## Bloco 1 — Nexus sempre interno (código + guarda)

**Objetivo:** garantir que qualquer clique em referência do Nexus/Catecismo abra em rota interna `/catechism?paragraph=N` (ou rota Cathedra equivalente), nunca em URL externa.

1. **Handler único de navegação interna**
   - Criar `src/lib/nexusNavigation.ts` exportando:
     - `catechismInternalPath(paragraph: number): string` → valida faixa (1–2865), retorna `/catechism?paragraph=N` ou `/catechism` se inválido.
     - `openNexusRef(navigate, ref)` — decide destino conforme tipo (`catechism`, `bible`, `tag`, `saint`) usando rotas de `AppRoute`.
   - Refatorar `CatechismPopover.tsx`, `NexusBubbles.tsx`, `CrossReferencePanel.tsx` para usar esse handler (elimina `navigate(...)` espalhado).

2. **Validação do query `?paragraph=`**
   - Em `Catechism.tsx`, envolver `getParagraphParam` com `Number.isFinite`, faixa 1–2865. Inválido → limpar query e cair em `viewMode='parts'` com toast informativo (fallback seguro, sem crash).

3. **Regra anti-URL-externa no Nexus**
   - Adicionar teste de lint custom simples: script `scripts/check-nexus-internal.mjs` que faz `rg 'href="http|window\.open|target="_blank"'` em `NexusBubbles.tsx`, `CatechismPopover.tsx`, `CrossReferencePanel.tsx` e falha se encontrar. Rodar no `prebuild` (opcional) ou só como test.

## Bloco 2 — Testes automatizados

1. **Vitest (unit)** — `src/components/cathedra/CatechismPopover.test.tsx`:
   - Fallback quando `content` vazio → link com `to="/catechism?paragraph=123"`.
   - Botão "Abrir completo" chama `onNavigate(paragraph)`.
   - Nenhum `<a target="_blank">` renderizado.
2. **Vitest (unit)** — `src/lib/nexusNavigation.test.ts`:
   - `catechismInternalPath(0|-1|NaN|3000)` → `/catechism` fallback.
   - `catechismInternalPath(123)` → `/catechism?paragraph=123`.
3. **Playwright (via shell)** — desktop 1280×1800 e mobile 390×844:
   - Abrir `/catechism`, entrar em modo leitura, clicar bolha do Nexus → esperar `page.url()` começar com `http://localhost:8080/` (mesmo origin) e conter parâmetro esperado.
   - Verificar ausência de novas abas: `context.on('page', ...)` deve permanecer em zero.

## Bloco 3 — Regressão visual do tema (BottomNav, Footer, Sidebar)

1. **Snapshots Playwright** em `/tmp/browser/theme-snapshots/`:
   - Rotas logadas: `/`, `/catechism`, `/buscar`.
   - Capturas isoladas via `locator.screenshot`: `[data-testid="bottom-nav"]`, `<footer>`, sidebar aberta.
   - Comparação pixel-a-pixel com baseline (armazenar em `tests/visual/baseline/`).
   - Tolerância: pixelmatch com `threshold 0.1`. Diff sobe artefato para inspeção.
2. **Checagem manual guiada** (executo eu via Playwright):
   - Verificar que Footer não sobrepõe BottomNav em mobile (padding-bottom no `<main>`).
   - Verificar que o botão "voltar ao topo" fica acima do BottomNav (z-index e offset) em mobile.
   - Sidebar aberta em desktop não empurra conteúdo além do viewport.

---

## Detalhes técnicos

- Handler central evita divergência: hoje `NexusBubbles` já usa `navigate(AppRoute.TEMAS/...)`, mas `CatechismPopover` acabou de sair do `vatican.va` — centralizar previne recaída.
- Testes Playwright rodam no sandbox contra `localhost:8080` (dev server já ativo).
- Snapshot visual é ruído se rodar em CI sem fontes fixas; começo salvando baselines locais e documento como regenerar (`UPDATE_SNAPSHOTS=1`).

---

## Confirmar antes de executar

- **Executar tudo (Bloco 1+2+3)?** ou só um? Bloco 3 (regressão visual) é o mais custoso e frágil — recomendo pular se você não pretende integrar em CI ainda.
- Se pular Bloco 3, entrego Blocos 1+2 numa tacada só.
