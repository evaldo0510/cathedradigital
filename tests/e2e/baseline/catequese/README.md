# Baseline visual — Catequese (Sprint CQ-1.2)

Screenshots de referência ANTES da reorganização modular. Comparados após CQ-1.2 para provar zero-regressão visual.

## Como gerar (executor: agente na CQ-1.2)

```bash
# 1. Subir preview server em outra janela
bun run build && bun run preview --port 8080 --host 127.0.0.1

# 2. Rodar o spec de baseline
bunx playwright test tests/e2e/catequese-baseline.spec.ts --project=chromium
```

Isso grava PNGs em `_review/` (pasta ignorada por commit).

## Como aprovar (executor: humano)

1. Abrir cada PNG em `tests/e2e/baseline/catequese/_review/`.
2. Validar visualmente que as rotas estão exibindo o conteúdo esperado (Catechism, Catechism legado, gate do admin).
3. Se OK, promover para baseline:
   ```bash
   mv tests/e2e/baseline/catequese/_review/*.png tests/e2e/baseline/catequese/
   rmdir tests/e2e/baseline/catequese/_review
   git add tests/e2e/baseline/catequese/
   ```
4. Se algo estranho: apagar `_review/`, corrigir, rodar de novo.

## Comparação após CQ-1.2

O mesmo spec re-executado com a movimentação já feita deve produzir PNGs pixel-idênticos. Comparação manual (`diff` visual) ou via `expect(...).toMatchSnapshot()` numa segunda etapa se você preferir automatizar.

## Por que `_review/` não é commitado

`.gitignore` bloqueia essa subpasta. Só o humano promove para baseline oficial — evita commit acidental de screenshot com bug/loading state.
