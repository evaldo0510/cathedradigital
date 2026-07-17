import { test, expect } from '@playwright/test';
import { watchPopups, findCicLink, assertParagraphVisible } from './utils/bible-cic-helpers';

/**
 * Em Jo 6, escolhe múltiplos links CIC (§N distintos, ex.: primeiro e segundo
 * disponíveis) e alterna com back/forward, confirmando que cada visita ao
 * Catecismo mantém o parágrafo correto, sem popup e sem nova aba.
 */
test('múltiplos §N em Jo 6: back/forward mantém cada parágrafo', async ({ context, page }) => {
  const popups = watchPopups(context, page);
  const pagesBefore = context.pages().length;

  await page.goto('/bible?book=Jo&ch=6');
  await page.waitForLoadState('domcontentloaded');

  const first = await findCicLink(page);
  const hrefs = await page
    .locator('[data-testid="catechism-preview-empty-link"], [data-testid="catechism-open-internal"]')
    .evaluateAll((els) => els.map((el) => (el as HTMLAnchorElement).getAttribute('href') || ''));

  const uniqueParagraphs = Array.from(
    new Set(hrefs.map((h) => (h.match(/p=(\d+)/) || [])[1]).filter(Boolean))
  ).slice(0, 2);

  // Se a página só oferece 1 §N, garante ao menos 2 destinos distintos usando
  // navegação direta para /catechism?p=N do segundo parágrafo real disponível.
  const p1 = uniqueParagraphs[0]!;
  const p2 =
    uniqueParagraphs[1] ??
    (await page
      .locator('[data-testid="catechism-preview-empty-link"], [data-testid="catechism-open-internal"]')
      .nth(1)
      .getAttribute('href')
      .then((h) => (h?.match(/p=(\d+)/) || [])[1])) ??
    String(Number(p1) + 1);

  expect(p1).toBeTruthy();
  expect(p2).toBeTruthy();
  expect(p1).not.toBe(p2);

  // Visita §p1
  await first.click();
  await page.waitForURL(new RegExp(`/catechism\\?p=${p1}`));
  await assertParagraphVisible(page, p1);

  // Volta para Jo 6 e visita §p2
  await page.goBack();
  await expect(page).toHaveURL(/\/bible\?.*book=Jo.*ch=6/);

  const secondLink = page
    .locator(`a[href*="p=${p2}"]`)
    .first();
  if (await secondLink.count()) {
    await secondLink.click();
  } else {
    await page.goto(`/catechism?p=${p2}`);
  }
  await page.waitForURL(new RegExp(`/catechism\\?p=${p2}`));
  await assertParagraphVisible(page, p2);

  // Back → Jo 6 → Back → /catechism?p=p1 (histórico preservado)
  await page.goBack();
  await expect(page).toHaveURL(/\/bible\?.*book=Jo.*ch=6/);
  await page.goBack();
  await expect(page).toHaveURL(new RegExp(`/catechism\\?p=${p1}`));
  await assertParagraphVisible(page, p1);

  // Forward → Jo 6 → Forward → /catechism?p=p2
  await page.goForward();
  await expect(page).toHaveURL(/\/bible\?.*book=Jo.*ch=6/);
  await page.goForward();
  await expect(page).toHaveURL(new RegExp(`/catechism\\?p=${p2}`));
  await assertParagraphVisible(page, p2);

  expect(popups).toEqual([]);
  expect(context.pages().length).toBe(pagesBefore);
});
