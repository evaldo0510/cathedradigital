import { test, expect } from '@playwright/test';
import { watchPopups } from './utils/bible-cic-helpers';

/**
 * /catechism?p=999 (fora do range válido conhecido do consumo) precisa ser
 * tratado com segurança: sem tela em branco, sem popup, sem nova aba.
 * A página deve exibir landmarks e alguma mensagem/fallback significativo.
 */
test('/catechism?p=999 é tratado com segurança', async ({ context, page }) => {
  const popups = watchPopups(context, page);
  const pageErrors: string[] = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));

  const pagesBefore = context.pages().length;

  await page.goto('/catechism?p=999');
  await page.waitForLoadState('domcontentloaded');

  // Landmarks básicos presentes
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('main').first()).toBeVisible();

  // Conteúdo não vazio (fallback ou §999 real)
  const mainText = (await page.locator('main').first().innerText()).trim();
  expect(mainText.length).toBeGreaterThan(20);

  // Sem popups/novas abas e sem exceções não capturadas
  expect(popups).toEqual([]);
  expect(context.pages().length).toBe(pagesBefore);
  expect(pageErrors, 'sem exceções não tratadas').toEqual([]);
});
