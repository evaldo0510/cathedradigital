import { test, expect, devices, type Page } from '@playwright/test';

/**
 * Desktop — back/forward, aria-label por modo e Tab do H1 → radiogroup
 * após "Voltar ao Rosário".
 *
 * Complementa desktop-glossary-return-rosary-focus.spec.ts cobrindo:
 *   1) navegação nativa (back/forward) preservando modo restaurado e hash limpo;
 *   2) aria-label do botão sticky refletindo o modo salvo, e mudando quando
 *      o modo persistido é alternado;
 *   3) sequência real de Tab do cabeçalho da preparação até o primeiro radio
 *      do radiogroup de escolha de modo.
 */

test.use({
  ...devices['Desktop Chrome'],
  viewport: { width: 1440, height: 900 },
  // Foco/histórico é sensível a timing entre browsers no CI — mantém trace
  // e vídeo em todas as execuções desta suíte para diagnóstico rápido.
  trace: 'on',
  screenshot: 'on',
  video: 'on',
});
// Retries adicionais só para cenários de foco/back-forward, que dependem
// de rAF + eventos assíncronos (popstate/pageshow) e podem ser flakey no CI.
test.describe.configure({ retries: process.env.CI ? 4 : 1 });

const ROSARY_RETURN_KEY = 'cathedra:rosary:return';
const DEVOTIONAL_KEY = 'cathedra:devotional-progress:rosary';

type Mode = 'contemplativo' | 'guiado' | 'automatico';
const MODE_LABEL: Record<Mode, string> = {
  contemplativo: 'Contemplativo',
  guiado: 'Guiado',
  automatico: 'Automático',
};

async function seedSession(page: Page, mode: Mode) {
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

async function overrideReturnMode(page: Page, mode: Mode) {
  await page.evaluate(
    ({ mode, returnKey }) => {
      const raw = window.sessionStorage.getItem(returnKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      parsed.mode = mode;
      parsed.updatedAt = new Date().toISOString();
      window.sessionStorage.setItem(returnKey, JSON.stringify(parsed));
    },
    { mode, returnKey: ROSARY_RETURN_KEY },
  );
}

test.describe('desktop · back/forward + aria-label por modo + Tab a11y', () => {
  test('back/forward após restaurar mantém modo e hash limpo', async ({ page }) => {
    await seedSession(page, 'guiado');
    await page.goto('/glossario', { waitUntil: 'domcontentloaded' });

    await page.getByTestId('rosary-return-button').click();
    await page.waitForURL(/\/rosary\b/);
    const heading = page.locator('#rosary-preparation-heading');
    await expect(heading).toBeFocused({ timeout: 10_000 });
    await expect(page).not.toHaveURL(/#preparation$/);
    await expect(
      page.locator('input[name="rosary-mode-choose"][value="guiado"]'),
    ).toBeChecked();

    // Back → volta ao Glossário; Forward → retorna ao Rosário.
    await page.goBack({ waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/glossario/);
    await expect(page.getByTestId('rosary-return-button')).toBeVisible();

    await page.goForward({ waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/rosary\b/);
    await expect(page).not.toHaveURL(/#preparation$/);
    // Modo persistido continua marcado após forward.
    await expect(
      page.locator('input[name="rosary-mode-choose"][value="guiado"]'),
    ).toBeChecked();
  });

  for (const mode of ['contemplativo', 'guiado', 'automatico'] as const) {
    test(`aria-label do botão contém modo "${MODE_LABEL[mode]}"`, async ({ page }) => {
      await seedSession(page, mode);
      await page.goto('/glossario', { waitUntil: 'domcontentloaded' });

      const btn = page.getByTestId('rosary-return-button');
      await expect(btn).toBeVisible();
      await expect(btn).toHaveAttribute('data-mode', mode);
      const label = await btn.getAttribute('aria-label');
      expect(label).toContain(`modo ${MODE_LABEL[mode]}`);
    });
  }

  test('alternar o modo persistido atualiza o aria-label do botão', async ({ page }) => {
    await seedSession(page, 'guiado');
    await page.goto('/glossario', { waitUntil: 'domcontentloaded' });

    const btn = page.getByTestId('rosary-return-button');
    await expect(btn).toHaveAttribute('data-mode', 'guiado');
    expect(await btn.getAttribute('aria-label')).toContain('modo Guiado');

    await overrideReturnMode(page, 'automatico');
    await page.reload({ waitUntil: 'domcontentloaded' });

    const btn2 = page.getByTestId('rosary-return-button');
    await expect(btn2).toHaveAttribute('data-mode', 'automatico');
    expect(await btn2.getAttribute('aria-label')).toContain('modo Automático');
    expect(await btn2.getAttribute('aria-label')).not.toContain('modo Guiado');
  });

  test('Tab a partir do cabeçalho alcança o primeiro radio do radiogroup', async ({ page }) => {
    await seedSession(page, 'contemplativo');
    await page.goto('/glossario', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('rosary-return-button').click();
    await page.waitForURL(/\/rosary\b/);

    const heading = page.locator('#rosary-preparation-heading');
    await expect(heading).toBeFocused({ timeout: 10_000 });

    const firstRadio = page.locator('input[name="rosary-mode-choose"]').first();
    await expect(firstRadio).toBeVisible();

    // Tabula avançando; limite alto porque pode haver skip-links/nav antes.
    const MAX_TABS = 40;
    let reached = false;
    for (let i = 0; i < MAX_TABS; i += 1) {
      await page.keyboard.press('Tab');
      if (await firstRadio.evaluate((el) => el === document.activeElement)) {
        reached = true;
        break;
      }
    }
    expect(reached, `primeiro radio não recebeu foco em ${MAX_TABS} Tabs`).toBe(true);
    await expect(firstRadio).toBeFocused();
  });

  test('Shift+Tab a partir do radiogroup volta até o cabeçalho', async ({ page }) => {
    await seedSession(page, 'guiado');
    await page.goto('/glossario', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('rosary-return-button').click();
    await page.waitForURL(/\/rosary\b/);

    const heading = page.locator('#rosary-preparation-heading');
    await expect(heading).toBeFocused({ timeout: 10_000 });

    // Foca o primeiro radio programaticamente e Shift+Tab de volta.
    const firstRadio = page.locator('input[name="rosary-mode-choose"]').first();
    await firstRadio.focus();
    await expect(firstRadio).toBeFocused();

    const MAX_SHIFT_TABS = 40;
    let reachedHeading = false;
    for (let i = 0; i < MAX_SHIFT_TABS; i += 1) {
      await page.keyboard.press('Shift+Tab');
      if (await heading.evaluate((el) => el === document.activeElement)) {
        reachedHeading = true;
        break;
      }
    }
    expect(
      reachedHeading,
      `Shift+Tab a partir do primeiro radio não retornou ao cabeçalho em ${MAX_SHIFT_TABS} tentativas`,
    ).toBe(true);
    await expect(heading).toBeFocused();
  });
});
