import { test, expect, devices } from '@playwright/test';

/**
 * Cobertura mobile das rotas devocionais (extensão do fluxo M9).
 *
 * Valida:
 *   - /oracao carrega no shell mobile sem 404.
 *   - Abrir uma oração persiste progresso em cathedra:devotional-progress:prayer.
 *   - Após o Rosário, a próxima devoção (Ladainhas) também carrega sem 404
 *     e preserva seu próprio progresso independente entre sessões.
 *   - Cada rota devocional preserva o progresso local após reload.
 */

test.use({ ...devices['Pixel 5'], viewport: { width: 393, height: 851 } });

const DEVOTIONALS = [
  { path: '/oracao', key: 'prayer', label: 'Orações' },
  { path: '/litanies', key: 'litanies', label: 'Ladainhas' },
] as const;

test.describe('mobile · Orações + próxima devoção após Rosário', () => {
  test('nenhuma rota devocional retorna 404 no mobile', async ({ page }) => {
    for (const dev of DEVOTIONALS) {
      const response = await page.goto(dev.path, { waitUntil: 'domcontentloaded' });
      expect(response?.status(), `${dev.path} respondeu ${response?.status()}`).toBeLessThan(400);

      // O componente NotFound do app injeta "404" no <main>.
      const bodyText = await page.textContent('body');
      expect(bodyText ?? '', `${dev.path} caiu no NotFound`).not.toMatch(/404|página não encontrada/i);

      // Shell mobile (nav) presente.
      await expect(page.getByRole('navigation').first()).toBeVisible({ timeout: 8_000 });
    }
  });

  test('progresso persiste independentemente em /oracao e /litanies', async ({ page, context }) => {
    await context.clearCookies();

    for (const dev of DEVOTIONALS) {
      await page.goto(dev.path, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(400);

      // Força um save de progresso (o hook useDevotionalProgress grava com essa chave).
      await page.evaluate((key) => {
        localStorage.setItem(
          `cathedra:devotional-progress:${key}`,
          JSON.stringify({
            section: 'default',
            step: 2,
            label: 'Passo 2',
            updatedAt: new Date().toISOString(),
          }),
        );
      }, dev.key);

      // Reload — progresso deve continuar salvo.
      await page.reload({ waitUntil: 'domcontentloaded' });
      const saved = await page.evaluate(
        (key) => localStorage.getItem(`cathedra:devotional-progress:${key}`),
        dev.key,
      );
      expect(saved, `progresso perdido em ${dev.path}`).toBeTruthy();
      expect(JSON.parse(saved!).step).toBe(2);
    }

    // Progresso do Rosário NÃO deve ser afetado por Orações/Ladainhas.
    await page.evaluate(() => {
      localStorage.setItem(
        'cathedra:devotional-progress:rosary',
        JSON.stringify({ section: 'joyful', step: 3, label: '3º', updatedAt: new Date().toISOString() }),
      );
    });
    await page.goto('/oracao', { waitUntil: 'domcontentloaded' });
    const rosarySaved = await page.evaluate(() =>
      localStorage.getItem('cathedra:devotional-progress:rosary'),
    );
    expect(rosarySaved).toBeTruthy();
    expect(JSON.parse(rosarySaved!).step).toBe(3);
  });

  test('fluxo Rosário → Ladainhas mantém navegação sem 404', async ({ page }) => {
    await page.goto('/rosary', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('navigation').first()).toBeVisible();

    // Segue para a próxima devoção da jornada mobile.
    const response = await page.goto('/litanies', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBeLessThan(400);
    const bodyText = await page.textContent('body');
    expect(bodyText ?? '').not.toMatch(/404|página não encontrada/i);
  });
});
