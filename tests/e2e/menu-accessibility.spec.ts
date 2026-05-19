import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Comprehensive Navigation Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Close onboarding if open
    const onboardingClose = page.locator('button:has-text("Pular"), button:has-text("Concluir"), button:has-text("Próximo")');
    if (await onboardingClose.isVisible()) {
      await onboardingClose.click();
    }
  });

  test('AppHeader and Menu accessibility audit', async ({ page }) => {
    // Open menu if mobile to test all states
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check Header first
    const headerScan = await new AxeBuilder({ page })
      .include('.app-header')
      .analyze();
    expect(headerScan.violations).toEqual([]);

    const menuButton = page.locator('button[aria-label*="Menu"]');
    if (await menuButton.isVisible()) {
      await menuButton.click();
      
      // Check Sidebar state
      const sidebarScan = await new AxeBuilder({ page })
        .include('aside[role="navigation"]')
        .analyze();
      expect(sidebarScan.violations).toEqual([]);
    }
  });

  test('BottomNav keyboard navigation and Axe audit', async ({ page }) => {
    // BottomNav only appears on mobile/tablet
    await page.setViewportSize({ width: 375, height: 667 });
    
    const bottomNav = page.locator('nav[aria-label="Navegação móvel inferior"]');
    await expect(bottomNav).toBeVisible();

    // Axe audit for BottomNav
    const axeResults = await new AxeBuilder({ page })
      .include('.bottom-nav')
      .analyze();
    expect(axeResults.violations).toEqual([]);

    const navItems = bottomNav.locator('button');
    const count = await navItems.count();
    
    for (let i = 0; i < count; i++) {
      const item = navItems.nth(i);
      await expect(item).toHaveAttribute('aria-label');
      
      // Test Focus visibility (ring)
      await item.focus();
      const className = await item.getAttribute('class');
      expect(className).toContain('focus-visible:ring-2');

      // Test Enter and Space
      await page.keyboard.press('Enter');
      await page.keyboard.press(' ');
    }
  });

  test('Sidebar Arrow navigation with wrap-around', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    
    const sidebar = page.locator('aside[role="navigation"]');
    await expect(sidebar).toBeVisible();

    // Start navigation
    await page.keyboard.press('Tab');
    
    // ArrowDown navigation
    const firstItem = sidebar.locator('ul[role="list"] button, ul[role="list"] a').first();
    await firstItem.focus();
    
    await page.keyboard.press('ArrowDown');
    const secondItem = sidebar.locator('ul[role="list"] button, ul[role="list"] a').nth(1);
    await expect(secondItem).toBeFocused();

    // Wrap around: Up from first element to last
    await firstItem.focus();
    await page.keyboard.press('ArrowUp');
    const lastItem = sidebar.locator('button, a').last();
    await expect(page.locator(':focus')).toBeVisible();
    
    // The focus should still be within the sidebar
    const currentFocus = page.locator(':focus');
    const isInsideSidebar = await sidebar.evaluate((node, focused) => node.contains(focused), await currentFocus.elementHandle());
    expect(isInsideSidebar).toBe(true);
  });

  test('Mobile menu Escape and focus restoration', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    const menuButton = page.locator('nav[aria-label="Navegação móvel inferior"] button[aria-label*="Menu"]');
    await menuButton.focus();
    await menuButton.click();
    
    const sidebar = page.locator('aside[role="navigation"]');
    await expect(sidebar).toBeVisible();
    
    // ESC to close
    await page.keyboard.press('Escape');
    await expect(sidebar).not.toBeVisible();
    
    // Focus should return to menu button
    await expect(menuButton).toBeFocused();
  });

  test('High Contrast and Theme switching Axe audit', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Open accessibility settings if needed or use Sidebar toggles
    const sidebar = page.locator('aside[role="navigation"]');
    
    // Toggle High Contrast
    const hcToggle = sidebar.locator('button[aria-label*="contraste"]');
    await hcToggle.click();
    
    // Axe audit in HC mode
    const hcScan = await new AxeBuilder({ page }).analyze();
    expect(hcScan.violations).toEqual([]);
    
    // Toggle Theme
    const themeToggle = sidebar.locator('button[aria-label*="modo"]');
    await themeToggle.click();
    
    // Axe audit in new theme
    const themeScan = await new AxeBuilder({ page }).analyze();
    expect(themeScan.violations).toEqual([]);
    
    // Ensure focus ring is still visible
    await themeToggle.focus();
    const className = await themeToggle.getAttribute('class');
    expect(className).toContain('focus-visible:ring-');
  });
});
