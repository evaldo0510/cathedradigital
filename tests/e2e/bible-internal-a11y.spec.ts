import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * axe-core estendido em páginas INTERNAS acessadas após clique:
 *  - Capítulo aberto dentro da Bíblia (/bible?book=Jo&ch=6)
 *  - Detalhe do Catecismo (/catechism)
 *  - Detalhe de Jornadas (após clicar em "Formar-se" no menu)
 * Verifica landmarks, headings e rótulos consistentes.
 */

const CRITICAL_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const RULES = [
  'landmark-one-main',
  'landmark-unique',
  'page-has-heading-one',
  'heading-order',
  'button-name',
  'link-name',
  'image-alt',
  'label',
];

async function analyze(page: import('@playwright/test').Page) {
  const results = await new AxeBuilder({ page })
    .withTags(CRITICAL_TAGS)
    .withRules(RULES)
    .analyze();
  return results.violations.filter((v) =>
    ['critical', 'serious'].includes(v.impact || ''),
  );
}

for (const vp of [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'mobile',  width: 390,  height: 844 },
] as const) {
  test.describe(`Páginas internas a11y · ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test('Bíblia · capítulo Jo 6 aberto tem landmarks + headings', async ({ page }) => {
      await page.goto('/bible?book=Jo&ch=6');
      await expect(page.locator('main, [role="main"]').first()).toBeVisible({ timeout: 15000 });
      // <main> único
      expect(await page.locator('main, [role="main"]').count()).toBe(1);
      // pelo menos um heading
      const headingCount = await page.locator('h1, h2, [role="heading"]').count();
      expect(headingCount).toBeGreaterThan(0);
      const bad = await analyze(page);
      expect(bad, JSON.stringify(bad, null, 2)).toEqual([]);
    });

    test('Bíblia · lista de capítulos (viewMode chapters) tem grid rotulado', async ({ page }) => {
      await page.goto('/bible?book=Jo');
      const grid = page.getByTestId('chapter-grid');
      await expect(grid).toBeVisible({ timeout: 15000 });
      await expect(grid).toHaveAttribute('role', 'grid');
      await expect(grid).toHaveAttribute('aria-label', /Capítulos de/);
      const bad = await analyze(page);
      expect(bad, JSON.stringify(bad, null, 2)).toEqual([]);
    });

    test('Formar-se → detalhe interno após clique tem landmarks', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('link', { name: /Formar[- ]?se/i }).first().click();
      await expect(page).toHaveURL(/\/jornadas/);
      await expect(page.locator('main, [role="main"]').first()).toBeVisible({ timeout: 15000 });
      const bad = await analyze(page);
      expect(bad, JSON.stringify(bad, null, 2)).toEqual([]);
    });

    test('Catecismo · página aberta tem landmarks + heading', async ({ page }) => {
      await page.goto('/catechism');
      await expect(page.locator('main, [role="main"]').first()).toBeVisible({ timeout: 15000 });
      const bad = await analyze(page);
      expect(bad, JSON.stringify(bad, null, 2)).toEqual([]);
    });

    test('lista de livros vazia anuncia via aria-live', async ({ page }) => {
      await page.goto('/bible');
      // dispara empty state via busca sem resultado
      const search = page.getByPlaceholder(/busca/i).first();
      if (await search.count()) {
        await search.fill('xyzqzqz-not-a-book');
        const empty = page.getByTestId('book-list-empty');
        await expect(empty).toBeVisible({ timeout: 5000 });
        await expect(empty).toHaveAttribute('role', 'status');
        await expect(empty).toHaveAttribute('aria-live', 'polite');
        await expect(empty).toHaveAttribute('aria-label', /xyzqzqz-not-a-book/);
      } else {
        test.skip(true, 'campo de busca ausente nesta rota');
      }
    });
  });
}
