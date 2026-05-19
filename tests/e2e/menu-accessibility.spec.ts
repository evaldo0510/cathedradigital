import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Audits', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Close onboarding if open
    const onboardingClose = page.locator('button:has-text("Pular"), button:has-text("Concluir")');
    if (await onboardingClose.isVisible()) {
      await onboardingClose.click();
    }
  });

  test('AppHeader and Menu accessibility check with Axe', async ({ page }) => {
    // Open menu if mobile to test all states
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check Header first
    const headerScan = await new AxeBuilder({ page })
      .include('.app-header')
      .analyze();
    expect(headerScan.violations).toEqual([]);

    const menuButton = page.locator('button[aria-label="Menu"]');
    if (await menuButton.isVisible()) {
      await menuButton.click();
      
      // Check Sidebar state
      const sidebarScan = await new AxeBuilder({ page })
        .include('aside[role="navigation"]')
        .analyze();
      expect(sidebarScan.violations).toEqual([]);
    }
  });

  test('Full keyboard navigation sequence', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Start at the top of the page
    await page.keyboard.press('Tab'); // Should be a skip link or first element in header
    
    const sidebar = page.locator('aside[role="navigation"]');
    await expect(sidebar).toBeVisible();

    // Tab through sidebar
    await page.keyboard.press('Tab'); // Logo button
    await expect(sidebar.locator('button[aria-label*="página inicial"]')).toBeFocused();

    await page.keyboard.press('ArrowDown');
    // First nav item should be focused
    const firstNavItem = sidebar.locator('ul[role="list"] button').first();
    await expect(firstNavItem).toBeFocused();

    await page.keyboard.press('ArrowDown');
    const secondNavItem = sidebar.locator('ul[role="list"] button').nth(1);
    await expect(secondNavItem).toBeFocused();
    
    // Test Space navigation
    await page.keyboard.press(' ');
    // Navigation should happen (check URL or title)
    await expect(page).not.toHaveURL(/\/$/);
  });

  test('Mobile menu focus restoration', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    const menuButton = page.locator('button[aria-label="Menu"]');
    await menuButton.focus();
    await expect(menuButton).toBeFocused();
    
    await menuButton.click();
    
    const sidebar = page.locator('aside[role="navigation"]');
    await expect(sidebar).toBeVisible();
    
    // ESC to close
    await page.keyboard.press('Escape');
    await expect(sidebar).not.toBeVisible();
    
    // Focus should return to menu button
    await expect(menuButton).toBeFocused();
  });

  test('High contrast mode Axe audit', async ({ page }) => {
    // Toggle high contrast
    const a11yButton = page.locator('button[aria-label*="Acessibilidade"]');
    if (await a11yButton.isVisible()) {
      await a11yButton.click();
      const hcToggle = page.locator('button[role="switch"]#high-contrast-toggle');
      await hcToggle.click();
      
      const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
      // Contrast violations are often reported in automated tools but might need manual review.
      // We aim for 0 violations.
      expect(accessibilityScanResults.violations).toEqual([]);
    }
  });
});
