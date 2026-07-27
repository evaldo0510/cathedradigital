import { test, expect, Page } from '@playwright/test';

/**
 * E2E /pricing em desktop + mobile.
 * Garante que os cards renderizam, os preços batem com o JSON-LD,
 * e não há duplicação de features ao alternar breakpoints.
 */

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
] as const;

async function collectFeatureLabels(page: Page, variant: 'free' | 'pro'): Promise<string[]> {
  const card = page.getByTestId(`plan-card-${variant}`);
  return card.locator('ul li').allInnerTexts();
}

async function jsonLdPrices(page: Page): Promise<string[]> {
  const blocks = await page.locator('head script[type="application/ld+json"]').allTextContents();
  const prices: string[] = [];
  for (const raw of blocks) {
    const parsed = JSON.parse(raw);
    const offers = (parsed as { offers?: Array<{ price?: string }> }).offers;
    if (Array.isArray(offers)) offers.forEach((o) => o.price && prices.push(o.price));
  }
  return prices;
}

for (const vp of VIEWPORTS) {
  test.describe(`/pricing · e2e (${vp.name})`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test('renderiza ambos os cards e preços', async ({ page }) => {
      await page.goto('/pricing');
      await page.waitForLoadState('networkidle');

      await expect(page.getByTestId('plan-card-free')).toBeVisible();
      await expect(page.getByTestId('plan-card-pro')).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 })).toContainText(/Escolha seu Caminho/i);

      // Preços visíveis no card PRO
      const pro = page.getByTestId('plan-card-pro');
      await expect(pro).toContainText('R$ 15');
      await expect(pro).toContainText(',92');
      await expect(pro).toContainText('R$ 191,04');
    });

    test('JSON-LD reflete os preços exibidos', async ({ page }) => {
      await page.goto('/pricing');
      await page.waitForLoadState('networkidle');
      const prices = await jsonLdPrices(page);
      expect(prices, 'JSON-LD sem offers').toContain('15.92');
      expect(prices).toContain('191.04');
    });

    test('sem duplicação de features dentro do mesmo card', async ({ page }) => {
      await page.goto('/pricing');
      await page.waitForLoadState('networkidle');

      for (const variant of ['free', 'pro'] as const) {
        const labels = (await collectFeatureLabels(page, variant)).map((l) => l.trim());
        expect(labels.length, `card ${variant} sem features`).toBeGreaterThan(0);
        const uniq = new Set(labels);
        expect(uniq.size, `card ${variant} duplica features: ${labels.join(' | ')}`).toBe(
          labels.length,
        );
      }
    });
  });
}

test('alternância desktop → mobile não duplica features', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/pricing');
  await page.waitForLoadState('networkidle');
  const desktopPro = await collectFeatureLabels(page, 'pro');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  const mobilePro = await collectFeatureLabels(page, 'pro');

  // Mesmo conjunto (ordem/quantidade) — nenhum item extra ou duplicado ao trocar breakpoint.
  expect(mobilePro.length).toBe(desktopPro.length);
  expect(new Set(mobilePro).size).toBe(mobilePro.length);
  expect([...mobilePro].sort()).toEqual([...desktopPro].sort());
});
