# Nav Coverage Report

_Gerado por `scripts/nav-coverage-report.ts`_

**Cobertura geral:** 63/88 (71.6%)

## Bottom Nav (MobileBottomNav)
Total: 5 · Cobertos: 5 · Faltando: 0

### Faltando
_(vazio)_

## Redirects legados (`<Navigate to=...>`)
Total: 36 · Cobertos: 35 · Faltando: 1

### Faltando
- `/glossary/:slug`

## Rotas em `src/config/routes.ts`
Total: 47 · Cobertos: 23 · Faltando: 24

### Faltando
- `/itineraria`
- `/bible-recovery`
- `/temas`
- `/aquinas`
- `/papas`
- `/aparicoes`
- `/dogmas`
- `/lectio`
- `/confession`
- `/breviary`
- `/missal`
- `/calendar`
- `/litanies`
- `/guia-modulos`
- `/community`
- `/onboarding`
- `/settings`
- `/about`
- `/partners`
- `/privacy`
- `/terms`
- `/transparencia`
- `/design-system`
- `/admin/audit`

## Especificações que compõem a cobertura

- `tests/e2e/bottom-nav-and-redirects-no-404.spec.ts` — bottom nav + redirects legados
- `tests/e2e/nav-auth-admin-snapshots.spec.ts` — AuthGuard, /admin/*, snapshot estrutural
- `src/test/BottomNavRoutesResolvable.test.ts` — análise estática (vitest)

## Sanidade
- Rotas concretas declaradas em App.tsx: 171
- <Navigate> mapeados: 36
