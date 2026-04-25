import { test, expect } from '@playwright/test';

test.describe('E2E Fast Keyboard Navigation & Focus', () => {
  test('should navigate rapidly with arrows and maintain correct focus', async ({ page }) => {
    await page.goto('/temas');
    
    // Select the list of tags
    const tags = page.locator('button[data-roving-item="true"]');
    await expect(tags.first()).toBeVisible();
    
    // Start focus on the first tag
    await tags.first().focus();
    await expect(tags.first()).toBeFocused();
    
    // Simulate rapid navigation (right, right, right)
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    
    // Verify focus is on the 4th item (index 3)
    if (await tags.count() >= 4) {
      await expect(tags.nth(3)).toBeFocused();
      await expect(tags.nth(3)).toHaveAttribute('tabindex', '0');
    }
    
    // Test Home key
    await page.keyboard.press('Home');
    await expect(tags.first()).toBeFocused();
    
    // Test End key
    await page.keyboard.press('End');
    const count = await tags.count();
    await expect(tags.nth(count - 1)).toBeFocused();
  });

  test('should activate bubble and verify popover content', async ({ page }) => {
    await page.goto('/hoje');
    
    const bubbles = page.locator('button[data-roving-item]');
    if (await bubbles.count() > 0) {
      const firstBubble = bubbles.first();
      await firstBubble.click();
      
      // Wait for popover to open and show diagnostic info
      const diagnostic = page.locator('text=Time:');
      await expect(diagnostic).toBeVisible({ timeout: 15000 });
      
      // Verify no "Reference not found" error
      const content = await page.innerText('body');
      expect(content).not.toContain('Referência não encontrada');
    }
  });
});
