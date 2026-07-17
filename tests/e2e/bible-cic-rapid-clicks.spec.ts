import { test, expect } from '@playwright/test';
import { watchPopups, assertParagraphVisible } from './utils/bible-cic-helpers';

/**
 * Cliques rápidos em diferentes "Abrir §N no Catecismo": apenas o último
 * clique deve refletir na URL/parágrafo. Nenhum popup, nenhuma nova aba.
 */
test('cliques rápidos em §N distintos: só o último vence', async ({ context, page }) => {
  const popups = watchPopups(context, page);
  const pagesBefore = context.pages().length;

  await page.goto('/bible?book=Jo&ch=6');
  await page.waitForLoadState('domcontentloaded');

  const linksLoc = page.locator(
    '[data-testid="catechism-preview-empty-link"], [data-testid="catechism-open-internal"]'
  );
  await expect(linksLoc.first()).toBeVisible({ timeout: 20_000 });

  const hrefs = await linksLoc.evaluateAll((els) =>
    els.map((el) => (el as HTMLAnchorElement).getAttribute('href') || '')
  );
  const paragraphs = Array.from(
    new Set(hrefs.map((h) => (h.match(/p=(\d+)/) || [])[1]).filter(Boolean))
  );
  test.skip(paragraphs.length < 2, 'precisa de ao menos 2 §N distintos em Jo 6');

  const pFirst = paragraphs[0]!;
  const pLast = paragraphs[paragraphs.length - 1]!;

  const firstLink = page.locator(`a[href*="p=${pFirst}"]`).first();
  const lastLink = page.locator(`a[href*="p=${pLast}"]`).first();

  // Dispara cliques em sequência imediata (sem await entre eles)
  await Promise.all([firstLink.click({ noWaitAfter: true }), lastLink.click({ noWaitAfter: true })]);

  await page.waitForURL(new RegExp(`/catechism\\?p=${pLast}`), { timeout: 10_000 });
  await expect(page).toHaveURL(new RegExp(`/catechism\\?p=${pLast}`));
  await assertParagraphVisible(page, pLast);

  expect(popups).toEqual([]);
  expect(context.pages().length).toBe(pagesBefore);
});
