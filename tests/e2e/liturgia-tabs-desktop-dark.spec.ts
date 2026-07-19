import { test, expect } from '@playwright/test';

const TABS = [
  { id: 'liturgia', label: 'Liturgia' },
  { id: 'missal', label: 'Missal' },
  { id: 'calendario', label: 'Calendário' },
];

function parseRgb(css: string): [number, number, number, number] | null {
  const m = css.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const parts = m[1].split(',').map((s) => parseFloat(s.trim()));
  if (parts.length < 3) return null;
  return [parts[0], parts[1], parts[2], parts[3] ?? 1];
}
function luminance([r, g, b]: [number, number, number, number]): number {
  const n = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * n[0] + 0.7152 * n[1] + 0.0722 * n[2];
}
function contrastRatio(a: string, b: string): number {
  const A = parseRgb(a);
  const B = parseRgb(b);
  if (!A || !B) return 0;
  const [hi, lo] = [luminance(A), luminance(B)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

test.describe('Liturgia — abas desktop DARK (variant + contraste + sem inversão)', () => {
  test.use({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem('theme', 'dark');
        localStorage.setItem('vite-ui-theme', 'dark');
      } catch {}
    });
    await page.goto('/liturgia');
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);
  });

  test('ativa mantém variant, contraste AA, inativas não invertidas', async ({ page }) => {
    const tabs = page.getByRole('tab');
    await expect(tabs).toHaveCount(TABS.length);

    for (let i = 0; i < TABS.length; i++) {
      await tabs.nth(i).click();
      await page.waitForTimeout(150);

      const active = tabs.nth(i);
      await expect(active).toHaveAttribute('aria-selected', 'true');

      const activeStyle = await active.evaluate((el) => {
        const cs = getComputedStyle(el);
        return { bg: cs.backgroundColor, color: cs.color, shadow: cs.boxShadow };
      });

      expect(activeStyle.bg).not.toBe('rgba(0, 0, 0, 0)');
      expect(activeStyle.shadow).not.toBe('none');

      const ratio = contrastRatio(activeStyle.color, activeStyle.bg);
      expect(ratio, `dark: contraste ${TABS[i].label} = ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);

      for (let j = 0; j < TABS.length; j++) {
        if (j === i) continue;
        const inStyle = await tabs.nth(j).evaluate((el) => {
          const cs = getComputedStyle(el);
          return { bg: cs.backgroundColor, color: cs.color, shadow: cs.boxShadow };
        });
        expect(inStyle.bg, `dark: inativa ${TABS[j].label} com fundo da ativa`).not.toBe(activeStyle.bg);
        const rgba = parseRgb(inStyle.bg);
        const alpha = rgba ? rgba[3] : 1;
        expect(alpha).toBeLessThan(0.5);
        expect(inStyle.shadow).toBe('none');
        expect(inStyle.color, `dark: cor invertida em ${TABS[j].label}`).not.toBe(activeStyle.color);
      }
    }
  });
});
