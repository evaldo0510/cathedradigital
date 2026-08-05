---
name: SEO and Schema Certification Rules
description: Guia técnico de regras de SEO, metadados e schema.org para a Cathedra Digital.
type: feature
---

# Certificação de SEO e Schema.org (Cathedra)

Este documento define os critérios de aceitação para o Quality Gate de SEO no CI.

## 1. Metadados Obrigatórios (OpenGraph & Meta)

Todas as rotas indexáveis em `src/config/routeMeta.ts` devem conter:

- **title**: 3 a 60 caracteres.
- **description**: 50 a 160 caracteres. CTR-focused.
- **og:type**: `website` (default) ou `article`.
- **og:url**: Deve ser o link absoluto baseado em `BASE_URL`.
- **canonicalPath**: Obrigatório se a rota for um alias ou tiver parâmetros de query que não alteram o conteúdo principal.

## 2. Regras de Schema.org (JSON-LD)

Campos obrigatórios mínimos por tipo (validados em `src/lib/seo/jsonLdValidator.ts`):

| Tipo | Campos Obrigatórios |
| :--- | :--- |
| **Article / BlogPosting** | `headline`, `author`, `publisher`, `datePublished` |
| **Event** | `name`, `startDate`, `location` |
| **FAQPage** | `mainEntity` (Array de `Question` + `Answer`) |
| **DefinedTerm** | `name`, `description` |
| **Organization** | `name`, `url` |
| **WebSite** | `name`, `url` |

## 3. Validação de Canonical

- O CI falha se o `canonicalPath` for uma URL absoluta (deve ser caminho relativo começando com `/`).
- O CI falha se houver duplicidade de `canonicalPath` para conteúdos distintos.
- Rotas de alias (ex: `/rosario` -> `/oracao/rosario`) **devem** ter `noindex: true` e `canonicalPath` apontando para a origem.

## 4. Workflow de CI

1. **Static Analysis**: `bun run test:seo-ci` executa `scripts/validate-route-seo.ts`.
2. **Reports**: O relatório é gerado em `dist/seo/routes-report.html`.
3. **Artifacts**: Disponíveis no GitHub Actions sob o nome `seo-reports`.
