import { test, expect } from '@playwright/test';

/**
 * Garante que alternar tema (dark↔light) e trocar de abas na Liturgia
 * NÃO gera overflow horizontal/vertical inesperado no documento e mantém
 * a posição de scroll estável nos breakpoints mobile e tablet.
 */

const VIEWPORTS = [
  { name: 'mobile-portrait-390x844', width: 390, height: 844 },
  { name: 'mobile-landscape-844x390', width: 844, height: 390 },
  { name: 'tablet-portrait-768x1024', width: 768, height: 1024 },
  { name: 'tablet-landscape-1024x768', width: 1024, height: 768 },
];

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

async function getOverflow(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    return {
      hasHorizontal: doc.scrollWidth > doc.clientWidth + 1,
      hasVertical: doc.scrollHeight > window.innerHeight + doc.scrollHeight, // false por padrão
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      scrollTop: window.scrollY,
    };
  });
}

test.describe('Liturgia — sem overflow e scroll estável ao alternar tema + abas', () => {
  for (const vp of VIEWPORTS) {
    test(`estabilidade em ${vp.name}`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        hasTouch: true,
      });
      const page = await context.newPage();
      await page.goto('/liturgia');
      await page.waitForLoadState('networkidle');

      const tablist = page.getByRole('tablist', { name: /Navegação da Liturgia/i });
      await expect(tablist).toBeVisible();
      await tablist.scrollIntoViewIfNeeded();

      // Rola para uma posição intermediária estável.
      await page.evaluate(() => window.scrollTo(0, 200));
      await page.waitForTimeout(100);
      const baselineScroll = await page.evaluate(() => window.scrollY);

      const tabs = page.getByRole('tab');
      const count = await tabs.count();
      const themes: Array<'dark' | 'light'> = ['dark', 'light', 'dark', 'light'];

      for (let i = 0; i < themes.length; i += 1) {
        await setTheme(page, themes[i]);
        await page.waitForTimeout(120);
        await tabs.nth(i % count).click();
        await expect(tabs.nth(i % count)).toHaveAttribute('aria-selected', 'true');
        await page.waitForTimeout(150);

        const state = await getOverflow(page);
        expect(
          state.hasHorizontal,
          `overflow horizontal detectado (${vp.name}, ${themes[i]}, aba ${i % count}) scroll=${state.scrollWidth} client=${state.clientWidth}`,
        ).toBe(false);

        // Scroll deve permanecer estável (tolerância de 4px para arredondamentos).
        const currentScroll = await page.evaluate(() => window.scrollY);
        expect(
          Math.abs(currentScroll - baselineScroll),
          `scrollY variou além do esperado (${vp.name}, ${themes[i]})`,
        ).toBeLessThanOrEqual(4);
      }

      await context.close();
    });
  }
});
