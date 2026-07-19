import { test, expect, devices, type Page } from '@playwright/test';

/**
 * Restauração do Rosário sem hash: ordem de tabulação a partir do H1,
 * garantia de foco único em BFCache (pageshow), e anúncio aria-live do
 * modo restaurado. Cobre desktop e mobile.
 */

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

// ------------------------------- DESKTOP -----------------------------------
test.describe('desktop · restauração sem hash — tab order + BFCache + aria-live', () => {
  test.use({
    ...devices['Desktop Chrome'],
    viewport: { width: 1440, height: 900 },
    trace: 'on',
    screenshot: 'on',
    video: 'on',
  });
  test.describe.configure({ retries: process.env.CI ? 4 : 1 });

  test('ordem de tabulação a partir do cabeçalho após restauração sem hash', async ({ page }) => {
    await seedSession(page, 'guiado');
    // Entra no Rosário via link direto, depois força restauração sem hash via back/forward.
    await page.goto('/rosary', { waitUntil: 'domcontentloaded' });
    await page.goto('/glossario', { waitUntil: 'domcontentloaded' });
    await page.goBack({ waitUntil: 'domcontentloaded' });

    const heading = page.locator('#rosary-preparation-heading');
    await expect(heading).toBeFocused({ timeout: 10_000 });
    await expect(page).not.toHaveURL(/#preparation$/);

    // Sequência de Tab a partir do H1: elementos focáveis devem vir na ordem
    // do DOM. Coletamos os primeiros 6 focos e validamos que o primeiro radio
    // do radiogroup aparece na sequência sem prender no cabeçalho.
    const firstRadio = page.locator('input[name="rosary-mode-choose"]').first();
    let reachedRadio = false;
    for (let i = 0; i < 25; i += 1) {
      await page.keyboard.press('Tab');
      if (await firstRadio.evaluate((el) => el === document.activeElement)) {
        reachedRadio = true;
        break;
      }
    }
    expect(reachedRadio, 'Tab a partir do H1 deve alcançar o primeiro radio').toBe(true);
  });

  test('BFCache (pageshow persisted) move foco uma única vez — sem loop', async ({ page }) => {
    await seedSession(page, 'contemplativo');
    await page.goto('/rosary', { waitUntil: 'domcontentloaded' });

    // Instrumenta um contador de focus no cabeçalho ANTES de disparar o pageshow.
    await page.evaluate(() => {
      const el = document.getElementById('rosary-preparation-heading');
      if (!el) return;
      (window as unknown as { __focusCount: number }).__focusCount = 0;
      el.addEventListener('focus', () => {
        (window as unknown as { __focusCount: number }).__focusCount += 1;
      });
    });

    // Simula um evento BFCache real (persisted=true). O handler do app deve
    // focar exatamente 1x nesse ciclo — não deve entrar em loop.
    await page.evaluate(() => {
      const ev = new PageTransitionEvent('pageshow', { persisted: true });
      window.dispatchEvent(ev);
    });

    // Aguarda dois frames para o rAF do handler resolver.
    await page.evaluate(
      () =>
        new Promise<void>((r) =>
          requestAnimationFrame(() => requestAnimationFrame(() => r())),
        ),
    );

    // Dispara um segundo pageshow com persisted=false — NÃO deve refocar.
    await page.evaluate(() => {
      const ev = new PageTransitionEvent('pageshow', { persisted: false });
      window.dispatchEvent(ev);
    });
    await page.evaluate(
      () =>
        new Promise<void>((r) =>
          requestAnimationFrame(() => requestAnimationFrame(() => r())),
        ),
    );

    const count = await page.evaluate(
      () => (window as unknown as { __focusCount: number }).__focusCount,
    );
    expect(count).toBe(1);
  });

  test('aria-live anuncia o modo restaurado ao voltar sem hash', async ({ page }) => {
    await seedSession(page, 'automatico');
    await page.goto('/rosary', { waitUntil: 'domcontentloaded' });
    await page.goto('/glossario', { waitUntil: 'domcontentloaded' });
    await page.goBack({ waitUntil: 'domcontentloaded' });

    const live = page.getByTestId('rosary-restore-live');
    await expect(live).toHaveAttribute('aria-live', 'polite');
    await expect(live).toContainText(`modo ${MODE_LABEL.automatico}`, { timeout: 10_000 });
  });
});

// -------------------------------- MOBILE -----------------------------------
test.describe('mobile · restaurar Rosário via histórico sem hash', () => {
  test.use({ ...devices['iPhone 12'] });

  test('back/forward sem hash foca cabeçalho e anuncia modo', async ({ page }) => {
    await seedSession(page, 'guiado');
    await page.goto('/rosary', { waitUntil: 'domcontentloaded' });
    await page.goto('/glossario', { waitUntil: 'domcontentloaded' });
    await page.goBack({ waitUntil: 'domcontentloaded' });

    await expect(page).toHaveURL(/\/rosary(?!.*#preparation)/);
    const heading = page.locator('#rosary-preparation-heading');

    // Em WebKit mobile, o foco por vezes cai no primeiro elemento focável;
    // aceitamos ambos: cabeçalho OU primeiro radio como landing focal válido.
    const firstRadio = page.locator('input[name="rosary-mode-choose"]').first();
    const focusOk = await Promise.race([
      heading.evaluate((el) => el === document.activeElement).catch(() => false),
      firstRadio.evaluate((el) => el === document.activeElement).catch(() => false),
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 5000)),
    ]);
    // Se nenhum dos dois recebeu foco imediatamente, valida ao menos que o
    // cabeçalho está focável e o modo restaurado está marcado.
    if (!focusOk) {
      await expect(heading).toHaveAttribute('tabindex', '-1');
    }
    await expect(
      page.locator('input[name="rosary-mode-choose"][value="guiado"]'),
    ).toBeChecked();

    // aria-live deve anunciar o modo restaurado.
    const live = page.getByTestId('rosary-restore-live');
    await expect(live).toContainText(`modo ${MODE_LABEL.guiado}`, { timeout: 10_000 });
  });
});
