# READER V2 — CERTIFICAÇÃO FINAL

Data: 2026-08-01 · Escopo: arquitetura única de leitura da Cathedra.

## 1. Estado auditado (antes)

| Dimensão | Antes | Depois |
|---|---|---|
| Aderência ao Template Master (11 módulos) | 100/100 (registro com 6 módulos ainda `partial`) | 100/100 · todos `certified` |
| Leitores paralelos | 0 | 0 |
| `EditorialClosure` no barrel canônico | ❌ ausente (9 imports profundos) | ✅ exportado; 8 imports migrados |
| Guardrail contra import profundo de primitivo | ❌ inexistente | ✅ regra `reader-deep-import` |
| Toolbar do Reader — touch target | 32×32 px | 44×44 px |
| Toolbar do Reader — foco visível | ausente | `focus-visible:ring` |
| `ToolbarButton` / `FooterSection` — refs | warning React em toda leitura | `forwardRef` aplicado |
| Safe area inferior no slot `continuation` | ausente | `env(safe-area-inset-bottom)` |

## 2. Correções realizadas

1. **Barrel canônico** — `EditorialClosure` (+ tipos) exportado por `@/components/reader`. Migrados Catecismo, Glossário, Missal, Liturgia das Horas, Santos (detalhe e obras) e o validador admin. Exceção documentada: `src/lib/editorial/resolveClosure.ts` (import *type-only*, evita ciclo) — na allowlist.
2. **Guardrail** — nova regra em `FORBIDDEN_IMPORTS` bloqueia `@/components/reader/<Primitivo>`; qualquer fork futuro falha o CI.
3. **Registro** — `src/config/reader-modules.ts`: Bíblia, Magistério, Santos, Jornadas, Coleções e Novenas promovidos a `certified` (todos com score 100).
4. **Acessibilidade e mobile** — `ReaderToolbar` com alvos de 44 px e anel de foco; `ReaderShell` respeita a safe area inferior (notch / Bottom Navigation) no rodapé de continuidade.
5. **Ruído de console** — `forwardRef` em `ToolbarButton` e `FooterSection` elimina warnings emitidos em toda leitura.

## 3. Evidências

- `bun scripts/reader-template-audit.ts` → 11/11 módulos 100/100.
- `bun scripts/reader-guardrail.ts` → 0 violações.
- `bun scripts/parallel-readers-audit.ts` → 5/5 leitores canônicos, 0 legados.
- `bun scripts/reader-chrome-audit.ts` → `EditorialReaderChrome` extinto.
- `vitest src/test/reader-template-chain.static.test.ts` → 67/67.
- `tsgo --noEmit` → 0 erros.
- Playwright (1280×1800 e 390×844) em `/catechism`, `/glossario/graca`:
  `main=1`, `h1=1`, `data-reader-shell=1`, slots `hero → header-context → content → nexus → continuation` na ordem canônica.

## 4. Componentes reutilizados (fonte única)

`ReaderShell`, `EditorialHero`, `HeaderContext` (Liturgical/Journey/Catechesis/Study/Prayer), `ReaderToolbar`, `ReferencePopover`, `NexusPanel`, `EditorialClosure`, `ReaderContinuation` — todos em `@/components/reader`.

## 5. Componentes eliminados / bloqueados

`NexusBubbles`, `MysteryNexusPanel`, `AutoNexusList`/`NexusFullList` locais, `EditorialReaderChrome`, uso direto de `@radix-ui/react-popover`, imports profundos de primitivos do Reader.

## 6. Débito residual (não bloqueante)

- Warnings de ref em desenvolvimento remanescentes na árvore do Glossário (framer-motion / providers) — não afetam build de produção nem a11y.
- `BibleVersePopover` e `BibleDictionaryPopover` seguem na allowlist até a migração para `ReferencePopover` (Fase D).

## 7. Selo

**READER V2 — CERTIFIED.** Todo módulo novo deve consumir exclusivamente `@/components/reader`. Evolução do leitor acontece apenas no componente central.
