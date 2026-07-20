import { test, expect, devices } from '@playwright/test';

/**
 * Navega a tira do SanctorumDateNav em mobile, confirma que:
 *  - Scroll horizontal funciona (scrollLeft muda).
 *  - Pills continuam em uma única linha (altura da tira não cresce).
 *  - Selecionar uma data via clique na pill atualiza o heading sem quebrar layout.
 *  - Navegar via botão "Próximo dia" também mantém layout estável.
 */

test.describe('SanctorumDateNav — scroll mobile', () => {
  test.use({ ...devices['iPhone SE'] });

  test('rolagem horizontal e navegação preservam layout', async ({ page }) => {
    await page.goto('/santos?date=2026-07-20', { waitUntil: 'domcontentloaded' });

    const strip = page.getByTestId('sanctorum-date-strip');
    await strip.waitFor({ state: 'visible', timeout: 15000 });

    const pills = strip.locator('button');
    await expect(pills).toHaveCount(7);

    const alturaInicial = (await strip.boundingBox())!.height;

    // scroll horizontal programático
    await strip.evaluate((el) => {
      el.scrollLeft = 120;
    });
    const scrollLeft = await strip.evaluate((el) => el.scrollLeft);
    expect(scrollLeft).toBeGreaterThan(0);

    // altura estável (sem quebra de linha)
    const alturaAposScroll = (await strip.boundingBox())!.height;
    expect(Math.abs(alturaAposScroll - alturaInicial)).toBeLessThan(4);

    // clica em uma pill diferente da atual e confirma que o heading muda
    const headingAntes = await page.getByRole('heading', { level: 2 }).textContent();
    const alvo = pills.nth(6); // último dia da tira
    await alvo.scrollIntoViewIfNeeded();
    await alvo.click();
    await expect
      .poll(async () => (await page.getByRole('heading', { level: 2 }).textContent()) || '')
      .not.toBe(headingAntes);

    // navega com "Próximo dia" e valida que layout continua íntegro
    await page.getByRole('button', { name: 'Próximo dia' }).click();
    await expect(pills).toHaveCount(7);
    const alturaFinal = (await strip.boundingBox())!.height;
    expect(Math.abs(alturaFinal - alturaInicial)).toBeLessThan(4);

    // nenhuma pill excedeu o max-w
    const larguras = await pills.evaluateAll((els) =>
      els.map((el) => (el as HTMLElement).getBoundingClientRect().width),
    );
    for (const w of larguras) {
      expect(w).toBeGreaterThanOrEqual(56);
      expect(w).toBeLessThanOrEqual(80);
    }
  });
});
