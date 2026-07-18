import { test, expect, devices } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Acessibilidade do menu mobile:
 * - Focus trap: Tab não escapa do dialog.
 * - Foco inicial ao abrir.
 * - Restauração precisa do foco no menu-trigger após fechar (ESC e X).
 * - Ativação por teclado dos itens.
 * - Axe: zero violações críticas no drawer aberto.
 */

test.use({ ...devices['Pixel 5'], viewport: { width: 393, height: 851 } });

async function openSidebar(page: import('@playwright/test').Page) {
  const trigger = page.getByTestId('menu-trigger');
  await expect(trigger).toBeVisible({ timeout: 10000 });
  await trigger.focus();
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: /Menu de navegação|navigation_menu/i });
  await expect(dialog).toBeVisible({ timeout: 5000 });
  return { trigger, dialog };
}

test.describe('Menu mobile · acessibilidade', () => {
  test('foco inicial cai dentro do dialog ao abrir', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const { dialog } = await openSidebar(page);
    await page.waitForTimeout(300);

    const focusedInsideDialog = await dialog.evaluate((el) => el.contains(document.activeElement));
    expect(focusedInsideDialog, 'foco inicial deve estar dentro do dialog').toBe(true);
  });

  test('focus trap: Tab não escapa do dialog', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const { dialog } = await openSidebar(page);
    await page.waitForTimeout(300);

    // Tabula 25 vezes; o foco deve permanecer dentro do dialog em todas.
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press('Tab');
      const inside = await dialog.evaluate((el) => el.contains(document.activeElement));
      expect(inside, `foco escapou do dialog no Tab #${i + 1}`).toBe(true);
    }

    // Shift+Tab também respeita o trap.
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Shift+Tab');
      const inside = await dialog.evaluate((el) => el.contains(document.activeElement));
      expect(inside, `foco escapou do dialog no Shift+Tab #${i + 1}`).toBe(true);
    }
  });

  test('foco retorna ao menu-trigger após fechar via ESC', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const { trigger, dialog } = await openSidebar(page);

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden({ timeout: 5000 });

    const triggerHandle = await trigger.elementHandle();
    const isFocused = await page.evaluate((el) => el === document.activeElement, triggerHandle);
    expect(isFocused, 'menu-trigger deve receber foco após ESC').toBe(true);
  });

  test('foco retorna ao menu-trigger após fechar via botão X', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const { trigger, dialog } = await openSidebar(page);

    await page.getByRole('button', { name: /Fechar menu/i }).click();
    await expect(dialog).toBeHidden({ timeout: 5000 });

    const triggerHandle = await trigger.elementHandle();
    const isFocused = await page.evaluate((el) => el === document.activeElement, triggerHandle);
    expect(isFocused, 'menu-trigger deve receber foco após clicar em X').toBe(true);
  });

  test('Enter/Space ativam itens da navegação', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const { dialog } = await openSidebar(page);
    await page.waitForTimeout(300);

    // Foca o primeiro item de navegação e ativa com Enter.
    const firstNavItem = dialog.getByRole('button').filter({ hasText: /Bíblia|Orações|Buscar|Jornadas|Hoje/i }).first();
    await firstNavItem.focus();
    await Promise.all([
      page.waitForURL((url) => url.pathname !== '/', { timeout: 15000 }),
      page.keyboard.press('Enter'),
    ]);
    expect(new URL(page.url()).pathname).not.toBe('/');
  });

  test('axe: sem violações críticas no dialog aberto', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await openSidebar(page);
    await page.waitForTimeout(400);

    const results = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .disableRules(['color-contrast']) // já coberto por suíte dedicada
      .analyze();

    const critical = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    expect(critical, `violações axe: ${critical.map((v) => v.id).join(', ')}`).toHaveLength(0);
  });
});

/**
 * Contrato de restauração de foco após ESC, parametrizado por viewport mobile.
 * Adicione novas larguras aqui — o mesmo teste roda em todas.
 */
const MOBILE_VIEWPORTS = [
  { label: 'iPhone SE', device: devices['iPhone SE'], width: 320, height: 568 },
  { label: 'iPhone 13', device: devices['iPhone 13'], width: 390, height: 844 },
] as const;

for (const vp of MOBILE_VIEWPORTS) {
  test.describe(`Menu mobile · acessibilidade · ${vp.label} (${vp.width}x${vp.height})`, () => {
    test.use({ ...vp.device, viewport: { width: vp.width, height: vp.height } });

    test(`foco retorna exatamente ao menu-trigger após ESC (${vp.label})`, async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      const { trigger, dialog } = await openSidebar(page);

      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden({ timeout: 5000 });

      // 1) Identidade do nó: activeElement === trigger.
      const triggerHandle = await trigger.elementHandle();
      const isSameNode = await page.evaluate((el) => el === document.activeElement, triggerHandle);
      expect(isSameNode, `activeElement deve ser o próprio menu-trigger em ${vp.label}`).toBe(true);

      // 2) Verificação semântica: data-testid do elemento focado.
      const focusedTestId = await page.evaluate(
        () => (document.activeElement as HTMLElement | null)?.getAttribute('data-testid') ?? null,
      );
      expect(focusedTestId, `data-testid do elemento focado em ${vp.label}`).toBe('menu-trigger');
    });

    test(`focus trap: Tab/Shift+Tab não escapam do dialog (${vp.label})`, async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      const { dialog } = await openSidebar(page);
      await page.waitForTimeout(300);

      for (let i = 0; i < 25; i++) {
        await page.keyboard.press('Tab');
        const inside = await dialog.evaluate((el) => el.contains(document.activeElement));
        expect(inside, `[${vp.label}] foco escapou do dialog no Tab #${i + 1}`).toBe(true);
      }

      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Shift+Tab');
        const inside = await dialog.evaluate((el) => el.contains(document.activeElement));
        expect(inside, `[${vp.label}] foco escapou do dialog no Shift+Tab #${i + 1}`).toBe(true);
      }
    });
  });
}
