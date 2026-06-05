import { test, expect } from '@playwright/test';

/**
 * .CRITICAL MOBILE NAVIGATION BUG
 * Reported issue: System navigates to CIC (Catechism) without explicit user request.
 * Investigation focuses on identifying accidental navigation triggers.
 */
test.describe('Mobile Navigation Stability (Bible to CIC)', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport as navigation logic often depends on window.innerWidth
    await page.setViewportSize({ width: 390, height: 844 });
    // Navigate to Bible
    await page.goto('/bible?lang=pt');
    await page.waitForLoadState('networkidle');
  });

  test('should NOT navigate to CIC automatically on idle in Bible', async ({ page }) => {
    // Check initial state
    await expect(page.url()).toContain('/bible');
    
    // Wait for 5 seconds to see if any automatic redirection occurs
    await page.waitForTimeout(5000);
    
    // Should still be in Bible
    await expect(page.url()).toContain('/bible');
  });

  test('should NOT navigate to CIC on vertical scroll in Bible', async ({ page }) => {
    // Perform multiple vertical scrolls
    for (let i = 0; i < 3; i++) {
      await page.mouse.wheel(0, 800);
      await page.waitForTimeout(500);
    }
    
    // Should still be in Bible
    await expect(page.url()).toContain('/bible');
  });

  test('should NOT navigate to CIC on subtle horizontal movements (stray touches)', async ({ page }) => {
    // Perform a small horizontal swipe (less than 80px threshold in SwipeNavigation.tsx)
    await page.mouse.move(250, 400);
    await page.mouse.down();
    await page.mouse.move(200, 400, { steps: 10 }); // 50px movement
    await page.mouse.up();
    
    // Should still be in Bible
    await page.waitForTimeout(1000);
    await expect(page.url()).toContain('/bible');
  });

  test('should ONLY navigate to CIC on deliberate swipe left (Next)', async ({ page }) => {
    // SwipeNavigation order: Hoje (/) -> Bible (/bible) -> Catechism (/catechism)
    // Drag from right (350) to left (50) = 300px > 80px threshold
    await page.mouse.move(350, 400);
    await page.mouse.down();
    await page.mouse.move(50, 400, { steps: 20 });
    await page.mouse.up();
    
    // Verify deliberate navigation to Catechism
    await expect(page.url()).toContain('/catechism');
  });

  test('should NOT navigate to CIC when interacting with Bible Dictionary', async ({ page }) => {
    // Open a book to enter reading mode
    const bookBtn = page.locator('button:has-text("João")').first();
    if (await bookBtn.isVisible()) {
      await bookBtn.click();
      await page.waitForURL(/\/bible\?book=/);
    }
    
    // Look for a dictionary term (underline button)
    const term = page.locator('button.underline').first();
    if (await term.isVisible()) {
      await term.click();
      
      // Interact inside popover area
      await page.mouse.click(200, 500);
      
      // Close popover
      await page.keyboard.press('Escape');
    }
    
    // Should still be in Bible
    await expect(page.url()).toContain('/bible');
  });

  test('should NOT navigate to CIC when interacting with Reading Settings', async ({ page }) => {
    // Open settings (Estética button)
    const settingsBtn = page.locator('button:has-text("Estética")').first();
    if (await settingsBtn.isVisible()) {
      await settingsBtn.click();
      
      // Toggle a font size
      const sizeBtn = page.locator('button:has-text("A+")');
      if (await sizeBtn.isVisible()) {
        await sizeBtn.click();
      }
      
      // Should still be in Bible
      await expect(page.url()).toContain('/bible');
    }
  });

  test('should NOT navigate to CIC when BottomNav items are clicked (except Catechism)', async ({ page }) => {
    // Click "Hoje" in BottomNav
    const hojeBtn = page.locator('button[aria-label="Hoje"]');
    if (await hojeBtn.isVisible()) {
      await hojeBtn.click();
      await expect(page.url()).toContain('/hoje');
    }
  });
});
