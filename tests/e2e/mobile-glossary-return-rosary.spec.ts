import { test, expect, devices } from '@playwright/test';

/**
 * Fluxo Glossário → "Voltar ao Rosário".
 *
 * Cobre em mobile:
 *   1) Ausência de 404 no /glossario e no /rosary.
 *   2) O botão sticky de retorno aparece com o modo correto e navega
 *      de volta ao /rosary sem 404.
 *   3) O modo (contemplativo/guiado/automatico) é restaurado
 *      exatamente, junto de mistério, dezena e tempo — em ciclos repetidos.
 *
 * Estratégia: seedamos localStorage (fonte do useDevotionalProgress) e
 * sessionStorage (breadcrumb) antes da navegação. Não depende de auth.
 */

test.use({ ...devices['Pixel 5'], viewport: { width: 393, height: 851 } });

const ROSARY_RETURN_KEY = 'cathedra:rosary:return';
const DEVOTIONAL_KEY = 'cathedra:devotional-progress:rosary';

type Mode = 'contemplativo' | 'guiado' | 'automatico';

interface Seed {
  setName: string;
  setKey: 'joyful' | 'luminous' | 'sorrowful' | 'glorious';
  mysteryIndex: number;
  stepIndex: number;
  mode: Mode;
  elapsedMs: number;
  startedAt: string;
}

function makeSeed(overrides: Partial<Seed> = {}): Seed {
  return {
    setName: 'Mistérios Gozosos',
    setKey: 'joyful',
    mysteryIndex: 2,
    stepIndex: 17,
    mode: 'guiado',
    elapsedMs: 12 * 60 * 1000,
    startedAt: '2026-07-19T14:00:00.000Z',
    ...overrides,
  };
}

async function seedSession(page: import('@playwright/test').Page, seed: Seed) {
  // A seed precisa acontecer com uma origem carregada. Vamos ao / primeiro.
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(
    ({ seed, returnKey, devKey }) => {
      const now = new Date().toISOString();
      window.sessionStorage.setItem(
        returnKey,
        JSON.stringify({
          setName: seed.setName,
          mysteryLabel: `${seed.mysteryIndex + 1}º mistério`,
          mysteryIndex: seed.mysteryIndex,
          stepIndex: seed.stepIndex,
          mode: seed.mode,
          elapsedMs: seed.elapsedMs,
          startedAt: seed.startedAt,
          updatedAt: now,
        }),
      );
      window.localStorage.setItem(
        devKey,
        JSON.stringify({
          section: seed.setKey,
          step: seed.stepIndex,
          label: `${seed.setName}|${seed.mode}|${seed.mysteryIndex}|${seed.elapsedMs}|${seed.startedAt}`,
          updatedAt: now,
        }),
      );
    },
    { seed, returnKey: ROSARY_RETURN_KEY, devKey: DEVOTIONAL_KEY },
  );
}

async function assertNoNotFound(page: import('@playwright/test').Page, path: string) {
  const body = (await page.textContent('body')) ?? '';
  expect(body, `${path} caiu no NotFound`).not.toMatch(/página não encontrada/i);
  expect(body, `${path} exibiu 404`).not.toMatch(/\b404\b/);
}

test.describe('mobile · Glossário → Voltar ao Rosário', () => {
  test('/glossario e /rosary carregam sem 404 no mobile', async ({ page }) => {
    for (const path of ['/glossario', '/rosary']) {
      const resp = await page.goto(path, { waitUntil: 'domcontentloaded' });
      expect(resp?.status(), `${path} status`).toBeLessThan(400);
      await assertNoNotFound(page, path);
    }
  });

  test('botão sticky exibe o modo salvo e leva ao /rosary', async ({ page }) => {
    await seedSession(page, makeSeed({ mode: 'guiado' }));
    await page.goto('/glossario', { waitUntil: 'domcontentloaded' });

    const button = page.getByTestId('rosary-return-button');
    await expect(button).toBeVisible();
    await expect(button).toHaveAttribute('data-mode', 'guiado');
    await expect(button).toHaveAttribute(/aria-label/i, /modo Guiado/i);

    const region = page.getByTestId('rosary-return-region');
    await expect(region).toContainText(/modo\s+Guiado/i);
    await expect(region).toContainText(/3º mistério/i);
    await expect(region).toContainText(/12min rezados/i);

    await button.click();
    await page.waitForURL(/\/rosary\b/);
    await assertNoNotFound(page, '/rosary');
  });

  for (const mode of ['contemplativo', 'guiado', 'automatico'] as const) {
    test(`restaura sessão completa (modo=${mode})`, async ({ page }) => {
      await seedSession(page, makeSeed({ mode, stepIndex: 23 }));
      await page.goto('/glossario', { waitUntil: 'domcontentloaded' });
      await page.getByTestId('rosary-return-button').click();
      await page.waitForURL(/\/rosary\b/);

      // O /rosary restaura o conjunto e cai na tela de preparação com o modo
      // já marcado no radiogroup e o botão "Retomar" habilitado.
      const modeRadio = page.locator(`input[name="rosary-mode-choose"][value="${mode}"]`);
      await expect(modeRadio).toBeChecked({ timeout: 10_000 });

      // O breadcrumb de sessionStorage é limpo ao clicar (não deve mais existir).
      const remaining = await page.evaluate(
        (k) => window.sessionStorage.getItem(k),
        ROSARY_RETURN_KEY,
      );
      expect(remaining).toBeNull();

      // O progresso persistido (localStorage) permanece intacto para o retomar.
      const dev = await page.evaluate((k) => window.localStorage.getItem(k), DEVOTIONAL_KEY);
      expect(dev).not.toBeNull();
      const parsed = JSON.parse(dev!);
      expect(parsed.section).toBe('joyful');
      expect(parsed.step).toBe(23);
      expect(parsed.label).toContain(`|${mode}|`);
    });
  }

  test('ciclos repetidos Glossário↔Rosário preservam o modo', async ({ page }) => {
    const seeds: Mode[] = ['contemplativo', 'guiado', 'automatico'];
    for (const mode of seeds) {
      await seedSession(page, makeSeed({ mode, stepIndex: 11 }));
      await page.goto('/glossario', { waitUntil: 'domcontentloaded' });
      const btn = page.getByTestId('rosary-return-button');
      await expect(btn).toHaveAttribute('data-mode', mode);
      await btn.click();
      await page.waitForURL(/\/rosary\b/);
      await assertNoNotFound(page, '/rosary');
      await expect(
        page.locator(`input[name="rosary-mode-choose"][value="${mode}"]`),
      ).toBeChecked({ timeout: 10_000 });
    }
  });

  test('foco vai para o cabeçalho da preparação após click do mouse', async ({ page }) => {
    await seedSession(page, makeSeed({ mode: 'guiado' }));
    await page.goto('/glossario', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('rosary-return-button').click();
    await page.waitForURL(/\/rosary\b/);

    const heading = page.locator('#rosary-preparation-heading');
    await expect(heading).toBeVisible();
    await expect(heading).toBeFocused({ timeout: 10_000 });
    // Hash é limpo após mover o foco (evita re-focar em navegações futuras).
    await expect(page).toHaveURL(/\/rosary(?!#preparation)/);
  });

  for (const key of ['Enter', 'Space'] as const) {
    test(`ativação via teclado (${key}) leva ao Rosário e move foco ao cabeçalho`, async ({ page }) => {
      await seedSession(page, makeSeed({ mode: 'contemplativo' }));
      await page.goto('/glossario', { waitUntil: 'domcontentloaded' });

      const btn = page.getByTestId('rosary-return-button');
      await btn.focus();
      await expect(btn).toBeFocused();
      await page.keyboard.press(key);

      await page.waitForURL(/\/rosary\b/);
      const heading = page.locator('#rosary-preparation-heading');
      await expect(heading).toBeFocused({ timeout: 10_000 });
      await expect(heading).toHaveAttribute('tabindex', '-1');
      await expect(
        page.locator('input[name="rosary-mode-choose"][value="contemplativo"]'),
      ).toBeChecked();
    });
  }
});
