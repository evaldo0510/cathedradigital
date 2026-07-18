# CAT-030 — Cobertura Nexus × Grafo × Rotas

_Gerado por `scripts/audit-nexus-graph.ts` — 2026-07-18T16:33:10.592Z_

## Sumário

- **Total de nós**: 23
- **OK** (resolveLink + rota casada): 15 (65.2%)
- **Sem rota** (kind sem route pública — bubble ocultado): 8 (34.8%)
- **URL não mapeada em App.tsx** (P0 — investigar): 0 (0.0%)

## ⚠️  Sem rota (bubble ocultado por design)

| Kind | Label | URL resolvida | Rota casada |
|------|-------|---------------|-------------|
| `father` | Santo Agostinho | — | — |
| `father` | São João Crisóstomo | — | — |
| `application` | Esperança na provação | — | — |
| `application` | Participação na Missa | — | — |
| `application` | Sacramentos e vida de graça | — | — |
| `prayer` | Lectio: Rm 8, 24-25 | — | — |
| `prayer` | Adoração eucarística | — | — |
| `prayer` | Oração de agradecimento pela graça | — | — |

## ✅ OK

| Kind | Label | URL resolvida | Rota casada |
|------|-------|---------------|-------------|
| `theme` | Esperança | /temas/esperanca | /temas/:slug |
| `theme` | Eucaristia | /temas/eucaristia | /temas/:slug |
| `theme` | Graça | /temas/graca | /temas/:slug |
| `bible` | Rm 8 | /bible?book=romanos&ch=8 | /bible |
| `bible` | Jo 6 | /bible?book=joao&ch=6 | /bible |
| `bible` | Ef 2 | /bible?book=efesios&ch=2 | /bible |
| `catechism` | CIC §§ 1817-1821 | /catechism?p=1817 | /catechism |
| `catechism` | CIC §§ 1322-1419 | /catechism?p=1322 | /catechism |
| `catechism` | CIC §§ 1996-2005 | /catechism?p=1996 | /catechism |
| `magisterium` | Spe Salvi | /magisterium/spe-salvi | /magisterium/:id |
| `magisterium` | Ecclesia de Eucharistia | /magisterium/ecclesia-de-eucharistia | /magisterium/:id |
| `magisterium` | Trento — Decreto sobre a Justificação | /magisterium/trento-justificacao | /magisterium/:id |
| `saint` | Santa Teresa de Ávila | /santos/santa-teresa-de-avila | /santos/:id |
| `saint` | Santo Tomás de Aquino | /santos/santo-tomas-de-aquino | /santos/:id |
| `saint` | Santa Teresinha do Menino Jesus | /santos/santa-teresinha | /santos/:id |

## Rotas conhecidas em App.tsx

```
*
/
/__test/theological-text
/a11y-audit
/about
/achievements
/admin/*
/admin/bible-cache-timeseries
/admin/bible-diagnostic-runs
/admin/bible-gate-pendencies
/admin/bible-import
/admin/bible-import-jobs
/admin/bible-import-jobs/:id
/admin/bible-import-missing
/admin/bible-perf-breakdown
/admin/bible-sources
/admin/bible-sprint1
/admin/bible-translations-readiness
/admin/client-errors
/admin/pg-stat-statements
/admin/saints
/admin/seo
/admin/seo-status
/aparicoes
/aquinas
/audit
/auth
/axe-contrast
/az-faith
/bible
/bible-abbr-validate
/bible-cache
/bible-coverage
/bible-import
/bible-perf
/bible-perf-breakdown
/bible-recovery
/bible-sources
/biblia
/biblioteca
/breviary
/buscar
/cache-manager
/calendar
/catechism
/catechism-explorer
/catecismo
/chat
/checkout
/checkout/result
/cid-compliance
/community
/confession
/dashboard
/design-system
/diario
/dogmas
/encyclopedia
/favorites
/glossary
/guia-modulos
/hoje
/home
/integrity
/itineraria
/itineraria/:id
/itineraria/:id/step
/jornadas
/jornadas/:id
/jornadas/:id/complete
/jornadas/:id/step
/journeys
/language
/lectio
/legacy-home
/library
/litanies
/liturgia
/login
/logos
/magisterio
/magisterium
/magisterium/:id
/missal
/notes
/offline
/onboarding
/oracao
/papas
/partners
/prayer
/prayers
/pricing
/privacy
/profile
/prototype-2.0
/prototype-2.0/atrio
/prototype-2.0/atrium-v2
/prototype-2.0/estudar
/prototype-2.0/estudar/tema/:slug
/prototype-2.0/formar-se
/prototype-2.0/leitor
/prototype-2.0/minha-jornada
/prototype-2.0/pesquisar
/prototype-2.0/rezar
/reset-password
/rosary
/santos
/santos/:id
/search
/security
/security-alerts
/seo-status
/seo-verify
/spiritual-profile
/telemetry
/temas
/temas/:slug
/terms
/transactions
/transparencia
/ui-errors
/upgrade
/via-crucis
/viacrucis
/visual-audit
```