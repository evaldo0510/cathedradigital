import { test, expect } from '@playwright/test';

/**
 * Popover Nexus: comportamento de fechamento.
 * - Fecha ao clicar fora
 * - Fecha ao pressionar Escape
 */

async function openFirstNexusPopover(page: import('@playwright/test').Page) {
  // Vai para uma página com termos com Nexus (Bíblia — Jo 3)
  await page.goto('/bible?book=Jo&ch=3');
  // Aguarda algum trigger de popover Nexus renderizado
  const trigger = page.locator('[data-nexus-trigger], [data-testid^="nexus-trigger"], [data-testid="catechism-popover-trigger"]').first();
  await expect(trigger).toBeVisible({ timeout: 15_000 });
  await trigger.click();
  const popover = page.locator('[role="dialog"], [data-radix-popper-content-wrapper]').first();
  await expect(popover).toBeVisible({ timeout: 5_000 });
  return popover;
}

test.describe('Nexus popover · fechamento', () => {
  test('fecha ao pressionar Escape', async ({ page }) => {
    const popover = await openFirstNexusPopover(page);
    await page.keyboard.press('Escape');
    await expect(popover).toBeHidden({ timeout: 3_000 });
  });

  test('fecha ao clicar fora', async ({ page }) => {
    const popover = await openFirstNexusPopover(page);
    // Clique num canto seguro fora do popover
    await page.mouse.click(5, 5);
    await expect(popover).toBeHidden({ timeout: 3_000 });
  });
});
