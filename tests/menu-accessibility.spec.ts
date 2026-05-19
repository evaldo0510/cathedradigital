import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Menu Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Close onboarding if open
    const onboardingClose = page.locator('button:has-text("Pular"), button:has-text("Concluir")');
    if (await onboardingClose.isVisible()) {
      await onboardingClose.click();
    }
  });

  test('automated accessibility check with Axe', async ({ page }) => {
    // Open menu if mobile
    await page.setViewportSize({ width: 375, height: 667 });
    const menuButton = page.locator('button[aria-label="Menu"]');
    if (await menuButton.isVisible()) {
      await menuButton.click();
    }

    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('aside[role="navigation"]')
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('navigation by keyboard in sidebar', async ({ page }) => {
    // Desktop view
    await page.setViewportSize({ width: 1280, height: 720 });
    
    const sidebar = page.locator('aside[role="navigation"]');
    await expect(sidebar).toBeVisible();

    // Tab through links
    await page.keyboard.press('Tab'); // Logo
    await page.keyboard.press('Tab'); // First nav item
    
    const firstNavItem = sidebar.locator('ul[role="list"] button').first();
    await expect(firstNavItem).toBeFocused();
    
    // Check focus ring visibility (simulated by checking class)
    const hasFocusRing = await firstNavItem.evaluate(el => 
      window.getComputedStyle(el).boxShadow !== 'none' || 
      el.classList.contains('focus-visible:ring-2') ||
      el.classList.contains('focus-visible:ring-offset-2')
    );
    expect(hasFocusRing).toBeTruthy();
  });

  test('keyboard handling - Enter and Space', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    const sidebar = page.locator('aside[role="navigation"]');
    
    // Test logo link with Space
    const logoLink = sidebar.locator('button[aria-label*="página inicial"]');
    await logoLink.focus();
    await page.keyboard.press(' ');
    await expect(page).toHaveURL(/.*sanctuarium/);
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

