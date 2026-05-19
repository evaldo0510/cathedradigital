import { test, expect } from '@playwright/test';

test.describe('Menu Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Close onboarding if open
    const onboardingClose = page.locator('button:has-text("Pular"), button:has-text("Concluir")');
    if (await onboardingClose.isVisible()) {
      await onboardingClose.click();
    }
  });

  test('navigation by keyboard in sidebar', async ({ page }) => {
    // Desktop view
    await page.setViewportSize({ width: 1280, height: 720 });
    
    const sidebar = page.locator('aside[role="navigation"]');
    await expect(sidebar).toBeVisible();

    // Tab through links
    await page.keyboard.press('Tab');
    const firstLink = sidebar.locator('button').first();
    await expect(firstLink).toBeFocused();
    
    // Check focus ring visibility (simulated by checking class)
    const hasFocusRing = await firstLink.evaluate(el => 
      window.getComputedStyle(el).boxShadow !== 'none' || 
      el.classList.contains('focus-visible:ring-2')
    );
    expect(hasFocusRing).toBeTruthy();
  });

  test('ARIA labels and roles in menu', async ({ page }) => {
    const sidebar = page.locator('aside[role="navigation"]');
    await expect(sidebar).toHaveAttribute('aria-label', /Menu/);
    
    const menuItems = sidebar.locator('li');
    const firstItem = menuItems.first();
    const button = firstItem.locator('button');
    await expect(button).toHaveAttribute('aria-label');
  });

  test('Mobile menu behavior - ESC to close', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Open menu
    const menuButton = page.locator('button[aria-label="Menu"]');
    await menuButton.click();
    
    const sidebar = page.locator('aside[role="navigation"]');
    await expect(sidebar).toBeVisible();
    
    // ESC to close
    await page.keyboard.press('Escape');
    await expect(sidebar).not.toBeVisible();
  });
  
  test('High contrast mode styles', async ({ page }) => {
    // Toggle high contrast
    const a11yButton = page.locator('button[aria-label*="Acessibilidade"]');
    if (await a11yButton.isVisible()) {
      await a11yButton.click();
      const hcToggle = page.locator('button[role="switch"]#high-contrast-toggle');
      await hcToggle.click();
      
      const body = page.locator('html');
      await expect(body).toHaveClass(/high-contrast/);
    }
  });
});
