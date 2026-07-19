import { test, expect, devices } from '@playwright/test';

/**
 * Regressão de rotas study.father — /biblioteca/padres/:slug.
 * Valida com 5 slugs reais do banco (tabela saints, category='doctor')
 * que nenhuma rota retorna 404 nem em mobile nem em desktop.
 * O redirect deve levar a /santos/:slug e a página deve renderizar.
 */

const REAL_FATHER_SLUGS = [
  'agostinho',              // Santo Agostinho de Hipona
  's-joao-crisostomo-0913', // S. João Crisóstomo
  'thomas-aquinas',         // São Tomás de Aquino
  'jeronimo',               // São Jerônimo
  'bernardo',               // São Bernardo de Claraval
] as const;

const VIEWPORTS = [
  { name: 'mobile', viewport: devices['iPhone 13'].viewport },
  { name: 'desktop', viewport: { width: 1280, height: 900 } },
] as const;

test.describe('study.father — /biblioteca/padres/:slug (regressão 404)', () => {
  for (const vp of VIEWPORTS) {
    test.describe(`viewport ${vp.name}`, () => {
      test.use({ viewport: vp.viewport });

      for (const slug of REAL_FATHER_SLUGS) {
        test(`${slug} não retorna 404`, async ({ page }) => {
          const response = await page.goto(`/biblioteca/padres/${slug}`, {
            waitUntil: 'networkidle',
          });

          // SPA fallback do Vite/Lovable retorna 200 mesmo em rotas dinâmicas.
          expect(response?.status(), 'HTTP status').toBeLessThan(400);

          // Redirect canônico: /biblioteca/padres/:slug → /santos/:slug
          await expect
            .poll(() => new URL(page.url()).pathname, { timeout: 5_000 })
            .toBe(`/santos/${slug}`);

          // Não pode ter caído no NotFound.
          const body = (await page.textContent('body')) ?? '';
          expect(body.toLowerCase()).not.toMatch(/404|not\s*found|página não encontrada/);
        });
      }
    });
  }
});
