import { test, expect } from '@playwright/test';

/**
 * Valida que cada bloco do menu do Átrio (Rezar / Formar-se /
 * Pesquisar / Minha Jornada / Estudar) navega para a rota real,
 * carrega conteúdo válido (não fica em branco) e que rotas
 * inexistentes caem no NotFound (não em tela vazia).
 */

const ENV_BLOCKS = [
  { label: /Estudar/i,        path: '/bible' },
  { label: /Rezar/i,          path: '/oracao' },
  { label: /Formar[- ]?se/i,  path: '/jornadas' },
  { label: /Pesquisar/i,      path: '/buscar' },
  { label: /Minha Jornada/i,  path: '/hoje' },
] as const;

async function assertNotBlank(page: import('@playwright/test').Page) {
  const main = page.locator('main, [role="main"]').first();
  await expect(main).toBeVisible({ timeout: 15000 });
  const text = (await main.textContent())?.trim() || '';
  expect(text.length).toBeGreaterThan(20);
}

for (const vp of [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'mobile',  width: 390,  height: 844 },
] as const) {
  test.describe(`Átrio menu · ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    for (const block of ENV_BLOCKS) {
      test(`clique em "${String(block.label)}" navega para ${block.path}`, async ({ page }) => {
        await page.goto('/');
        const link = page.getByRole('link', { name: block.label }).first();
        await expect(link).toBeVisible({ timeout: 10000 });
        await link.click();
        await expect(page).toHaveURL(new RegExp(block.path.replace('/', '\\/')));
        await assertNotBlank(page);
      });

      test(`GET direto ${block.path} carrega conteúdo`, async ({ page }) => {
        await page.goto(block.path);
        await assertNotBlank(page);
      });
    }

    test('Popover Nexus não sobrevive à navegação para outro ambiente', async ({ page }) => {
      await page.goto('/bible?book=Jo&ch=6');
      const trigger = page
        .locator('[data-nexus-trigger], button:has-text("Nexus")')
        .first();
      if (await trigger.count()) {
        await trigger.click().catch(() => {});
      }
      await page.goto('/oracao');
      await expect(
        page.locator('[data-radix-popper-content-wrapper]:visible'),
      ).toHaveCount(0);
      await assertNotBlank(page);
    });

    test('rota inexistente exibe NotFound com botão de volta', async ({ page }) => {
      await page.goto('/rota-que-nao-existe-xyz');
      await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
      await expect(page.getByRole('link', { name: /Ir para o Átrio/i })).toBeVisible();
    });

    test('rodapé aparece no Átrio (/)', async ({ page }) => {
      await page.goto('/');
      const footer = page.locator('footer').first();
      await expect(footer).toBeVisible({ timeout: 10000 });
    });
  });
}
