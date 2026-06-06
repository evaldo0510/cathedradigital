import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'fs';
import path from 'path';

const A11Y_REPORTS_DIR = path.join(process.cwd(), 'tests/e2e/a11y-reports');
if (!fs.existsSync(A11Y_REPORTS_DIR)) {
  fs.mkdirSync(A11Y_REPORTS_DIR, { recursive: true });
}

test.describe('I18n Audit Panel Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the admin dashboard and open the Bible Audit / i18n tab
    // Based on the code, it's accessed via /admin?tab=content or similar, then selecting the tab
    await page.goto('/admin?tab=content');
    
    // Select the "Auditoria Bíblica" tab which contains the BibleKnowledgeAudit component
    await page.click('button[value="bible-audit"]');
    
    // Inside BibleKnowledgeAudit, select the "i18n-audit" sub-tab
    await page.click('button:has-text("Acessibilidade"), button:has-text("i18n")'); // BibleKnowledgeAudit has many tabs
    
    // Specifically finding the i18n audit tab
    const i18nTab = page.locator('button').filter({ hasText: /i18n/i });
    if (await i18nTab.isVisible()) {
      await i18nTab.click();
    }
  });

  test('should have no accessibility violations in the i18n panel', async ({ page }, testInfo) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[aria-label="Lista de logs legados"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
      .analyze();

    await testInfo.attach('i18n-audit-a11y-report', {
      body: JSON.stringify(accessibilityScanResults, null, 2),
      contentType: 'application/json'
    });

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should maintain focus and keyboard navigation in pagination', async ({ page }) => {
    const pagination = page.locator('[role="navigation"][aria-label="Paginação"]');
    await expect(pagination).toBeVisible();

    const nextButton = pagination.locator('button[aria-label="Próxima Página"]');
    await nextButton.focus();
    await expect(nextButton).toBeFocused();

    // Tab through pagination
    await page.keyboard.press('Tab');
    // Depending on DOM, might go to previous or next
    
    // Verify names
    await expect(pagination.locator('button[aria-label="Página Anterior"]')).toBeVisible();
    await expect(page.locator('[aria-current="page"]')).toBeVisible();
  });

  test('filters should have accessible labels and roles', async ({ page }) => {
    const searchInput = page.locator('input[aria-label="Buscar termo i18n"]');
    await expect(searchInput).toBeVisible();
    
    const statusSelect = page.locator('select[aria-label="Filtrar por Status"]');
    await expect(statusSelect).toBeVisible();
    
    const sortSelect = page.locator('select[aria-label="Ordenação"]');
    await expect(sortSelect).toBeVisible();
  });
});
