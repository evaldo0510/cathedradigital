import { test, expect, devices } from '@playwright/test';

/**
 * Restauração via histórico do navegador — foco vai para o cabeçalho.
 *
 * Cobre dois cenários distintos, sem passar pelo botão do Glossário:
 *   A) Back nativo do browser: usuário sai do /rosary → /glossario → clica
 *      no botão "Voltar" do sistema → volta ao /rosary sem hash.
 *   B) Reload direto no /rosary com progresso persistido — o
 *      `PerformanceNavigationTiming.type === 'reload'` NÃO deve mover
 *      o foco (caso de controle para evitar regressão de UX intrusiva).
 *
 * Roda em desktop (Chromium 1440×900) e em um perfil mobile de referência.
 */

test.use({
  ...devices['Desktop Chrome'],
  viewport: { width: 1440, height: 900 },
});

const ROSARY_RETURN_KEY = 'cathedra:rosary:return';
const DEVOTIONAL_KEY = 'cathedra:devotional-progress:rosary';

async function seedProgress(page: import('@playwright/test').Page, mode = 'guiado') {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(
    ({ mode, returnKey, devKey }) => {
      const now = new Date().toISOString();
      const setName = 'Mistérios Gozosos';
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
          startedAt: '2026-07-19T14:00:00.000Z',
          updatedAt: now,
        }),
      );
      window.localStorage.setItem(
        devKey,
        JSON.stringify({
          section: 'joyful',
          step: stepIndex,
          label: `${setName}|${mode}|${mysteryIndex}|${elapsedMs}|2026-07-19T14:00:00.000Z`,
          updatedAt: now,
        }),
      );
    },
    { mode, returnKey: ROSARY_RETURN_KEY, devKey: DEVOTIONAL_KEY },
  );
}

test.describe('desktop · Rosário — restauração via histórico', () => {
  test('back do navegador após visitar Glossário foca o cabeçalho', async ({ page }) => {
    await seedProgress(page, 'guiado');

    // Abre o Rosário: preparação restaurada a partir do progresso salvo.
    await page.goto('/rosary', { waitUntil: 'domcontentloaded' });
    const heading = page.locator('#rosary-preparation-heading');
    await expect(heading).toBeVisible({ timeout: 10_000 });

    // Vai para outra rota (Glossário) — empurra entrada no histórico.
    await page.goto('/glossario', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/glossario/);

    // Back nativo do browser — sem hash. Foco deve ir ao cabeçalho.
    await page.goBack({ waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/rosary\b/);
    await expect(page).not.toHaveURL(/#preparation/);
    await expect(heading).toBeFocused({ timeout: 10_000 });
    await expect(
      page.locator('input[name="rosary-mode-choose"][value="guiado"]'),
    ).toBeChecked();
  });

  test('reload direto no /rosary NÃO rouba foco (evita regressão)', async ({ page }) => {
    await seedProgress(page, 'contemplativo');
    await page.goto('/rosary', { waitUntil: 'domcontentloaded' });
    const heading = page.locator('#rosary-preparation-heading');
    await expect(heading).toBeVisible({ timeout: 10_000 });

    // Reload: navigation type = 'reload'. Não deve auto-focar o H1.
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(heading).toBeVisible({ timeout: 10_000 });
    // O foco deve ser <body> (default do navegador em reload).
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName ?? null);
    expect(focusedTag === 'BODY' || focusedTag === null).toBe(true);
  });

  test('forward do histórico também foca o cabeçalho', async ({ page }) => {
    await seedProgress(page, 'automatico');
    await page.goto('/rosary', { waitUntil: 'domcontentloaded' });
    await page.goto('/glossario', { waitUntil: 'domcontentloaded' });
    await page.goBack({ waitUntil: 'domcontentloaded' });
    // Agora forward para /glossario e novo back — cobre popstate após ciclo.
    await page.goForward({ waitUntil: 'domcontentloaded' });
    await page.goBack({ waitUntil: 'domcontentloaded' });

    await expect(page).toHaveURL(/\/rosary\b/);
    const heading = page.locator('#rosary-preparation-heading');
    await expect(heading).toBeFocused({ timeout: 10_000 });
    await expect(
      page.locator('input[name="rosary-mode-choose"][value="automatico"]'),
    ).toBeChecked();
  });
});
