import { test, expect } from '@playwright/test';

/**
 * Alterna dark/light e navega entre abas (clique + teclado) confirmando
 * ausência de erros e warnings no console durante o processo em mobile
 * e tablet.
 */

const VIEWPORTS = [
  { name: 'mobile-portrait-390x844', width: 390, height: 844 },
  { name: 'tablet-portrait-768x1024', width: 768, height: 1024 },
];

// Ruídos conhecidos de infraestrutura (hospedagem Lovable, HMR) que não são bugs do app.
const IGNORED = [
  /Unknown message type: RESET_BLANK_CHECK/i,
  /\[vite\]/i,
  /Download the React DevTools/i,
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

test.describe('Liturgia — console limpo ao alternar tema + abas (clique e teclado)', () => {
  for (const vp of VIEWPORTS) {
    for (const interaction of ['click', 'keyboard'] as const) {
      test(`sem erros/warnings em ${vp.name} via ${interaction}`, async ({ browser }) => {
        const context = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          hasTouch: interaction === 'click',
        });
        const page = await context.newPage();

        const messages: Array<{ type: string; text: string }> = [];
        page.on('console', (msg) => {
          const type = msg.type();
          if (type !== 'error' && type !== 'warning') return;
          const text = msg.text();
          if (IGNORED.some((re) => re.test(text))) return;
          messages.push({ type, text });
        });
        page.on('pageerror', (err) => {
          messages.push({ type: 'pageerror', text: err.message });
        });

        await page.goto('/liturgia');
        await page.waitForLoadState('networkidle');

        const tablist = page.getByRole('tablist', { name: /Navegação da Liturgia/i });
        await expect(tablist).toBeVisible();
        await tablist.scrollIntoViewIfNeeded();

        const tabs = page.getByRole('tab');
        const count = await tabs.count();
        const themes: Array<'dark' | 'light'> = ['dark', 'light', 'dark', 'light'];

        for (let i = 0; i < themes.length; i += 1) {
          await setTheme(page, themes[i]);
          await page.waitForTimeout(120);
          const target = i % count;
          if (interaction === 'click') {
            await tabs.nth(target).click();
          } else {
            await tabs.first().focus();
            for (let k = 0; k < target; k += 1) await page.keyboard.press('ArrowRight');
            await page.keyboard.press('Enter');
          }
          await expect(tabs.nth(target)).toHaveAttribute('aria-selected', 'true');
          await page.waitForTimeout(150);
        }

        expect(
          messages,
          `mensagens de console indesejadas (${vp.name}/${interaction}): ${JSON.stringify(messages, null, 2)}`,
        ).toEqual([]);

        await context.close();
      });
    }
  }
});
