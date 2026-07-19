import { test, expect } from '@playwright/test';

const TABS = ['Liturgia', 'Missal', 'Calendário'];

const DARK_VIEWPORTS = [
  { name: 'mobile-portrait-390x844', width: 390, height: 844 },
  { name: 'mobile-landscape-844x390', width: 844, height: 390 },
  { name: 'tablet-portrait-768x1024', width: 768, height: 1024 },
  { name: 'tablet-landscape-1024x768', width: 1024, height: 768 },
];

function parseRgb(css) {
  const m = css.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const p = m[1].split(',').map((s) => parseFloat(s.trim()));
  if (p.length < 3) return null;
  return [p[0], p[1], p[2], p[3] ?? 1];
}
function luminance([r, g, b]) {
  const n = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * n[0] + 0.7152 * n[1] + 0.0722 * n[2];
}
function contrast(a, b) {
  const A = parseRgb(a);
  const B = parseRgb(b);
  if (!A || !B) return 0;
  const [hi, lo] = [luminance(A), luminance(B)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

test.describe('Liturgia — abas em dark (mobile + tablet, portrait + landscape)', () => {
  for (const vp of DARK_VIEWPORTS) {
    test(`contraste AA e sem overflow em ${vp.name} [dark]`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        colorScheme: 'dark',
        hasTouch: true,
      });
      const page = await context.newPage();
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

      const tabs = page.getByRole('tab');
      await expect(tabs).toHaveCount(TABS.length);

      for (let i = 0; i < TABS.length; i++) {
        await tabs.nth(i).click();
        await page.waitForTimeout(150);

        const active = tabs.nth(i);
        await expect(active).toHaveAttribute('aria-selected', 'true');

        const style = await active.evaluate((el) => {
          const cs = getComputedStyle(el);
          return { bg: cs.backgroundColor, color: cs.color, shadow: cs.boxShadow };
        });

        // Contraste AA >= 4.5:1
        const ratio = contrast(style.color, style.bg);
        expect(
          ratio,
          `dark ${vp.name} — contraste ${TABS[i]} = ${ratio.toFixed(2)}:1`,
        ).toBeGreaterThanOrEqual(4.5);

        // Sem inversão: inativas não replicam o fundo da ativa
        for (let j = 0; j < TABS.length; j++) {
          if (j === i) continue;
          const inBg = await tabs.nth(j).evaluate((el) => getComputedStyle(el).backgroundColor);
          expect(inBg, `dark ${vp.name} — ${TABS[j]} invertida`).not.toBe(style.bg);
        }

        // Bounding box dentro do viewport
        const box = await active.boundingBox();
        if (box) {
          expect(box.x + box.width).toBeLessThanOrEqual(vp.width + 1);
        }
      }

      // Sem overflow horizontal
      const hOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(hOverflow, `dark ${vp.name} — overflow horizontal`).toBe(false);

      await context.close();
    });
  }
});
