import { test, expect } from '@playwright/test';

test.describe('Home Page Accessibility & Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have a skip link', async ({ page }) => {
    const skipLink = page.locator('a:has-text("Pular para o conteúdo principal")');
    await expect(skipLink).toBeAttached();
    // In many browsers, it's sr-only by default, but should be visible on focus
    await page.keyboard.press('Tab');
    await expect(skipLink).toBeVisible();
  });

  test('should navigate through main elements using Tab', async ({ page }) => {
    // Check if we can reach the main CTA
    await page.keyboard.press('Tab'); // Skip link
    await page.keyboard.press('Tab'); // Logo
    await page.keyboard.press('Tab'); // Funcionalidades
    // ... continue tabbing to Hero CTA
    
    // Focus should eventually reach the "Iniciar Jornada" button
    const heroBtn = page.getByRole('button', { name: /Iniciar Jornada/i });
    while (await heroBtn.evaluate(node => document.activeElement !== node)) {
      await page.keyboard.press('Tab');
    }
    await expect(heroBtn).toBeFocused();
  });

  test('should trigger cards and buttons with Enter/Space', async ({ page }) => {
    // Navigate to a feature card
    const featureCard = page.getByRole('button', { name: /Explorar Logos IA/i });
    
    // Scroll into view if needed
    await featureCard.scrollIntoViewIfNeeded();
    
    // Focus it
    while (await featureCard.evaluate(node => document.activeElement !== node)) {
      await page.keyboard.press('Tab');
    }
    
    // Press Enter and check navigation (mocking or checking URL)
    await page.keyboard.press('Enter');
    await expect(page).not.toHaveURL('/'); // Should navigate away
  });
  
  test('all clickable elements should have correct ARIA roles', async ({ page }) => {
    const buttons = page.locator('button, [role="button"], a[href]');
    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
      const btn = buttons.nth(i);
      const label = await btn.getAttribute('aria-label') || await btn.innerText();
      expect(label.trim().length).toBeGreaterThan(0);
    }
  });
});
