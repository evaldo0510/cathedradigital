import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: 'mobile-portrait-390x844', width: 390, height: 844 },
  { name: 'mobile-landscape-844x390', width: 844, height: 390 },
  { name: 'tablet-portrait-768x1024', width: 768, height: 1024 },
  { name: 'tablet-landscape-1024x768', width: 1024, height: 768 },
];

function parseRgb(css: string) {
  const m = css.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const p = m[1].split(',').map((s) => parseFloat(s.trim()));
  return [p[0], p[1], p[2], p[3] ?? 1] as [number, number, number, number];
}
function luminance([r, g, b]: number[]) {
  const n = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * n[0] + 0.7152 * n[1] + 0.0722 * n[2];
}
function contrast(a: string, b: string) {
  const A = parseRgb(a); const B = parseRgb(b);
  if (!A || !B) return 0;
  const [hi, lo] = [luminance(A), luminance(B)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

async function setTheme(page, mode: 'dark' | 'light') {
  await page.evaluate((m) => {
    document.documentElement.classList.toggle('dark', m === 'dark');
    document.documentElement.setAttribute('data-theme', m);
    try {
      localStorage.setItem('theme', m);
      localStorage.setItem('vite-ui-theme', m);
    } catch {}
  }, mode);
}

test.describe('Liturgia — troca dinâmica de tema (sem reload) preserva contraste e layout', () => {
  for (const vp of VIEWPORTS) {
    test(`alternância dark↔light em ${vp.name}`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        hasTouch: true,
      });
      const page = await context.newPage();
      await page.goto('/liturgia');
      await page.waitForLoadState('networkidle');

      const tablist = page.getByRole('tablist', { name: /Navegação da Liturgia/i });
      const tabs = page.getByRole('tab');
      await tablist.scrollIntoViewIfNeeded();

      const initialBox = await tablist.boundingBox();

      for (const mode of ['dark', 'light', 'dark', 'light'] as const) {
        await setTheme(page, mode);
        await page.waitForTimeout(120);

        // Ativa a aba do meio para ter estado consistente
        await tabs.nth(1).click();
        await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');

        // Contraste AA em cada aba
        for (let i = 0; i < 3; i++) {
          const s = await tabs.nth(i).evaluate((el) => {
            const cs = getComputedStyle(el);
            return { bg: cs.backgroundColor, color: cs.color };
          });
          const ratio = contrast(s.color, s.bg);
          expect(
            ratio,
            `${vp.name} [${mode}] aba ${i} contraste ${ratio.toFixed(2)}:1`,
          ).toBeGreaterThanOrEqual(4.5);
        }

        // Layout estável (tablist não sofre shift ao trocar tema)
        const b = await tablist.boundingBox();
        if (initialBox && b) {
          expect(Math.abs(b.x - initialBox.x)).toBeLessThanOrEqual(1);
          expect(Math.abs(b.y - initialBox.y)).toBeLessThanOrEqual(1);
          expect(Math.abs(b.width - initialBox.width)).toBeLessThanOrEqual(1);
          expect(Math.abs(b.height - initialBox.height)).toBeLessThanOrEqual(1);
        }

        // Sem overflow horizontal
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
        );
        expect(overflow, `${vp.name} [${mode}] overflow`).toBe(false);
      }

      await context.close();
    });
  }
});
