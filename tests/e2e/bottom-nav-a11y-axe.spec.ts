import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'fs';
import path from 'path';

const A11Y_REPORTS_DIR = path.join(process.cwd(), 'tests/e2e/a11y-reports');
if (!fs.existsSync(A11Y_REPORTS_DIR)) {
  fs.mkdirSync(A11Y_REPORTS_DIR, { recursive: true });
}

async function runAxeAndSave(page, testInfo, name, selector = 'body') {
  const results = await new AxeBuilder({ page })
    .include(selector)
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
    .analyze();
  
  const reportPath = path.join(A11Y_REPORTS_DIR, `bottom-nav-a11y-${name}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  
  await testInfo.attach(`a11y-report-${name}`, {
    body: JSON.stringify(results, null, 2),
    contentType: 'application/json'
  });
  
  return results;
}

test.describe('BottomNav Accessibility (Axe)', () => {
  test.use({ 
    viewport: { width: 390, height: 844 },
    hasTouch: true
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/?lang=pt');
  });

  test('should have no accessibility violations in initial state', async ({ page }, testInfo) => {
    const results = await runAxeAndSave(page, testInfo, 'initial', '.bottom-nav');
    expect(results.violations).toEqual([]);
  });

  test('should have no violations when an item is active', async ({ page }, testInfo) => {
    await page.click('button[aria-label="Bíblia"]');
    await expect(page).toHaveURL(/\/bible/);
    
    const results = await runAxeAndSave(page, testInfo, 'active-item', '.bottom-nav');
    expect(results.violations).toEqual([]);
  });

  test('should have no violations during keyboard navigation', async ({ page }, testInfo) => {
    const bibleItem = page.locator('button[aria-label="Bíblia"]');
    await bibleItem.focus();
    
    const results = await runAxeAndSave(page, testInfo, 'keyboard-nav', '.bottom-nav');
    expect(results.violations).toEqual([]);
  });

  test('should have no violations in SwipeNavigation container', async ({ page }, testInfo) => {
    const results = await runAxeAndSave(page, testInfo, 'swipe-container', '.swipe-navigation');
    expect(results.violations).toEqual([]);
  });
});
