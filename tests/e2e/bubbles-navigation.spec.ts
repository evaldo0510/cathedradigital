import { test, expect } from '@playwright/test';

test.describe('Nexus Bubbles Navigation & Popovers', () => {
  test('should navigate to /temas/culpa and open bubble popovers', async ({ page }) => {
    // Navigate to a specific theme page
    await page.goto('/temas/culpa');
    
    // Wait for the "Temas Relacionados" section
    const relatedTitle = page.locator('text=Temas Relacionados');
    await expect(relatedTitle).toBeVisible();

    // Find bubble tags in the related themes section
    const relatedBubbles = page.locator('aside button[data-roving-item]');
    const count = await relatedBubbles.count();
    console.log(`Found ${count} related bubbles on /temas/culpa`);
    
    if (count > 0) {
      // Click a related bubble
      await relatedBubbles.first().click();
      
      // Wait for popover content
      const popover = page.locator('[role="dialog"], .bg-card\\/90');
      await expect(popover).toBeVisible({ timeout: 10000 });
      
      // Verify content is loading or loaded
      const contentText = await popover.innerText();
      expect(contentText).not.toContain('Referência não encontrada');
      
      // Click "Navegação Completa" inside popover to navigate to another theme
      const fullNavButton = popover.locator('button:has-text("Navegação Completa")');
      if (await fullNavButton.isVisible()) {
        await fullNavButton.click();
        // Should have navigated to another theme page
        await expect(page).toHaveURL(/\/temas\//);
      }
    }
  });

  test('should navigate through bubbles in TemasPage', async ({ page }) => {
    await page.goto('/temas');
    
    // Wait for bubbles to load
    const bubbles = page.locator('button[data-roving-item]');
    await expect(bubbles.first()).toBeVisible({ timeout: 10000 });
    
    // Click a bubble to open popover
    await bubbles.first().click();
    
    const popover = page.locator('[role="dialog"], .bg-card\\/90');
    await expect(popover).toBeVisible();
    
    // Check if suggested sparkle is visible if profileId were present
    // Since we are not logged in here as a specific user with a profile, 
    // we just check that the popover works.
    
    expect(await popover.locator('h4').count()).toBeGreaterThan(0);
  });
});
