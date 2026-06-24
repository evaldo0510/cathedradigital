# QA completa do módulo da Bíblia

Objetivo: medir performance, validar acessibilidade das bolhas (popovers de cross-reference), rodar uma suíte E2E e consolidar tudo em um relatório PDF com evidências.

## 1. Performance — antes/depois

Script Playwright `tests/e2e/bible-performance.spec.ts` que:

- Abre a rota da Bíblia em **cold cache** (contexto novo, sem IDB/SW) e em **warm cache** (segundo load).
- Coleta via `page.evaluate`:
  - `performance.timing` → TTFB, DOMContentLoaded, Load.
  - `PerformanceObserver` → LCP, FCP, CLS.
  - `performance.getEntriesByType('resource')` → nº de requisições, bytes totais, requisições para `functions/v1/bible-text`.
- Mede tempo de render do primeiro capítulo (entre click no livro e o `[data-testid="bible-verse"]` ficar visível).
- Salva JSON em `/tmp/bible-perf/{cold,warm}.json` e gera um diff antes/depois (cold = "antes", warm = "depois").

## 2. Acessibilidade das bolhas

Audita popovers de versículo (cross-reference / Nexus). Script `tests/e2e/bible-bubbles-a11y.spec.ts`:

- Foca o gatilho via `Tab` e abre o popover com `Enter`/`Space`.
- Verifica: `role="dialog"` ou `aria-haspopup`, `aria-expanded`, `aria-controls`, foco entra no popover, `Esc` fecha e devolve foco ao gatilho.
- Roda `@axe-core/playwright` escopado ao popover aberto (`color-contrast`, `aria-*`, `button-name`).
- Verifica tamanho mínimo do tap target (44×44) nos gatilhos.
- Coleta cada falha com seletor + violação e screenshot do estado.

## 3. Suíte E2E do módulo

`tests/e2e/bible-module-suite.spec.ts` agrupando:

- Render do livro/capítulo padrão (Gn 1) com nº esperado de versículos.
- Navegação capítulo anterior/próximo (rota muda, conteúdo muda, sem regressão de cache).
- Busca por referência (`Jo 3:16`) → versículo correto em foco.
- Abertura de bolha em pelo menos um versículo com cross-ref e validação do conteúdo.
- Captura screenshot por etapa em `/tmp/bible-e2e/`.

Reutiliza o mock de `functions/v1/bible-text` quando offline para estabilidade.

## 4. Relatório PDF

Script Python `scripts/generate-bible-qa-report.py` que lê os JSONs/screenshots gerados nas etapas 1–3 e produz `/mnt/documents/bible-qa-report.pdf` com:

- Capa + sumário executivo (passed/failed por suíte).
- Seção 1: tabela de métricas antes/depois (cold vs warm) + delta %.
- Seção 2: tabela de findings de a11y (severidade, regra, seletor) + screenshots.
- Seção 3: validação de texto/versículos (contagem por livro amostrado) + status das bolhas.
- Anexo: logs brutos (resumo) e lista de evidências.

QA visual obrigatório do PDF (pdftoppm + inspeção página a página) antes de entregar.

## 5. Execução e entrega

Ordem de execução no sandbox:

```text
bunx playwright test tests/e2e/bible-performance.spec.ts
bunx playwright test tests/e2e/bible-bubbles-a11y.spec.ts
bunx playwright test tests/e2e/bible-module-suite.spec.ts
python3 scripts/generate-bible-qa-report.py
```

Entrega final:
- PDF em `/mnt/documents/bible-qa-report.pdf` (via `<presentation-artifact>`).
- Resumo no chat: pass/fail por suíte + 3 principais findings.

## Detalhes técnicos

- Reaproveita helpers existentes (`mockMonthEndpoint` padrão da suíte litcal) adaptados para `bible-text`.
- Usa `@axe-core/playwright` já presente em outras specs (`bottom-nav-a11y-axe.spec.ts`).
- Geração do PDF com `reportlab` (Platypus) — sem Unicode sub/superscript.
- Todas as evidências intermediárias ficam em `/tmp/bible-qa/`; só o PDF vai para `/mnt/documents`.
- Não altera código de produção; apenas adiciona specs e o script de relatório.
