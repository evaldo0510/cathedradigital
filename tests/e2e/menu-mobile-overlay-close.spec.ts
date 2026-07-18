import { test, expect, devices } from '@playwright/test';

/**
 * Menu mobile · fechar via overlay:
 * - Clicar fora do drawer (na região do backdrop) fecha a Sidebar.
 * - O foco deve retornar EXATAMENTE ao botão que abriu (menu-trigger).
 */

test.use({ ...devices['Pixel 5'], viewport: { width: 393, height: 851 } });

test('overlay: clicar fora do drawer fecha e devolve foco ao menu-trigger', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const trigger = page.getByTestId('menu-trigger');
  await expect(trigger).toBeVisible({ timeout: 10000 });
  await trigger.focus();
  await trigger.click();

  const dialog = page.getByRole('dialog', { name: /Menu de navegação|navigation_menu/i });
  await expect(dialog).toBeVisible({ timeout: 5000 });

  // A Sidebar tem largura w-[min(280px,85vw)]. Em 393px de largura, drawer ≈ 280px.
  // Clicamos bem à direita, na área do overlay, evitando o drawer e o BottomNav.
  const viewport = page.viewportSize()!;
  await page.mouse.click(viewport.width - 20, Math.floor(viewport.height / 2));

  await expect(dialog).toBeHidden({ timeout: 5000 });

  // Foco deve voltar exatamente ao menu-trigger.
  const triggerHandle = await trigger.elementHandle();
  const isFocused = await page.evaluate((el) => el === document.activeElement, triggerHandle);
  expect(isFocused, 'menu-trigger deve receber foco após clicar no overlay').toBe(true);
});
