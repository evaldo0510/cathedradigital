import { test, expect } from '@playwright/test';

test.describe('Nexus Bubbles Diagnostic & Content', () => {
  test('should load bubbles and show content on click without "Referência não encontrada"', async ({ page }) => {
    // Navigate to dashboard where NexusBubbles are visible
    await page.goto('/hoje');
    
    // Wait for the NexusBubbles section to render
    const nexusTitle = page.locator('text=Nexus Theologicus');
    await expect(nexusTitle).toBeVisible();

    // Find all bubble tags
    const bubbles = page.locator('button[data-roving-item]');
    const count = await bubbles.count();
    console.log(`Found ${count} bubbles on dashboard`);
    
    if (count > 0) {
      // Click the first bubble
      await bubbles.first().click();
      
      // Wait for popover content
      const popover = page.locator('[role="dialog"], .bg-card\\/90'); // Based on PopoverContent classes
      await expect(popover).toBeVisible({ timeout: 10000 });
      
      // Check for errors or empty references
      const contentText = await popover.innerText();
      expect(contentText).not.toContain('Referência não encontrada');
      expect(contentText).not.toContain('Erro ao carregar');
      
      // Verify if some content or insight appeared
      const hasContent = await popover.locator('p').count() > 0;
      expect(hasContent).toBeTruthy();
    }
  });

  test('should navigate to themes page and verify roving tabindex', async ({ page }) => {
    await page.goto('/temas');
    
    const firstTag = page.locator('button[data-roving-item="true"]').first();
    await expect(firstTag).toBeVisible();
    
    // Initial focusable item
    await expect(firstTag).toHaveAttribute('tabindex', '0');
    
    // Press ArrowRight
    await page.keyboard.press('ArrowRight');
    
    // Check if second tag is now active (assuming at least 2 tags exist)
    const tags = page.locator('button[data-roving-item="true"]');
    if (await tags.count() > 1) {
      await expect(tags.nth(1)).toHaveAttribute('tabindex', '0');
      await expect(firstTag).toHaveAttribute('tabindex', '-1');
    }
  });
});
