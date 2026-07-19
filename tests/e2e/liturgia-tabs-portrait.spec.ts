import { test, expect } from '@playwright/test';

const TABS = ['Liturgia', 'Missal', 'Calendário'];

// Portrait: mobile + tablet
const PORTRAIT_VIEWPORTS = [
  { name: 'mobile-portrait-320', width: 320, height: 568 },
  { name: 'mobile-portrait-360', width: 360, height: 800 },
  { name: 'mobile-portrait-390', width: 390, height: 844 },
  { name: 'mobile-portrait-412', width: 412, height: 915 },
  { name: 'tablet-portrait-768', width: 768, height: 1024 },
  { name: 'tablet-portrait-834', width: 834, height: 1194 },
  { name: 'tablet-portrait-1024', width: 810, height: 1080 },
];

test.describe('Liturgia — abas em portrait (mobile + tablet)', () => {
  for (const vp of PORTRAIT_VIEWPORTS) {
    test(`sem corte e hitbox >= 40px em ${vp.name}`, async ({ page }) => {
      expect(vp.height, 'viewport deve ser portrait').toBeGreaterThan(vp.width);
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

        // Hitbox mínima
        expect(box.width, `${TABS[i]} largura`).toBeGreaterThanOrEqual(40);
        expect(box.height, `${TABS[i]} altura`).toBeGreaterThanOrEqual(40);
        // Dentro do viewport
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(vp.width + 1);

        // Texto não cortado
        const overflow = await tab.evaluate((el) => {
          const span = (el.querySelector('span') as HTMLElement) ?? (el as HTMLElement);
          return span.scrollWidth - span.clientWidth;
        });
        expect(overflow, `texto cortado em ${TABS[i]}`).toBeLessThanOrEqual(1);
      }

      // Sem overflow horizontal geral
      const hOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(hOverflow).toBe(false);
    });
  }
});
