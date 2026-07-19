import { test, expect } from '@playwright/test';

/**
 * Garante que ao alternar dark/light e navegar entre abas via teclado:
 * - o foco visível permanece no elemento correto (aba ativada)
 * - o roving tabindex continua coerente: exatamente uma aba com tabindex=0
 *   e todas as demais com tabindex=-1 após cada troca.
 */

const VIEWPORTS = [
  { name: 'mobile-portrait-390x844', width: 390, height: 844 },
  { name: 'tablet-portrait-768x1024', width: 768, height: 1024 },
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

async function readTabindexes(page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('[role="tab"]')).map((el) => el.getAttribute('tabindex')),
  );
}

test.describe('Liturgia — foco visível + roving tabindex ao alternar tema + abas (teclado)', () => {
  for (const vp of VIEWPORTS) {
    test(`coerência em ${vp.name}`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      const page = await context.newPage();
      await page.goto('/liturgia');
      await page.waitForLoadState('networkidle');

      const tablist = page.getByRole('tablist', { name: /Navegação da Liturgia/i });
      await expect(tablist).toBeVisible();
      await tablist.scrollIntoViewIfNeeded();

      const tabs = page.getByRole('tab');
      const count = await tabs.count();
      expect(count).toBeGreaterThan(1);

      const themes: Array<'dark' | 'light'> = ['dark', 'light', 'dark', 'light'];

      for (let i = 0; i < themes.length; i += 1) {
        await setTheme(page, themes[i]);
        await page.waitForTimeout(120);

        const target = i % count;
        await tabs.first().focus();
        for (let k = 0; k < target; k += 1) await page.keyboard.press('ArrowRight');
        await page.keyboard.press('Enter');

        // aria-selected na aba correta.
        await expect(tabs.nth(target)).toHaveAttribute('aria-selected', 'true');

        // Foco visível no elemento correto.
        const focusedIndex = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el) return -1;
          return Array.from(document.querySelectorAll('[role="tab"]')).indexOf(el as Element);
        });
        expect(focusedIndex, `foco deve estar na aba ${target} (${vp.name}, ${themes[i]})`).toBe(target);

        const focusVisible = await tabs.nth(target).evaluate((el) => {
          try { return el.matches(':focus-visible'); } catch { return false; }
        });
        expect(focusVisible, `focus-visible ausente na aba ${target} (${vp.name}, ${themes[i]})`).toBe(true);

        // Roving tabindex: exatamente uma aba com tabindex="0", demais com "-1".
        const indexes = await readTabindexes(page);
        const zeros = indexes.filter((v) => v === '0').length;
        const minusOnes = indexes.filter((v) => v === '-1').length;
        expect(zeros, `esperava 1 tab com tabindex=0 (${vp.name}, ${themes[i]}) — got ${JSON.stringify(indexes)}`).toBe(1);
        expect(minusOnes, `demais tabs devem ter tabindex=-1 (${vp.name}, ${themes[i]}) — got ${JSON.stringify(indexes)}`).toBe(count - 1);
        expect(indexes[target], `a aba ativa (${target}) deve ter tabindex=0`).toBe('0');
      }

      await context.close();
    });
  }
});
