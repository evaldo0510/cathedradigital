# Módulo Catequese

Este diretório é o destino da **Sprint CQ-1** (ver `.lovable/plan.md`). Consolidará os 15 arquivos da Catequese hoje espalhados entre `src/components/cathedra/`, `src/pages/` e `src/pages/admin/`.

## Estado atual

**Vazio.** A movimentação física acontece na onda **CQ-1.2**, atrás da feature flag `VITE_MODULES_CATEQUESE`.

## Política de imports (após CQ-1.4)

- Consumidores externos importam **apenas** via barrel: `import { X } from "@/modules/catequese"`.
- Arquivos internos deste módulo **nunca** importam do próprio barrel — usam paths relativos (`./reader/...`). Regra ESLint `no-restricted-imports` bloqueia.
- Nenhum arquivo fora deste diretório pode importar diretamente `@/modules/catequese/reader/...`, `@/modules/catequese/components/...`, etc.

## Feature flag

`VITE_MODULES_CATEQUESE=1` ativa as rotas via `src/modules/catequese/routes.tsx`. Sem a flag (default `0` até CQ-1.4), `src/App.tsx` usa os caminhos legados.

## Rollback

Ver seção "Plano de rollback" em `.lovable/plan.md`. Cada onda é atômica e revertível via `git revert` ou toggle da flag.
