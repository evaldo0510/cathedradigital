import { test, expect, devices } from '@playwright/test';

const VIEWPORTS = [
  { name: 'iPhone-SE-320', width: 320, height: 568 },
  { name: 'iPhone-8-375', width: 375, height: 667 },
  { name: 'iPhone-12-390', width: 390, height: 844 },
  { name: 'Pixel-7-412', width: 412, height: 915 },
];

const TAB_LABELS = ['Liturgia', 'Missal', 'Calendário'];

test.describe('Liturgia - abas mobile (sem corte + destaque ativo)', () => {
  for (const vp of VIEWPORTS) {
    test(`abas visíveis e destaque ativo em ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/liturgia');
      await page.waitForLoadState('networkidle');

      const tabs = page.getByRole('tab');
      await expect(tabs).toHaveCount(TAB_LABELS.length);

      const viewportWidth = vp.width;

      for (let i = 0; i < TAB_LABELS.length; i++) {
        const tab = tabs.nth(i);
        await expect(tab).toBeVisible();
        const text = (await tab.textContent())?.trim() ?? '';
        expect(text).toContain(TAB_LABELS[i]);

        const box = await tab.boundingBox();
        expect(box, `bounding box da aba ${TAB_LABELS[i]}`).not.toBeNull();
        if (!box) continue;

        // Não pode estourar viewport horizontalmente
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(viewportWidth + 1);

        // Sem corte de texto (scrollWidth <= clientWidth)
        const overflow = await tab.evaluate((el) => {
          const target = (el.querySelector('span') as HTMLElement) ?? (el as HTMLElement);
          return target.scrollWidth - target.clientWidth;
        });
        expect(overflow, `texto cortado na aba ${TAB_LABELS[i]}`).toBeLessThanOrEqual(1);

        // Área de toque mínima (WCAG 44px)
        expect(box.height).toBeGreaterThanOrEqual(40);
      }

      // Sem overflow horizontal na página
      const hasHOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(hasHOverflow).toBe(false);

      // Destaque da aba ativa deve mudar ao clicar em cada uma
      for (let i = 0; i < TAB_LABELS.length; i++) {
        await tabs.nth(i).click();
        await page.waitForTimeout(150);

        const active = tabs.nth(i);
        await expect(active).toHaveAttribute('aria-selected', 'true');

        // Outras abas devem estar aria-selected=false
        for (let j = 0; j < TAB_LABELS.length; j++) {
          if (j === i) continue;
          await expect(tabs.nth(j)).toHaveAttribute('aria-selected', 'false');
        }

        // Contraste visual: fundo/borda da ativa difere da inativa
        const activeStyle = await active.evaluate((el) => {
          const cs = getComputedStyle(el);
          return { bg: cs.backgroundColor, color: cs.color, border: cs.borderColor, shadow: cs.boxShadow };
        });
        const inactiveIndex = (i + 1) % TAB_LABELS.length;
        const inactiveStyle = await tabs.nth(inactiveIndex).evaluate((el) => {
          const cs = getComputedStyle(el);
          return { bg: cs.backgroundColor, color: cs.color, border: cs.borderColor, shadow: cs.boxShadow };
        });

        const different =
          activeStyle.bg !== inactiveStyle.bg ||
          activeStyle.color !== inactiveStyle.color ||
          activeStyle.border !== inactiveStyle.border ||
          activeStyle.shadow !== inactiveStyle.shadow;
        expect(different, `aba ${TAB_LABELS[i]} não está visualmente destacada`).toBe(true);
      }
    });
  }
});
