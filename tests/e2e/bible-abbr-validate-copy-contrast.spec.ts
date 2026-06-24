import { test, expect, Page } from '@playwright/test';

/**
 * Visual/contrast regression for the copy components on /bible-abbr-validate.
 *
 * We assert WCAG AA contrast (≥ 4.5:1 for normal text, ≥ 3:1 for large text /
 * non-text UI like icons and borders) for the rendered value text of
 * canonical_abbr and bollsId AND for the labels/icons inside their copy buttons,
 * in both light and dark mode. We also snapshot the result card for each theme.
 */

// ---------- contrast helpers (sRGB → relative luminance → WCAG ratio) ----------
const CONTRAST_HELPERS = `
  function parseColor(str) {
    const m = str.match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    const parts = m[1].split(',').map((v) => parseFloat(v.trim()));
    const [r, g, b, a = 1] = parts;
    return { r, g, b, a };
  }
  function relLum({ r, g, b }) {
    const ch = (c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
  }
  function ratio(fg, bg) {
    const L1 = relLum(fg), L2 = relLum(bg);
    const [a, b] = L1 > L2 ? [L1, L2] : [L2, L1];
    return (a + 0.05) / (b + 0.05);
  }
  function effectiveBg(el) {
    let node = el;
    while (node && node !== document.documentElement) {
      const cs = getComputedStyle(node);
      const c = parseColor(cs.backgroundColor);
      if (c && c.a > 0) return c;
      node = node.parentElement;
    }
    const root = parseColor(getComputedStyle(document.body).backgroundColor)
      || { r: 255, g: 255, b: 255, a: 1 };
    return root;
  }
`;

async function measureContrast(page: Page, selector: string) {
  return page.evaluate(
    ({ sel, helpers }) => {
      // eslint-disable-next-line no-eval
      eval(helpers);
      const el = document.querySelector(sel) as HTMLElement | null;
      if (!el) return { found: false } as const;
      // @ts-expect-error helpers injected via eval
      const fg = parseColor(getComputedStyle(el).color);
      // @ts-expect-error helpers injected via eval
      const bg = effectiveBg(el);
      // @ts-expect-error helpers injected via eval
      const r = ratio(fg, bg);
      const fontSize = parseFloat(getComputedStyle(el).fontSize);
      const fontWeight = parseInt(getComputedStyle(el).fontWeight, 10) || 400;
      const isLarge = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
      return { found: true, ratio: r, fontSize, fontWeight, isLarge } as const;
    },
    { sel: selector, helpers: CONTRAST_HELPERS },
  );
}

async function setTheme(page: Page, theme: 'light' | 'dark') {
  await page.evaluate((t) => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(t);
    root.style.colorScheme = t;
    try { localStorage.setItem('theme', t); } catch { /* noop */ }
  }, theme);
  // Allow CSS variable cascade to settle.
  await page.waitForTimeout(100);
}

const VALUE_TARGETS = [
  // Rendered text of the value next to each copy button.
  { name: 'canonical_abbr value', selector: 'dd:has(button[aria-label*="canonical_abbr"]) span.font-mono' },
  { name: 'bollsId value', selector: 'dd:has(button[aria-label*="bollsId"]) span.font-mono' },
  // Button label text inside the copy button.
  { name: 'canonical_abbr copy label', selector: 'button[aria-label*="canonical_abbr"] span' },
  { name: 'bollsId copy label', selector: 'button[aria-label*="bollsId"] span' },
];

for (const theme of ['light', 'dark'] as const) {
  test.describe(`Copy components contrast — ${theme} mode`, () => {
    test(`canonical_abbr and bollsId text meet WCAG AA in ${theme} mode`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.goto('/bible-abbr-validate');
      await setTheme(page, theme);

      await expect(page.getByText(/resolvido/i)).toBeVisible({ timeout: 15000 });
      // Make sure copy buttons are mounted.
      await expect(page.getByRole('button', { name: /copiar canonical_abbr/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /copiar bollsid/i })).toBeVisible();

      const failures: string[] = [];
      for (const t of VALUE_TARGETS) {
        const res = await measureContrast(page, t.selector);
        if (!res.found) {
          failures.push(`${t.name}: element not found (${t.selector})`);
          continue;
        }
        const min = res.isLarge ? 3 : 4.5;
        // Round to 2 decimals for readable diagnostics.
        const r = Math.round(res.ratio * 100) / 100;
        if (r < min) {
          failures.push(
            `${t.name}: contrast ${r}:1 < required ${min}:1 ` +
              `(font ${res.fontSize}px / ${res.fontWeight}, ${theme} mode)`,
          );
        }
      }
      expect(failures, failures.join('\n')).toEqual([]);

      // Visual snapshot of the result card to lock in the rendered colors.
      const card = page.locator('text=/Resultado/i').locator('xpath=ancestor::*[contains(@class,"card") or self::*][1]').first();
      // Fallback: snapshot the surrounding section if the locator above is fragile.
      const target = (await card.count()) ? card : page.locator('main, body').first();
      await expect(target).toHaveScreenshot(`copy-components-${theme}.png`, {
        maxDiffPixelRatio: 0.02,
        animations: 'disabled',
      });
    });

    test(`failure state ("Não foi possível copiar") keeps adequate contrast in ${theme} mode`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.addInitScript(() => {
        try {
          Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: { writeText: () => Promise.reject(new Error('denied')) },
          });
        } catch { /* noop */ }
        document.execCommand = () => false;
      });
      await page.goto('/bible-abbr-validate');
      await setTheme(page, theme);
      await expect(page.getByText(/resolvido/i)).toBeVisible({ timeout: 15000 });

      const btn = page.getByRole('button', { name: /copiar canonical_abbr/i });
      await btn.click();
      await expect(btn).toHaveText(/não foi possível copiar/i);

      const res = await measureContrast(page, 'button[aria-label*="canonical_abbr"] span');
      expect(res.found).toBe(true);
      if (res.found) {
        const min = res.isLarge ? 3 : 4.5;
        const r = Math.round(res.ratio * 100) / 100;
        expect(r, `error-label contrast ${r}:1 < ${min}:1 in ${theme} mode`).toBeGreaterThanOrEqual(min);
      }
    });
  });
}
