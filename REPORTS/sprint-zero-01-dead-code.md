# Sprint Zero — Auditoria 1: Código Morto & Duplicado

**Modo:** read-only. Nenhum arquivo alterado.
**Data:** 2026-07-04
**Escopo:** scripts órfãos, componentes sem uso, testes duplicados (Cypress vs Playwright), artefatos soltos na raiz.

---

## 1. Scripts de migração pontual (raiz do projeto)

| Arquivo | Status | Ação proposta | Risco |
|---|---|---|---|
| `clean_imports.py` | Órfão. Script one-shot para deduplicar imports do `Button`. Já executado; não referenciado em CI, package.json ou husky. | **Remover** | Baixo — histórico preservado em git. |
| `migrate_buttons.py` | Órfão. One-shot `<button>` → `<Button>`. Migração já concluída. | **Remover** | Baixo. |

## 2. Scripts Python em `scripts/` (batch/seed one-shot)

| Arquivo | Status | Ação proposta | Risco |
|---|---|---|---|
| `scripts/generate_batches.py` | Depende de `paragraphs_0_197.json` (não existe no repo). Órfão. | **Remover** | Baixo. |
| `scripts/generate_batches_v1.py` | Depende de `paragraphs_full_v1.json` (não existe). Versão intermediária. | **Remover** | Baixo. |
| `scripts/generate_batches_v2.py` | Mesma dep de v1. Substitui v1. Catecismo já populado. | **Remover** (após confirmar `catechism_official` completo) | Baixo. |
| `scripts/insert_catechism.py` | Auditar — provavelmente one-shot do mesmo lote. | **Auditar antes de remover** | Baixo. |
| `scripts/generate_sql.py` | Auditar propósito. | **Auditar** | Baixo. |
| `scripts/scrape_catechism.py` | Scraper one-shot (dados já estão no banco). | **Remover** | Baixo. |
| `scripts/scan-ids.py` | Auditar uso em CI. | **Auditar** | Baixo. |
| `scripts/generate-bible-qa-report.py` + `-v2.py` | Duas versões coexistindo. Manter apenas v2 se ambos ativos. | **Consolidar em uma** | Médio — verificar se algum workflow chama a v1. |

## 3. Componentes React mortos ou stubs

| Arquivo | Status | Ação proposta | Risco |
|---|---|---|---|
| `src/components/cathedra/HomeStats.tsx` | Stub `() => null` com comentário "removido para simplificação". Zero imports no `src`. | **Remover arquivo** | Nenhum. |
| `src/components/cathedra/VisualAuditPage.tsx` | Vivo — usado em `App.tsx:541` (rota `/visual-audit`). Contém bug: `toast` importado depois do uso (linha 205 vs 180). | **Manter, agendar fix do import** (fora do escopo desta auditoria) | Baixo. |
| `src/pages/__test/TheologicalTextFixture.tsx` | Vivo — rota fixture de teste E2E (`/__test/theological-text`), com guard `import.meta.env.PROD`. | **Manter** | — |

## 4. Testes duplicados (Cypress vs Playwright)

O projeto padronizou Playwright (`tests/e2e/`). Restos de Cypress:

| Arquivo Cypress | Equivalente Playwright | Ação proposta | Risco |
|---|---|---|---|
| `cypress/e2e/adminDashboard.cy.js` | `tests/e2e/adminDashboard.spec.ts` | **Remover Cypress** | Baixo — diffs de cobertura devem ser conferidos. |
| `cypress/e2e/adminDashboard.spec.js` | idem acima (duplicado dentro do próprio Cypress) | **Remover** | Baixo. |
| `cypress/e2e/catechism-a11y.cy.js` | `tests/e2e/catecismo-a11y-avancado.spec.ts` + `catechism-*.spec.ts` | **Remover Cypress** | Baixo. |
| `cypress/e2e/preferencia-reducao-movimento.cy.js` | `tests/e2e/preferencia-reducao-movimento.spec.ts` | **Remover Cypress** | Baixo. |
| Diretório `cypress/` inteiro | — | **Remover** após migrar qualquer asserção única + limpar deps `cypress` do `package.json` e workflows | Médio — verificar `.github/workflows/*.yml` por `cypress`. |

## 5. Testes duplicados dentro do próprio Vitest

| Arquivo | Status | Ação proposta | Risco |
|---|---|---|---|
| `src/components/__tests__/icon-audit.test.tsx` | Verifica ausência de imports diretos de `lucide-react` (falha se houver). | **Manter (é o teste "oficial")** | — |
| `src/components/cathedra/icon-audit.test.tsx` | Diagnóstico duplicado: apenas loga violações, nunca falha. Redundante com o anterior + workflow `icon-audit.yml`. | **Remover** | Baixo. |

## 6. Artefatos soltos na raiz do repo

| Arquivo | Status | Ação proposta | Risco |
|---|---|---|---|
| `bible-regression-test.js` | Script Node solto na raiz (2 KB). Deve viver em `scripts/` ou `tests/`. | **Mover para `scripts/`** ou remover se coberto por Playwright | Baixo. |
| `compliance-report.html` / `.json` / `.md` | Relatórios gerados (não deveriam estar versionados). | **Adicionar ao `.gitignore` e remover do repo** | Baixo. |
| `translations.html` | Artefato de relatório na raiz. | **Remover / mover para `reports/`** | Baixo. |
| `sitemap-validation-report.json`, `spacing-audit-summary.txt`, `test-results.json`, `summary.json` | Saídas de CI versionadas. | **`.gitignore` + remover** | Baixo. |
| `package.json.ci-patch.json` | Patch de CI solto. | **Auditar uso; mover para `.github/`** | Médio. |

## 7. Serviço neutralizado (contexto para Auditoria 3)

- `src/services/aiService.ts` — já neutralizado, mas ainda importado por:
  - `NexusBubbles.tsx` + seus 2 testes
  - `StudyMode.tsx`

  **Não remover agora** — remoção pertence à Auditoria 3 (dependências externas / IA). Listado aqui apenas para rastreio.

---

## Resumo executivo

- **Remoção segura imediata (risco baixo):** 8 arquivos
  `clean_imports.py`, `migrate_buttons.py`, `HomeStats.tsx`, `icon-audit.test.tsx` (cathedra), `generate_batches.py`, `generate_batches_v1.py`, `generate_batches_v2.py`, `scrape_catechism.py`
- **Requer auditoria antes de remover:** 4 arquivos
  `insert_catechism.py`, `generate_sql.py`, `scan-ids.py`, `generate-bible-qa-report.py` (vs v2)
- **Diretório Cypress inteiro:** 4 arquivos + configuração + deps — remoção condicionada a limpeza de workflows
- **Higiene do repo (`.gitignore` + remover):** 7 artefatos de CI versionados indevidamente

**Total estimado de remoções: ~20 arquivos + diretório `cypress/`.**
Nenhuma remoção afeta runtime, apenas superfície de manutenção.

---

## Próximo passo

Aguardando sua aprovação **item a item** (ou por seção) para executar as remoções. Após esta auditoria aprovada, sigo para:

- **Auditoria 2:** Edge Functions (42) — agrupar por domínio, propor consolidação.
- **Auditoria 3:** dependências externas vivas (`bolls.life`, `bible-api`, `esm.sh`, CDN fonts, resquícios de IA).
