import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Cathedra Digital - E2E Contrast Validation
 * This test suite validates that the Logos IA (Chat) interface maintains 
 * WCAG-compliant contrast ratios in all three primary display modes.
 */

const THEMES = [
  { 
    name: 'Claro (Paper)', 
    settings: { theme: 'paper', highContrast: false, contrast: 'normal' } 
  },
  { 
    name: 'Escuro (Dark)', 
    settings: { theme: 'dark', highContrast: false, contrast: 'normal' } 
  },
  { 
    name: 'Alto Contraste', 
    settings: { theme: 'paper', highContrast: true, contrast: 'high' } 
  }
];

test.describe('Logos IA Contrast Validation', () => {
  for (const theme of THEMES) {
    test(`Validate contrast in ${theme.name} mode`, async ({ page }) => {
      // 1. Navigate to Chat (redirects to Logos AI)
      await page.goto('/chat');
      
      // 2. Inject settings into localStorage to force the theme
      await page.evaluate((settings) => {
        const key = 'cathedra_reading_settings';
        const current = JSON.parse(localStorage.getItem(key) || '{}');
        localStorage.setItem(key, JSON.stringify({
          ...current,
          ...settings,
          lastUpdated: Date.now()
        }));
      }, theme.settings);

      // 3. Reload to apply settings correctly from the start
      await page.reload();
      await page.waitForLoadState('networkidle');

      // 4. Ensure the UI is loaded
      await expect(page.getByText('Logos IA', { exact: false }).first()).toBeVisible();
      
      // 5. Check components presence
      const input = page.locator('input[placeholder*="reflexão"], input[placeholder*="Silêncio"]');
      await expect(input).toBeVisible();
      
      const submitBtn = page.locator('button[type="submit"]');
      // Submit button might be hidden if query is empty, but we can check its container or inject text
      await input.fill('Teste de acessibilidade');
      await expect(submitBtn).toBeVisible();

      // 6. Run A11y Audit focusing on contrast
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withRules(['color-contrast'])
        .analyze();

      // 7. Validation
      if (accessibilityScanResults.violations.length > 0) {
        console.error(`\n[CONTRAST FAIL] ${theme.name} mode has violations:`);
        accessibilityScanResults.violations.forEach(v => {
          console.error(`- ${v.id}: ${v.help}`);
          v.nodes.forEach(node => {
            console.error(`  Element: ${node.target.join(', ')}`);
            console.error(`  Summary: ${node.failureSummary}`);
          });
        });
      }

      expect(accessibilityScanResults.violations, `Contrast violations found in ${theme.name} mode`).toEqual([]);
    });
  }

  test('Validate contrast during loading state', async ({ page }) => {
    await page.goto('/logos');
    
    // Fill query and send to trigger loading
    const input = page.locator('input[placeholder*="reflexão"]');
    await input.fill('Qual o sentido da vida?');
    await page.keyboard.press('Enter');

    // Wait for loading indicator (dots)
    const loadingDots = page.locator('.animate-pulse, .opacity-10.py-6');
    // We don't necessarily expect it to be visible long, but let's try to catch it
    
    // Check contrast while loading
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .analyze();

    expect(accessibilityScanResults.violations, 'Contrast violations found during loading state').toEqual([]);
  });

  test('Validate contrast of error messages', async ({ page }) => {
    // 1. Force an error by triggering silence mode and trying to chat
    await page.goto('/chat');
    
    await page.evaluate(() => {
      const key = 'cathedra_reading_settings';
      const settings = JSON.parse(localStorage.getItem(key) || '{}');
      localStorage.setItem(key, JSON.stringify({ ...settings, totalSilence: true }));
    });
    
    await page.reload();
    
    // 2. Try to type and send
    const input = page.locator('input[placeholder*="Silêncio"]');
    await input.click(); // Should show toast or we can try to press enter
    await page.keyboard.press('Enter');
    
    // 3. Wait for toast error
    const toast = page.locator('[data-sonner-toast]');
    await expect(toast).toBeVisible();
    
    // 4. Check contrast of the toast
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[data-sonner-toast]')
      .withRules(['color-contrast'])
      .analyze();

    expect(accessibilityScanResults.violations, 'Contrast violations found in error toast').toEqual([]);
  });
});
