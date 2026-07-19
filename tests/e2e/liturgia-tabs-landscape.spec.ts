import { test, expect } from '@playwright/test';

const TABS = ['Liturgia', 'Missal', 'Calendário'];

// Landscape: altura < largura
const LANDSCAPE_VIEWPORTS = [
  { name: 'mobile-landscape-568x320', width: 568, height: 320 },
  { name: 'mobile-landscape-667x375', width: 667, height: 375 },
  { name: 'mobile-landscape-844x390', width: 844, height: 390 },
  { name: 'mobile-landscape-915x412', width: 915, height: 412 },
  { name: 'tablet-landscape-1024x768', width: 1024, height: 768 },
  { name: 'tablet-landscape-1194x834', width: 1194, height: 834 },
  { name: 'tablet-landscape-1366x1024', width: 1366, height: 1024 },
];

test.describe('Liturgia — abas em landscape (mobile + tablet)', () => {
  for (const vp of LANDSCAPE_VIEWPORTS) {
    test(`sem corte e hitbox >= 40px em ${vp.name}`, async ({ page }) => {
      expect(vp.width, 'viewport deve ser landscape').toBeGreaterThan(vp.height);
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/liturgia');
      await page.waitForLoadState('networkidle');

      const tabs = page.getByRole('tab');
      await expect(tabs).toHaveCount(TABS.length);

      for (let i = 0; i < TABS.length; i++) {
        const tab = tabs.nth(i);
        await expect(tab).toBeVisible();

        const box = await tab.boundingBox();
        expect(box).not.toBeNull();
        if (!box) continue;

        expect(box.width, `${TABS[i]} largura`).toBeGreaterThanOrEqual(40);
        expect(box.height, `${TABS[i]} altura`).toBeGreaterThanOrEqual(40);
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(vp.width + 1);

        const overflow = await tab.evaluate((el) => {
          const span = (el.querySelector('span') as HTMLElement) ?? (el as HTMLElement);
          return span.scrollWidth - span.clientWidth;
        });
        expect(overflow, `texto cortado em ${TABS[i]}`).toBeLessThanOrEqual(1);
      }

      const hOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(hOverflow).toBe(false);
    });
  }
});
