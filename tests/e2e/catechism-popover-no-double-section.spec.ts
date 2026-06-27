import { test, expect, devices } from '@playwright/test';

/**
 * E2E: garante que, ao renderizar uma resposta da Logos contendo "CIC §§2053",
 * o popover do catecismo aparece com label EXATA "§2053" (sem duplicação).
 * Cobre desktop e mobile para validar clique/hover em ambos os viewports.
 */

const FIXTURE_PATH = '/__test/theological-text?text=' +
  encodeURIComponent('De acordo com CIC §§2053 a vida moral floresce.');

async function assertNoDoubleSection(page: import('@playwright/test').Page) {
  const body = (await page.locator('body').innerText()).normalize('NFC');
  expect(body).not.toMatch(/§§/);
}

test.describe('Catechism popover - formato §N sem duplicação', () => {
  test('desktop: popover do CIC §2053 abre e exibe label exata', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(FIXTURE_PATH);

    const trigger = page.getByRole('button', { name: '§2053', exact: true });
    await expect(trigger).toBeVisible();
    await assertNoDoubleSection(page);

    await trigger.click();
    await expect(page.getByText(/CIC §2053/)).toBeVisible();
    // Conteúdo do popover não deve conter §§ em momento algum
    await assertNoDoubleSection(page);
  });

  test.describe('mobile', () => {
    test.use({ ...devices['Pixel 5'] });
    test('mobile: clique no §2053 abre popover sem texto duplicado', async ({ page }) => {
      await page.goto(FIXTURE_PATH);
      const trigger = page.getByRole('button', { name: '§2053', exact: true });
      await expect(trigger).toBeVisible();
      await assertNoDoubleSection(page);

      await trigger.tap();
      await expect(page.getByText(/CIC §2053/)).toBeVisible();
      await assertNoDoubleSection(page);
    });
  });
});
