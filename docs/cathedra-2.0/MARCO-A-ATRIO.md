# Marco A — Ambiente Átrio

**Status:** 🟢 ESTÁVEL — congelado
**Sprint de origem:** 2.0.1 → 2.0.4 (CAT-021 · CAT-022 · Fase 4A)
**Nota final da auditoria:** 97/100

## O que está congelado

Todo o conteúdo de:

- `src/modules/atrium/**`
- `src/core/navigation/**` (contratos globais consumidos pelo Átrio)

## Regras de congelamento

A partir deste marco, no escopo do Átrio:

- ❌ Sem melhorias estéticas
- ❌ Sem refactors
- ❌ Sem otimizações "oportunistas"
- ❌ Sem novos componentes
- ✅ **Apenas** correções críticas (bug bloqueante, regressão de segurança, quebra de acessibilidade)

Qualquer evolução visual, novo bloco ou mudança de composição exige:

1. Abertura de uma nova sprint dedicada
2. Atualização do `ATRIUM-CONTRACT.md` **antes** do código
3. Nova auditoria homologatória ao final

## Contratos que outras sprints devem respeitar

- Composição é decidida **exclusivamente** em `src/modules/atrium/composition.ts`.
- Componentes-bloco **nunca** conhecem: perfil, Supabase, React Query, fetch, registries.
- Rotas **nunca** são hardcoded — sempre via `RouteRegistry`.
- Origem de dados **sempre** via adapter (`src/modules/atrium/adapters/**`).

## Próximo módulo

Sprint 2.0.4 — Knowledge Engine (`src/core/knowledge/`).
Sprint 2.0.5 — Biblioteca 2.0 (consumirá Theme + Route + Search + Knowledge).
