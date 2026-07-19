import { test, expect, devices, type Page } from '@playwright/test';

/**
 * Via Sacra — restauração via histórico sem hash em mobile:
 * - Foco movido exatamente uma vez no BFCache (pageshow persisted=true).
 * - aria-live anuncia o método/estado restaurado ao voltar sem hash.
 * - Cabeçalho recebe foco (ou é focável) sem prender em loop.
 */

const DEVOTIONAL_KEY = 'cathedra:devotional-progress:viacrucis';

async function seedStation(page: Page, station: number) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(
    ({ key, step }) => {
      window.localStorage.setItem(
        key,
        JSON.stringify({
          section: 'station',
          step,
          label: `Estação ${step}`,
          updatedAt: new Date().toISOString(),
        }),
      );
    },
    { key: DEVOTIONAL_KEY, step: station },
  );
}

test.describe('mobile · Via Sacra restaurada via histórico sem hash', () => {
  test.use({
    ...devices['iPhone 12'],
    trace: 'on',
    screenshot: 'on',
    video: 'on',
  });
  test.describe.configure({ retries: process.env.CI ? 4 : 1 });

  test('back/forward sem hash foca cabeçalho e anuncia estado', async ({ page }) => {
    await seedStation(page, 5);
    await page.goto('/viacrucis', { waitUntil: 'domcontentloaded' });
    await page.goto('/glossario', { waitUntil: 'domcontentloaded' });
    await page.goBack({ waitUntil: 'domcontentloaded' });

    await expect(page).toHaveURL(/\/viacrucis(?!.*#via-sacra)/);

    const heading = page.locator('#via-sacra-heading');
    await expect(heading).toHaveAttribute('tabindex', '-1');

    const live = page.getByTestId('via-sacra-restore-live');
    await expect(live).toHaveAttribute('aria-live', 'polite');
    await expect(live).toContainText('Via Sacra restaurada no modo', { timeout: 10_000 });
    await expect(live).toContainText('estação 5 de 14', { timeout: 10_000 });
  });

  test('BFCache (pageshow persisted) move foco EXATAMENTE UMA VEZ', async ({ page }) => {
    await seedStation(page, 3);
    await page.goto('/viacrucis', { waitUntil: 'domcontentloaded' });

    // Aguarda o cabeçalho existir para instrumentar o listener.
    await page.locator('#via-sacra-heading').waitFor({ state: 'attached' });

    // Instrumenta contador de focus no cabeçalho antes de disparar BFCache.
    await page.evaluate(() => {
      const el = document.getElementById('via-sacra-heading');
      if (!el) return;
      (window as unknown as { __focusCount: number }).__focusCount = 0;
      el.addEventListener('focus', () => {
        (window as unknown as { __focusCount: number }).__focusCount += 1;
      });
    });

    // 1º pageshow persisted=true — deve focar UMA vez.
    await page.evaluate(() => {
      const ev = new PageTransitionEvent('pageshow', { persisted: true });
      window.dispatchEvent(ev);
    });
    await page.evaluate(
      () =>
        new Promise<void>((r) =>
          requestAnimationFrame(() => requestAnimationFrame(() => r())),
        ),
    );

    // 2º pageshow persisted=false — NÃO deve refocar.
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
    expect(count, 'BFCache não pode entrar em loop de refoco').toBe(1);
  });
});
