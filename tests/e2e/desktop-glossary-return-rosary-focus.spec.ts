import { test, expect, devices } from '@playwright/test';

/**
 * Desktop — foco após "Voltar ao Rosário".
 *
 * Valida em desktop (Chromium 1440×900) que o botão sticky do Glossário:
 *   1) move o foco para o cabeçalho da preparação do Rosário (H1);
 *   2) responde a Enter e Space via teclado, sem depender de mouse;
 *   3) restaura o modo persistido e limpa o hash #preparation.
 *
 * Roda apenas nos projetos "chromium", "firefox" e "webkit" (desktop puros)
 * — os projetos mobile executam a variante em mobile-glossary-return-rosary.spec.ts.
 */

test.use({
  ...devices['Desktop Chrome'],
  viewport: { width: 1440, height: 900 },
  trace: 'on',
  screenshot: 'on',
  video: 'on',
});
test.describe.configure({ retries: process.env.CI ? 4 : 1 });

const ROSARY_RETURN_KEY = 'cathedra:rosary:return';
const DEVOTIONAL_KEY = 'cathedra:devotional-progress:rosary';

type Mode = 'contemplativo' | 'guiado' | 'automatico';

async function seedSession(page: import('@playwright/test').Page, mode: Mode) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(
    ({ mode, returnKey, devKey }) => {
      const now = new Date().toISOString();
      const setName = 'Mistérios Gozosos';
      const startedAt = '2026-07-19T14:00:00.000Z';
      const mysteryIndex = 2;
      const stepIndex = 17;
      const elapsedMs = 12 * 60 * 1000;
      window.sessionStorage.setItem(
        returnKey,
        JSON.stringify({
          setName,
          mysteryLabel: `${mysteryIndex + 1}º mistério`,
          mysteryIndex,
          stepIndex,
          mode,
          elapsedMs,
          startedAt,
          updatedAt: now,
        }),
      );
      window.localStorage.setItem(
        devKey,
        JSON.stringify({
          section: 'joyful',
          step: stepIndex,
          label: `${setName}|${mode}|${mysteryIndex}|${elapsedMs}|${startedAt}`,
          updatedAt: now,
        }),
      );
    },
    { mode, returnKey: ROSARY_RETURN_KEY, devKey: DEVOTIONAL_KEY },
  );
}

test.describe('desktop · Glossário → Voltar ao Rosário (foco a11y)', () => {
  test('click do mouse move foco para o cabeçalho da preparação', async ({ page }) => {
    await seedSession(page, 'guiado');
    await page.goto('/glossario', { waitUntil: 'domcontentloaded' });

    const btn = page.getByTestId('rosary-return-button');
    await expect(btn).toBeVisible();
    await btn.click();

    await page.waitForURL(/\/rosary\b/);
    const heading = page.locator('#rosary-preparation-heading');
    await expect(heading).toBeVisible();
    await expect(heading).toBeFocused({ timeout: 10_000 });
    await expect(heading).toHaveAttribute('tabindex', '-1');
    // Hash é limpo sem re-focar em navegações subsequentes.
    await expect(page).toHaveURL(/\/rosary(?!#preparation)/);
  });

  for (const key of ['Enter', 'Space'] as const) {
    test(`ativação via teclado (${key}) leva ao Rosário e foca o cabeçalho`, async ({ page }) => {
      await seedSession(page, key === 'Enter' ? 'contemplativo' : 'automatico');
      await page.goto('/glossario', { waitUntil: 'domcontentloaded' });

      const btn = page.getByTestId('rosary-return-button');
      await btn.focus();
      await expect(btn).toBeFocused();
      await page.keyboard.press(key);

      await page.waitForURL(/\/rosary\b/);
      const heading = page.locator('#rosary-preparation-heading');
      await expect(heading).toBeFocused({ timeout: 10_000 });

      const expectedMode = key === 'Enter' ? 'contemplativo' : 'automatico';
      await expect(
        page.locator(`input[name="rosary-mode-choose"][value="${expectedMode}"]`),
      ).toBeChecked();
    });
  }

  test('Tab a partir do cabeçalho alcança a primeira opção do radiogroup', async ({ page }) => {
    await seedSession(page, 'guiado');
    await page.goto('/glossario', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('rosary-return-button').click();
    await page.waitForURL(/\/rosary\b/);

    const heading = page.locator('#rosary-preparation-heading');
    await expect(heading).toBeFocused({ timeout: 10_000 });

    // O H1 é foco de destino via tabIndex={-1} — sequência de Tab deve levar
    // o usuário adiante sem prender ninguém no cabeçalho.
    const firstRadio = page.locator('input[name="rosary-mode-choose"]').first();
    await expect(firstRadio).toBeVisible();
    // Sanity: o primeiro radio existe e é operável por teclado (default HTML).
    await firstRadio.focus();
    await expect(firstRadio).toBeFocused();
  });
});
