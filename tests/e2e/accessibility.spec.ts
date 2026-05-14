import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from '@axe-core/playwright';

test.describe('Home Page Accessibility & Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the hero to be visible at least
    await page.waitForSelector('main#main-content');
  });

  test('full accessibility audit with axe-core', async ({ page }) => {
    await injectAxe(page);
    
    // Check the whole page
    await checkA11y(page, undefined, {
      axeOptions: {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'best-practice']
        }
      },
      detailedReport: true,
      detailedReportOptions: { html: true }
    });
  });

  test('should have a functional skip link as first tabbable element', async ({ page }) => {
    // Reset focus
    await page.keyboard.press('Escape');
    
    // First Tab should hit skip link
    await page.keyboard.press('Tab');
    
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible(); // Should be visible when focused
    
    // Press Enter to skip
    await page.keyboard.press('Enter');
    
    // Focus should move to main content
    const mainContent = page.locator('main#main-content');
    await expect(mainContent).toBeFocused();
  });

  test('logical tab order through the home page', async ({ page }) => {
    // Start from top
    await page.goto('/');
    await page.keyboard.press('Tab'); // Skip link
    
    // Header navigation
    await page.keyboard.press('Tab'); // Logo
    // Navigation links in LandingHeader
    // Depending on screen size, these might change, but let's assume desktop for consistency
    await page.keyboard.press('Tab'); // Funcionalidades (example)
    
    // Move to Hero Section
    const startJourneyBtn = page.getByRole('button', { name: /Iniciar Jornada/i }).first();
    await startJourneyBtn.scrollIntoViewIfNeeded();
    
    // Tab until we reach it
    let attempts = 0;
    while (attempts < 20 && await startJourneyBtn.evaluate(node => document.activeElement !== node)) {
      await page.keyboard.press('Tab');
      attempts++;
    }
    await expect(startJourneyBtn).toBeFocused();
  });

  test('HomeCard and HomeButton respond to Enter and Space', async ({ page }) => {
    // Find a button in the features section (using role button which HomeButton/HomeCard should have)
    // HomeButton uses button tag, HomeCard often has role="button" if clickable
    
    const exploreBtn = page.getByRole('button', { name: /Iniciar Jornada/i }).first();
    await exploreBtn.scrollIntoViewIfNeeded();
    await exploreBtn.focus();
    
    // Test Space
    await page.keyboard.press(' ');
    // In this app, "Iniciar Jornada" opens a GuidedJourney dialog/portal
    // Check if the journey portal/overlay appears
    await expect(page.locator('text=Como podemos ajudar você hoje?')).toBeVisible();
    
    // Close it to reset (if Escape works)
    await page.keyboard.press('Escape');
    await expect(page.locator('text=Como podemos ajudar você hoje?')).not.toBeVisible();

    // Test Enter
    await exploreBtn.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('text=Como podemos ajudar você hoje?')).toBeVisible();
  });

  test('all clickable elements have accessible names and labels', async ({ page }) => {
    const clickables = page.locator('button, a, [role="button"], [role="link"]');
    const count = await clickables.count();
    
    for (let i = 0; i < count; i++) {
      const element = clickables.nth(i);
      // Skip hidden elements (like the skip link when not focused, but axe handles this better)
      if (await element.isVisible()) {
        const name = await element.evaluate(node => {
          // Simplified accessible name calculation
          return node.getAttribute('aria-label') || node.innerText.trim() || node.getAttribute('title');
        });
        expect(name, `Element ${i} is missing an accessible name`).toBeTruthy();
      }
    }
  });
});
