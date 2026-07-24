# Sprint CQ-1 · Reorganização Modular da Catequese

## Objetivo

Consolidar os 15 arquivos da Catequese hoje espalhados entre `src/components/cathedra/`, `src/pages/` e `src/pages/admin/` em uma estrutura única `src/modules/catequese/`, sem alterar comportamento, rotas públicas ou contratos de dados.

## Não-objetivos (fora de escopo, explícito)

- Nenhuma mudança visual, de UX ou de conteúdo editorial.
- Nenhuma alteração no Reader (ReaderShell, HeaderContext, NexusPanel).
- Nenhuma mudança no schema do banco, RLS ou Edge Functions.
- Nenhum novo módulo, nenhuma renomeação de rota pública.
- Nenhuma mudança no normalizador, prefetch ou fila de importação.

## Escopo — arquivos afetados (15)

Movidos para `src/modules/catequese/`:

```text
src/modules/catequese/
├── index.ts                        # barrel público (única superfície de import)
├── routes.tsx                      # rotas lazy da Catequese, consumido por src/App.tsx
├── reader/
│   ├── AtriumCatechismReader.tsx   # ex: src/pages/AtriumCatechismReader.tsx
│   └── Catechism.tsx               # ex: src/components/cathedra/Catechism.tsx (legado)
├── explorer/
│   └── CatechismExplorer.tsx       # ex: src/pages/CatechismExplorer.tsx
├── admin/
│   └── CatechismImportQueue.tsx    # ex: src/pages/admin/CatechismImportQueue.tsx
├── components/
│   ├── CatechismPopover.tsx
│   ├── CatechismPendingPanel.tsx
│   ├── CatechismOfflineFallback.tsx
│   ├── CatechismDiagnosticPanel.tsx
│   ├── CatechismHealthCheck.tsx
│   ├── CatechismIntegrity.tsx
│   ├── CatechismVerification.tsx
│   ├── CatechismNormalizationDiff.tsx
│   └── CatechismDebug.tsx
└── __tests__/
    ├── CatechismPopover.internal.test.tsx
    └── CatechismPendingPanel.test.tsx
```

25+ arquivos consumidores (Bible, Magisterium, Saints, Nexus, adapters, etc.) passam a importar via barrel:

```ts
import { CatechismPopover, AtriumCatechismReader } from "@/modules/catequese";
```

## Critérios de aceite

Todos bloqueantes. A sprint só fecha com 100% verdes.

1. **Rotas idênticas**: `/catechism`, `/catechism-legacy`, `/catecismo → /catechism`, `/catechism-explorer → /catechism`, `/admin/catechism-queue` respondem 200 e renderizam o mesmo componente que hoje.
2. **Lazy loading preservado**: `bunx vite build` mostra chunks separados `catequese-reader-*.js` e `catequese-admin-*.js`; nenhum arquivo da Catequese entra no bundle inicial (`main-*.js`).
3. **Zero mudança visual**: screenshot Playwright de `/catechism`, `/catechism-legacy`, `/admin/catechism-queue` idêntico ao baseline (pixel diff ≤ 0.1%).
4. **Zero import quebrado**: `bunx tsgo` limpo; `rg "from ['\"].*cathedra/Catechism" src/` retorna 0 ocorrências fora de `src/modules/catequese/`.
5. **Testes atuais passam**: Vitest completo verde; Playwright `glossary-seo`, `smoke-routes-clean-console` verdes.
6. **Reader Architecture Rule respeitada**: `bun scripts/reader-guardrail.ts` verde; score arquitetural do domínio "catechism" não regride.
7. **Editorial Engine intacto**: manifestos e adapters em `src/core/content/adapters/` continuam resolvendo Catechism sem mudança de assinatura.
8. **Feature flag ativa até o merge**: mudança atrás de `VITE_MODULES_CATEQUESE=1`; sem a flag, app usa os caminhos antigos.
9. **COS §6 pós-validação**: Engineering Log CERTIFIED, zero regressão em módulos não tocados.

## Plano de execução (5 ondas, 1 PR por onda)

### CQ-1.1 · Baseline e feature flag
- Criar `src/modules/catequese/` vazio com `README.md` explicando a política.
- Adicionar `VITE_MODULES_CATEQUESE` (default `0`) em `.env.example` e `docs/ci-env-vars.md`.
- Rodar Playwright baseline: screenshots de `/catechism`, `/catechism-legacy`, `/admin/catechism-queue` salvos em `tests/e2e/baseline/catequese/`.
- **Merge condicional**: nenhuma mudança funcional.

### CQ-1.2 · Movimentação física (behind flag)
- Mover os 15 arquivos com `git mv` preservando histórico.
- Criar barrel `src/modules/catequese/index.ts` reexportando tudo.
- Manter **shims** nos caminhos antigos:
  ```ts
  // src/components/cathedra/Catechism.tsx (shim)
  export { default } from "@/modules/catequese/reader/Catechism";
  ```
- Criar `src/modules/catequese/routes.tsx` com `<CatequeseRoutes />` (mesmas rotas, mesmos lazy imports).
- Em `src/App.tsx`: `flag ? <CatequeseRoutes /> : <RotasAntigas />`.

### CQ-1.3 · Codemod dos consumidores
- Script `scripts/codemods/catequese-imports.ts` (ts-morph ou jscodeshift) que reescreve todos os `from "@/components/cathedra/Catechism*"` e `from "@/pages/AtriumCatechismReader"` para `from "@/modules/catequese"`.
- Rodar; commitar diff.
- Rodar `bunx tsgo` + Vitest + Playwright — todos verdes.

### CQ-1.4 · Ativar flag, remover shims
- Trocar default de `VITE_MODULES_CATEQUESE` para `1` no CI.
- Rodar suite completa em `main`.
- Após 48h sem incidente: **remover shims** dos caminhos antigos.
- Rodar `rg "cathedra/Catechism" src/` → deve retornar apenas `src/modules/catequese/**`.

### CQ-1.5 · Homologação
- Atualizar `docs/c0-homologation-checklist.md` marcando Catequese como reorganizada.
- Atualizar Manifest Registry do COS (§9) apontando os novos paths.
- Engineering Log final com pós-validação COS §6.

## Plano de rollback

Rollback é **trivial em cada onda** — é o principal motivo do faseamento.

| Onda | Rollback |
|---|---|
| CQ-1.1 | Nada a reverter (só docs e diretório vazio). |
| CQ-1.2 | Setar `VITE_MODULES_CATEQUESE=0` no CI. Efeito imediato: app volta às rotas antigas. Shims garantem que qualquer import legado continua funcionando. |
| CQ-1.3 | `git revert` do PR do codemod. Como os shims ainda existem, os imports antigos continuam válidos. |
| CQ-1.4 | Restaurar shims do PR CQ-1.2 + baixar flag para `0`. Comando: `git revert <sha-cq-1.4>`. |
| CQ-1.5 | Só documentação. |

**Circuit breaker**: se qualquer job do CI (`vitest`, `playwright`, `reader-template`, `gsc-meta-gate`) falhar em `main` após merge, o guardrail existente já bloqueia o deploy. Rollback via `git revert` do commit de merge — todos os PRs são atômicos e revertíveis.

**Janela de observabilidade**: 48h em produção com flag ativa antes de remover shims (CQ-1.4). Métricas monitoradas via `analytics.ts`: `catechism_paragraph_view`, `catechism_normalization_diff`, taxa de erro do `AtriumCatechismReader`.

## Riscos e mitigações

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Import circular via barrel | Média | Barrel só reexporta; nenhum arquivo interno importa do barrel. Lint rule `no-restricted-imports` bloqueando `@/modules/catequese` dentro do próprio módulo. |
| Chunk splitting muda e regride LCP | Baixa | Snapshot de `bundle-analyzer` antes/depois; falhar CI se `main` chunk crescer > 5%. |
| Tests com paths hardcoded | Média | Codemod cobre `.test.ts(x)`; auditoria manual em `tests/e2e/`. |
| Editorial Engine adapter quebra | Média | `src/core/content/adapters/` explicitamente inspecionado no PR CQ-1.3; teste dedicado `adapters.test.ts` já cobre. |
| CI Reader Guardrail muda de path | Baixa | Atualizar `scripts/reader-guardrail.ts` na mesma onda (CQ-1.2) para reconhecer o novo path. |

## Estimativa

- CQ-1.1: 1h
- CQ-1.2: 3h
- CQ-1.3: 2h (codemod + revisão)
- CQ-1.4: 30min (após 48h de observação)
- CQ-1.5: 30min

**Total ativo**: ~7h de trabalho, distribuído em ~3 dias por causa da janela de observabilidade.

## Detalhes técnicos

- **ts-morph** preferido ao jscodeshift para o codemod — melhor suporte a paths e re-exports TypeScript.
- Alias `@/modules/catequese` já é resolvido pelo `vite.config.ts` (padrão `@/*` existente).
- Feature flag lida em `src/App.tsx` via `import.meta.env.VITE_MODULES_CATEQUESE === "1"`.
- Manter `React.lazy(() => import("@/modules/catequese/reader/AtriumCatechismReader"))` — Vite gera chunk nomeado automaticamente.
- Regra ESLint adicionada: `no-restricted-imports` bloqueia novos imports de `components/cathedra/Catechism*` após CQ-1.4.
- Nenhuma dependência nova.

## O que **não** vou fazer

- Não vou renomear arquivos além do path (preservo o nome exportado).
- Não vou trocar `Catechism.tsx` legado por wrapper do `AtriumCatechismReader` — são consumidos por rotas diferentes e diagnóstico.
- Não vou "aproveitar para" reescrever nenhum componente — reorganização pura.
