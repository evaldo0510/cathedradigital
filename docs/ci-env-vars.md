# Variáveis de ambiente do CI

Referência única das variáveis usadas pelos workflows em `.github/workflows/` e pelos scripts em `scripts/`. Mantenha em sincronia sempre que adicionar uma nova.

## Tabela mestre

| Variável | Onde é usada | Origem | Fallback | Obrigatória? |
|---|---|---|---|---|
| `PROD_BASE_URL` | `gsc-meta-gate`, `prod-seo-http`, scripts `check-sitemap-robots.ts`, `validate-gsc-meta.ts` | GitHub → Settings → Variables → Actions (`vars.PROD_BASE_URL`) | `https://www.cathedradigital.com.br` | Não (usa fallback) |
| `SUPABASE_URL` / `VITE_SUPABASE_URL` | Build e testes | GitHub → Settings → Secrets (`secrets.SUPABASE_URL`) | `https://gpwrpmoniglarqwfyryp.supabase.co` | Não |
| `SUPABASE_PUBLISHABLE_KEY` / `VITE_SUPABASE_PUBLISHABLE_KEY` | Build e testes | GitHub → Settings → Secrets | — | Sim para E2E autenticado |
| `NORM_BUDGET_PER_MS` | Job `vitest` (benchmark do normalizador) | Inline no workflow | `2` | Não |
| `NORM_BUDGET_BATCH_MS` | Job `vitest` | Inline no workflow | `100` | Não |
| `NORM_ITERATIONS` | Job `vitest` | Inline no workflow | `200` | Não |
| `CI` | Playwright (`headless`, retries) | GitHub Actions define automaticamente | — | — |

> **Token do Google Search Console** não é uma variável de ambiente — é um valor **estático colado em `index.html`** (`<meta name="google-site-verification" content="...">`). O CI apenas valida a presença via `scripts/validate-gsc-meta.ts`. Ver seção abaixo.

## Google Search Console — meta tag

**Não é secret. É código.** O token vive em `index.html` no `<head>`:

```html
<meta name="google-site-verification" content="SEU_TOKEN_AQUI" />
```

Como obter:
1. https://search.google.com/search-console → adicionar propriedade → **Prefixo de URL** → `https://www.cathedradigital.com.br`
2. Método de verificação → **Tag HTML** → copiar o `content="..."`
3. Colar em `index.html`, commitar e publicar

O CI (`gsc-meta-gate`) falha se a meta estiver ausente ou ainda com o placeholder `SUBSTITUIR_PELO_CODIGO_GSC`.

## Como configurar

### Localmente (dev)

Nada obrigatório. Os scripts têm fallback para o domínio de produção. Para apontar para outro ambiente:

```bash
# Verificação sitemap/robots contra o preview Lovable
bun run scripts/check-sitemap-robots.ts --base=https://cathedradigital.lovable.app

# Validação da meta contra outra URL
bun run scripts/validate-gsc-meta.ts --url=https://cathedradigital.lovable.app

# Ignorar o placeholder durante desenvolvimento
bun run scripts/validate-gsc-meta.ts --allow-placeholder
```

### No GitHub Actions

Repositório → **Settings → Secrets and variables → Actions**:

- **Variables** (não sensíveis, aparecem no log):
  - `PROD_BASE_URL` = `https://www.cathedradigital.com.br`
- **Secrets** (sensíveis, mascarados):
  - `SUPABASE_URL`
  - `SUPABASE_PUBLISHABLE_KEY`

Para trocar o domínio verificado (staging, custom domain novo), edite apenas `PROD_BASE_URL` — nenhum script precisa de mudança.

### No deploy (Lovable / Vercel)

- **Lovable**: hospedagem gerenciada. Nenhuma variável precisa ser configurada — o build do CI é o mesmo que sobe.
- **Meta tag do GSC**: por ser estática em `index.html`, é publicada automaticamente no próximo deploy após commit.

## Artefatos gerados pelo CI

Todos publicados como `actions/upload-artifact` (retention 14 dias):

| Job | Artefato | Conteúdo |
|---|---|---|
| `seo-assets` | `seo-reports` | `sitemap.xml`, `robots.txt`, checklists |
| `gsc-meta-gate` | `gsc-meta-reports` | `reports/seo/gsc-meta-check.{json,md}`, `sitemap-robots-check.{json,md}` |
| `reader-template` | `architecture-reports` | Score arquitetural + roadmap |
| `playwright` / `publish-gate` | `playwright-report` | HTML report do Playwright |

O `gsc-meta-check.md` inclui em caso de falha: URL consultada, HTTP status, trecho da tag `<meta>` encontrada (se houver), snippet do `<head>` e status HTTP + Content-Type + primeiros 400 chars de `sitemap.xml` e `robots.txt`.
