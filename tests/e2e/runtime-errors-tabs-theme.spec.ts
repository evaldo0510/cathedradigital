import { test, expect } from '@playwright/test';

/**
 * Falha se qualquer uncaught exception ou pageerror ocorrer durante a
 * navegação entre abas da Liturgia e a alternância dark/light, em
 * mobile e tablet. Configurado no CI para rodar também em WebKit.
 */

const VIEWPORTS = [
  { name: 'mobile-390x844', width: 390, height: 844 },
  { name: 'tablet-768x1024', width: 768, height: 1024 },
];

async function setTheme(page, mode: 'dark' | 'light') {
  await page.evaluate((m) => {
    document.documentElement.classList.toggle('dark', m === 'dark');
    document.documentElement.setAttribute('data-theme', m);
    try {
      localStorage.setItem('theme', m);
    } catch {}
  }, mode);
}

test.describe('Runtime — sem uncaught exceptions ao alternar abas + tema', () => {
  for (const vp of VIEWPORTS) {
    test(`${vp.name} navegação + tema não emite pageerror`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      const page = await context.newPage();

      const pageErrors: Error[] = [];
      const consoleErrors: string[] = [];

      page.on('pageerror', (err) => pageErrors.push(err));
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          const text = msg.text();
          // Ruído conhecido (host/HMR) — não é bug do app.
          if (/RESET_BLANK_CHECK|\[vite\]|React DevTools/i.test(text)) return;
          consoleErrors.push(text);
        }
      });

      await page.goto('/liturgia', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle').catch(() => {});

      // Alternar entre as 3 abas 2x, alternando tema em cada passo
      const tabs = page.locator('[role="tab"]');
      const count = await tabs.count();
      expect(count).toBeGreaterThan(0);

      for (let round = 0; round < 2; round++) {
        for (let i = 0; i < count; i++) {
          await tabs.nth(i).click();
          await page.waitForTimeout(150);
          await setTheme(page, i % 2 === 0 ? 'dark' : 'light');
          await page.waitForTimeout(100);
        }
      }

      // Também via teclado (roving tabindex)
      await tabs.first().focus();
      for (let i = 0; i < count; i++) {
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(80);
      }

      // Runtime errors capturados pelo logger devem estar vazios
      const runtimeCount = await page.evaluate(
        () => (window as any).__cathedraRuntimeErrors?.get()?.length ?? 0,
      );

      await context.close();

      expect(
        pageErrors,
        `pageerrors: ${pageErrors.map((e) => e.message).join(' | ')}`,
      ).toHaveLength(0);
      expect(
        consoleErrors,
        `console errors: ${consoleErrors.join(' | ')}`,
      ).toHaveLength(0);
      expect(
        runtimeCount,
        `runtime errors capturados pelo logger: ${runtimeCount}`,
      ).toBe(0);
    });
  }
});
