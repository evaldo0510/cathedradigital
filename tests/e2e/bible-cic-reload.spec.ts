import { test, expect } from '@playwright/test';
import { watchPopups, openJo6AndPickCic, assertParagraphVisible } from './utils/bible-cic-helpers';

/**
 * Após chegar em /catechism?p=N via Jo 6, reload preserva o parágrafo N,
 * não emite novo console.info('[CIC link click]') e não abre popup.
 */
test('reload em /catechism?p=N preserva parágrafo e não reemite log CIC', async ({ context, page }) => {
  const cicLogs: string[] = [];
  page.on('console', (msg) => {
    if (msg.text().includes('[CIC link click]')) cicLogs.push(msg.text());
  });
  const popups = watchPopups(context, page);
  const pagesBefore = context.pages().length;

  const { paragraph } = await openJo6AndPickCic(page);
  await assertParagraphVisible(page, paragraph);

  const logsBefore = cicLogs.length;
  expect(logsBefore).toBeGreaterThan(0);

  await page.reload();
  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveURL(new RegExp(`/catechism\\?p=${paragraph}`));
  await assertParagraphVisible(page, paragraph);

  await page.waitForTimeout(500);
  expect(cicLogs.length, 'nenhum [CIC link click] extra após reload').toBe(logsBefore);
  expect(popups).toEqual([]);
  expect(context.pages().length).toBe(pagesBefore);
});
