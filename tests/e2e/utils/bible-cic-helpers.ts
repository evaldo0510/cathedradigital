import { test, expect, type Page, type BrowserContext, type Locator } from '@playwright/test';

/**
 * Helpers compartilhados para os fluxos Jo 6 ↔ /catechism?p=N.
 * Mantém popups sob vigilância e localiza o link "Abrir §N no Catecismo".
 */

export function watchPopups(context: BrowserContext, page: Page): string[] {
  const popups: string[] = [];
  context.on('page', (p) => popups.push('page:' + p.url()));
  page.on('popup', (p) => popups.push('popup:' + p.url()));
  return popups;
}

export async function findCicLink(page: Page): Promise<Locator> {
  const cicLink = page
    .locator('[data-testid="catechism-preview-empty-link"], [data-testid="catechism-open-internal"]')
    .first();

  if (!(await cicLink.count())) {
    const trigger = page.locator('[data-nexus-trigger], [data-testid^="nexus-trigger"]').first();
    if (await trigger.count()) await trigger.click();
  }
  await expect(cicLink).toBeVisible({ timeout: 20_000 });
  return cicLink;
}

export async function openJo6AndPickCic(page: Page): Promise<{ href: string; paragraph: string }> {
  await page.goto('/bible?book=Jo&ch=6');
  await page.waitForLoadState('domcontentloaded');
  const link = await findCicLink(page);
  const href = (await link.getAttribute('href'))!;
  expect(href).toMatch(/\/catechism\?p=\d+/);
  const paragraph = href.match(/p=(\d+)/)![1];
  await link.click();
  await page.waitForURL(new RegExp(`/catechism\\?p=${paragraph}`), { timeout: 10_000 });
  return { href, paragraph };
}

export async function assertParagraphVisible(page: Page, paragraph: string) {
  const marker = page
    .locator(
      `[data-paragraph="${paragraph}"], [data-cic-paragraph="${paragraph}"], #p-${paragraph}, #paragraph-${paragraph}`
    )
    .first();
  if (await marker.count()) {
    await expect(marker).toBeVisible();
  } else {
    await expect(page.locator('main')).toContainText(new RegExp(`§\\s*${paragraph}\\b`));
  }
}
