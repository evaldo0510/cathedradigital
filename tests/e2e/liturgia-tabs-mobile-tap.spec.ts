import { test, expect, devices } from '@playwright/test';

const MOBILE_DEVICES = [
  { name: 'iphone-se', ...devices['iPhone SE'] },
  { name: 'iphone-12', ...devices['iPhone 12'] },
  { name: 'pixel-5', ...devices['Pixel 5'] },
];

for (const d of MOBILE_DEVICES) {
  test.describe(`Liturgia — tap em cada aba (${d.name})`, () => {
    test(`tap alterna aria-selected sem overflow`, async ({ browser }) => {
      const context = await browser.newContext({ ...d });
      const page = await context.newPage();
      await page.goto('/liturgia');
      await page.waitForLoadState('networkidle');

      const tablist = page.getByRole('tablist', { name: /Navegação da Liturgia/i });
      await tablist.scrollIntoViewIfNeeded();
      const tabs = page.getByRole('tab');
      const count = await tabs.count();
      expect(count).toBeGreaterThanOrEqual(3);

      for (let i = 0; i < count; i++) {
        const box = await tabs.nth(i).boundingBox();
        expect(box, `${d.name} aba ${i} sem bounding box`).not.toBeNull();
        if (!box) continue;

        // Toque real via touchscreen no centro da aba
        await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
        await page.waitForTimeout(150);

        await expect(tabs.nth(i)).toHaveAttribute('aria-selected', 'true');
        for (let j = 0; j < count; j++) {
          if (j === i) continue;
          await expect(tabs.nth(j)).toHaveAttribute('aria-selected', 'false');
        }

        // Hitbox mínima 40px
        expect(box.height, `${d.name} aba ${i} altura`).toBeGreaterThanOrEqual(40);
        expect(box.width, `${d.name} aba ${i} largura`).toBeGreaterThanOrEqual(40);

        // Sem overflow horizontal após o tap
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
        );
        expect(overflow, `${d.name} overflow após tap na aba ${i}`).toBe(false);
      }

      await context.close();
    });
  });
}
