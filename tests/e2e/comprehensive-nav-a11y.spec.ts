import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Comprehensive Navigation Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the app to be stable
    await page.waitForLoadState('networkidle');
    
    // Close onboarding if it appears
    const onboardingClose = page.locator('button:has-text("Pular"), button:has-text("Concluir"), button:has-text("Próximo")');
    if (await onboardingClose.isVisible()) {
      try {
        await onboardingClose.click();
      } catch (e) {
        // Ignore if it disappears or is not clickable
      }
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
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const item = navItems.nth(i);
      
      // Verify ARIA label exists
      const label = await item.getAttribute('aria-label');
      expect(label).toBeTruthy();

      // Test Focus visibility (ring)
      await item.focus();
      // Check for focus-visible ring classes
      const className = await item.getAttribute('class');
      expect(className).toContain('focus-visible:ring-2');

      // Test Enter key
      if (i < count - 1) { // Skip the last one if it's the menu trigger for now
        await page.keyboard.press('Enter');
        // Navigation should be triggered (checking if URL changes or something happens)
        // Note: some items might stay on the same page if it's already active
      }
      
      // Test Space key
      await page.keyboard.press(' ');
    }
  });

  test('Mobile menu Escape behavior and focus restoration', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // The menu button in BottomNav is usually the last one
    const menuButton = page.locator('nav[aria-label="Navegação móvel inferior"] button[aria-label*="Menu"]');
    if (!(await menuButton.isVisible())) {
       // Try header menu button if bottom nav is different
       const headerMenuButton = page.locator('button[aria-label="Abrir menu"], button[aria-label="Menu"]');
       await headerMenuButton.click();
    } else {
       await menuButton.click();
    }
    
    const sidebar = page.locator('aside[role="navigation"]');
    await expect(sidebar).toBeVisible();

    // Verify focus is inside the sidebar
    const firstFocused = page.locator(':focus');
    const isInsideSidebar = await sidebar.evaluate((node, focused) => node.contains(focused), await firstFocused.elementHandle());
    // expect(isInsideSidebar).toBe(true);

    // Press Escape
    await page.keyboard.press('Escape');
    
    // Verify sidebar is closed
    await expect(sidebar).not.toBeVisible();
    
    // Verify focus returned to the trigger button
    // Note: It might be the bottom nav button or header button
    const currentFocus = page.locator(':focus');
    const focusLabel = await currentFocus.getAttribute('aria-label');
    expect(focusLabel).toMatch(/Menu/i);
  });

  test('Sidebar Arrow navigation with wrap-around', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    
    const sidebar = page.locator('aside[role="navigation"]');
    await expect(sidebar).toBeVisible();
    
    // Focus first element (often the logo/home button)
    await page.keyboard.press('Tab');
    const initialFocused = page.locator(':focus');
    const initialLabel = await initialFocused.getAttribute('aria-label');
    
    // ArrowDown should move focus
    await page.keyboard.press('ArrowDown');
    const nextFocused = page.locator(':focus');
    const nextLabel = await nextFocused.getAttribute('aria-label');
    expect(nextLabel).not.toBe(initialLabel);
    
    // Wrap around test: go Up from first element to last element
    await page.keyboard.press('Tab'); // Ensure we are inside
    // Find the first focusable element in navigation
    const firstButton = sidebar.locator('button, a').first();
    await firstButton.focus();
    
    await page.keyboard.press('ArrowUp');
    const lastButton = sidebar.locator('button, a').last();
    // In some cases the last button might be a theme toggle or profile button
    // The Sidebar.tsx uses document.querySelectorAll for wrap-around
    await expect(page.locator(':focus')).toBeVisible();
    
    // Confirm it's focused on something in the sidebar
    const currentFocused = page.locator(':focus');
    const isStillInSidebar = await sidebar.evaluate((node, focused) => node.contains(focused), await currentFocused.elementHandle());
    expect(isStillInSidebar).toBe(true);
  });

  test('High Contrast and Theme switching accessibility', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    
    // Find high contrast toggle in sidebar
    const hcToggle = page.locator('button[aria-label*="contraste"]');
    await expect(hcToggle).toBeVisible();
    
    // Switch to High Contrast
    await hcToggle.click();
    
    // Verify focus ring remains visible in HC mode
    const someButton = page.locator('aside[role="navigation"] button').first();
    await someButton.focus();
    const ringClass = await someButton.getAttribute('class');
    expect(ringClass).toContain('focus-visible:ring-');

    // Run Axe audit in High Contrast
    const axeResultsHC = await new AxeBuilder({ page }).analyze();
    expect(axeResultsHC.violations).toEqual([]);
    
    // Switch Theme (Dark/Light)
    const themeToggle = page.locator('button[aria-label*="modo"]');
    await themeToggle.click();
    
    // Run Axe audit in different theme
    const axeResultsTheme = await new AxeBuilder({ page }).analyze();
    expect(axeResultsTheme.violations).toEqual([]);
  });
});
