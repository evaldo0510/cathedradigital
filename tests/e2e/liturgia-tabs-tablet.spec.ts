import { test, expect } from '@playwright/test';

const TABS = [
  { id: 'liturgia', label: 'Liturgia' },
  { id: 'missal', label: 'Missal' },
  { id: 'calendario', label: 'Calendário' },
];

const TABLET_VIEWPORTS = [
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'tablet-834', width: 834, height: 1112 },
  { name: 'tablet-1024', width: 1024, height: 1366 },
];

test.describe('Liturgia — abas tablet (variant + hitbox + sem corte)', () => {
  for (const vp of TABLET_VIEWPORTS) {
    test(`variant/hitbox/sem corte em ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/liturgia');
      await page.waitForLoadState('networkidle');

      const tabs = page.getByRole('tab');
      await expect(tabs).toHaveCount(TABS.length);

      for (let i = 0; i < TABS.length; i++) {
        await tabs.nth(i).click();
        await page.waitForTimeout(150);

        const active = tabs.nth(i);
        await expect(active).toHaveAttribute('aria-selected', 'true');

        // Variant ativa: fundo sólido + sombra
        const activeStyle = await active.evaluate((el) => {
          const cs = getComputedStyle(el);
          return { bg: cs.backgroundColor, shadow: cs.boxShadow };
        });
        expect(activeStyle.bg).not.toBe('rgba(0, 0, 0, 0)');
        expect(activeStyle.shadow).not.toBe('none');

        // Hitbox de todas as abas >= 40px
        for (let j = 0; j < TABS.length; j++) {
          const box = await tabs.nth(j).boundingBox();
          expect(box, `bbox aba ${TABS[j].label}`).not.toBeNull();
          if (!box) continue;
          expect(box.width, `${TABS[j].label} largura`).toBeGreaterThanOrEqual(40);
          expect(box.height, `${TABS[j].label} altura`).toBeGreaterThanOrEqual(40);
          expect(box.x + box.width).toBeLessThanOrEqual(vp.width + 1);
        }

        // Texto não cortado
        const overflow = await active.evaluate((el) => {
          const span = (el.querySelector('span') as HTMLElement) ?? (el as HTMLElement);
          return span.scrollWidth - span.clientWidth;
        });
        expect(overflow).toBeLessThanOrEqual(1);
      }

      // Sem overflow horizontal
      const hOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(hOverflow).toBe(false);
    });
  }
});
