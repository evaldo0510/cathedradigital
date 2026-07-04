import { test, expect } from '@playwright/test';
import { devices } from '@playwright/test';

// FAB só aparece em mobile (lg:hidden na BottomNav)
test.use({ ...devices['iPhone 12'] });

test.describe('SmartActionButton (FAB central da BottomNav)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('abre bottom sheet ao tocar no FAB e mostra os 4 atalhos', async ({ page }) => {
    const fab = page.getByTestId('smart-action-button');
    await expect(fab).toBeVisible();
    await expect(fab).toHaveAttribute('aria-label', 'Abrir atalhos rápidos');
    await expect(fab).toHaveAttribute('aria-expanded', 'false');

    await fab.tap();

    await expect(fab).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: /atalhos rápidos/i })).toBeVisible();

    for (const key of ['buscar', 'oracao', 'diario', 'favoritos']) {
      await expect(page.getByTestId(`smart-action-${key}`)).toBeVisible();
    }
  });

  test('fecha via tecla Esc', async ({ page }) => {
    await page.getByTestId('smart-action-button').tap();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByTestId('smart-action-button')).toHaveAttribute('aria-expanded', 'false');
  });

  test('fecha ao tocar fora do sheet', async ({ page }) => {
    await page.getByTestId('smart-action-button').tap();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Clique no overlay (topo da tela, fora do sheet inferior)
    await page.mouse.click(20, 20);
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('atalho "Buscar" fecha o sheet e abre o CommandCenter (Ctrl+K)', async ({ page }) => {
    await page.getByTestId('smart-action-button').tap();
    await page.getByTestId('smart-action-buscar').tap();

    await expect(page.getByRole('dialog').filter({ hasText: /atalhos rápidos/i })).not.toBeVisible();
    await expect(
      page.getByPlaceholder(/Buscar em tudo: Bíblia, Catecismo, Santos, Jornadas/i),
    ).toBeVisible({ timeout: 5000 });
  });

  test('atalho "Oração" navega para /oracao e fecha o sheet', async ({ page }) => {
    await page.getByTestId('smart-action-button').tap();
    await page.getByTestId('smart-action-oracao').tap();

    await expect(page).toHaveURL(/\/oracao/, { timeout: 5000 });
    await expect(page.getByRole('dialog').filter({ hasText: /atalhos rápidos/i })).not.toBeVisible();
  });

  test('atalho "Diário" navega para /diario', async ({ page }) => {
    await page.getByTestId('smart-action-button').tap();
    await page.getByTestId('smart-action-diario').tap();
    await expect(page).toHaveURL(/\/diario/, { timeout: 5000 });
  });

  test('atalho "Favoritos" navega para /favorites', async ({ page }) => {
    await page.getByTestId('smart-action-button').tap();
    await page.getByTestId('smart-action-favoritos').tap();
    await expect(page).toHaveURL(/\/favorites/, { timeout: 5000 });
  });

  test('sheet fecha após navegação (sem estado preso)', async ({ page }) => {
    await page.getByTestId('smart-action-button').tap();
    await page.getByTestId('smart-action-favoritos').tap();
    await expect(page).toHaveURL(/\/favorites/);

    // Após navegar, o dialog não deve permanecer aberto
    await expect(page.getByRole('dialog').filter({ hasText: /atalhos rápidos/i })).not.toBeVisible();
    await expect(page.getByTestId('smart-action-button')).toHaveAttribute('aria-expanded', 'false');
  });
});
