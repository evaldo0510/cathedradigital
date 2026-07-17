import { test, expect } from '@playwright/test';
import { watchPopups, assertParagraphVisible } from './utils/bible-cic-helpers';

/**
 * Em /catechism?p=2, usar o controle de próximo § troca para §3:
 * - URL fica com p=3
 * - §3 aparece selecionado, com heading e landmarks corretos
 * - Navegação SPA (sem reload)
 * - Sem popup / nova aba
 */
test('controle próximo § em /catechism?p=2 navega para p=3 sem reload', async ({
  context,
  page,
}) => {
  const popups = watchPopups(context, page);
  const pagesBefore = context.pages().length;

  await page.goto('/catechism?p=2');
  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveURL(/\/catechism\?p=2\b/);
  await expect(page.locator('main')).toHaveCount(1);

  // Sentinela para detectar reload do documento
  await page.evaluate(() => {
    (window as any).__cicNoReload = true;
    window.addEventListener('beforeunload', () => {
      (window as any).__cicNoReload = false;
    });
  });

  // Localiza o botão/link de "próximo §" por múltiplos seletores tolerantes.
  const nextCandidates = [
    '[data-testid="catechism-next"]',
    '[data-testid="catechism-paragraph-next"]',
    'button[aria-label*="Próximo" i]',
    'a[aria-label*="Próximo" i]',
    'button[aria-label*="next" i]',
    'a[aria-label*="next" i]',
    'button:has-text("Próximo")',
    'a:has-text("Próximo")',
  ];
  let next = page.locator(nextCandidates[0]).first();
  for (const sel of nextCandidates) {
    const cand = page.locator(sel).first();
    if (await cand.count()) {
      next = cand;
      break;
    }
  }
  await expect(next, 'controle de próximo § deve existir').toBeVisible({ timeout: 10_000 });

  await next.click();

  await page.waitForURL(/\/catechism\?p=3\b/, { timeout: 10_000 });
  await expect(page).toHaveURL(/\/catechism\?p=3\b/);

  // Sem reload
  expect(await page.evaluate(() => (window as any).__cicNoReload)).toBe(true);

  // Landmarks preservados
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('main').first()).toBeVisible();
  await expect(page.locator('nav').first()).toBeVisible();

  // Heading válido e conteúdo do §3 visível
  const headings = page.locator('h1, h2');
  await expect(headings.first()).toBeVisible();
  const headingText = (await headings.allInnerTexts()).join(' \n ');
  expect(headingText).toMatch(/(§\s*)?3\b|Catecismo/i);

  await assertParagraphVisible(page, '3');

  expect(popups).toEqual([]);
  expect(context.pages().length).toBe(pagesBefore);
});
