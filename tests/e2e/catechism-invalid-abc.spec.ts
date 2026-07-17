import { test, expect } from '@playwright/test';
import { watchPopups } from './utils/bible-cic-helpers';

/**
 * /catechism?p=abc (parâmetro não numérico) precisa ser tratado com segurança:
 * sem tela em branco, sem popup, sem nova aba, sem exceções não capturadas.
 * O fallback deve ser consistente (mesmo comportamento em duas cargas seguidas).
 */
test('/catechism?p=abc trata parâmetro inválido com fallback seguro e consistente', async ({
  context,
  page,
}) => {
  const popups = watchPopups(context, page);
  const pageErrors: string[] = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));
  const pagesBefore = context.pages().length;

  await page.goto('/catechism?p=abc');
  await page.waitForLoadState('domcontentloaded');

  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('main').first()).toBeVisible();

  const firstText = (await page.locator('main').first().innerText()).trim();
  expect(firstText.length).toBeGreaterThan(20);
  const firstUrl = page.url();

  // Consistência: segunda visita produz o mesmo fallback (mesma URL final e conteúdo não vazio).
  await page.goto('/catechism?p=abc');
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('main').first()).toBeVisible();
  const secondText = (await page.locator('main').first().innerText()).trim();
  expect(secondText.length).toBeGreaterThan(20);
  expect(page.url()).toBe(firstUrl);

  expect(popups).toEqual([]);
  expect(context.pages().length).toBe(pagesBefore);
  expect(pageErrors, 'sem exceções não tratadas').toEqual([]);
});
