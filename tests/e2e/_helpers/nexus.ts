import { expect, type Page, type Locator } from '@playwright/test';

export const NEXUS_ROUTE = '/catechism?p=1817';

export async function openNexus(page: Page): Promise<Locator> {
  await page.goto(NEXUS_ROUTE, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  const trigger = page
    .locator('[data-nexus-trigger], [data-tag-slug], button:has-text("Nexus")')
    .first();
  await expect(trigger).toBeVisible({ timeout: 10_000 });
  await trigger.click();
  const dialog = page.locator('[role="dialog"][data-focus-mode]').first();
  await expect(dialog).toBeVisible({ timeout: 10_000 });
  return dialog;
}

export async function swipe(
  dialog: Locator,
  dx: number,
  dy = 0,
  startX = 320,
  startY = 500,
) {
  await dialog.dispatchEvent('touchstart', {
    touches: [{ clientX: startX, clientY: startY, identifier: 1 }],
    changedTouches: [{ clientX: startX, clientY: startY, identifier: 1 }],
  });
  await dialog.dispatchEvent('touchend', {
    touches: [],
    changedTouches: [{ clientX: startX + dx, clientY: startY + dy, identifier: 1 }],
  });
}

export type NoiseCollector = {
  errors: string[];
  warnings: string[];
  netFailures: string[];
};

export function collectNoise(page: Page): NoiseCollector {
  const bag: NoiseCollector = { errors: [], warnings: [], netFailures: [] };
  page.on('pageerror', (e) => bag.errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    const t = m.type();
    if (t === 'error') bag.errors.push(`console.error: ${m.text()}`);
    else if (t === 'warning') bag.warnings.push(`console.warn: ${m.text()}`);
  });
  page.on('requestfailed', (r) => {
    const url = r.url();
    // Ignora ruído de terceiros comuns em preview.
    if (/analytics|beacon|hotjar|sentry|doubleclick/i.test(url)) return;
    bag.netFailures.push(`requestfailed: ${r.method()} ${url} — ${r.failure()?.errorText ?? 'unknown'}`);
  });
  page.on('response', (res) => {
    if (res.status() >= 500) bag.netFailures.push(`http ${res.status()}: ${res.url()}`);
  });
  return bag;
}

export function expectClean(bag: NoiseCollector) {
  expect(bag.errors, 'console errors').toEqual([]);
  expect(bag.warnings, 'console warnings').toEqual([]);
  expect(bag.netFailures, 'network failures').toEqual([]);
}
