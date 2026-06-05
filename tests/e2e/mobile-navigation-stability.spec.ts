import { test, expect } from '@playwright/test';

/**
 * .CRITICAL MOBILE NAVIGATION BUG
 * Reported issue: System navigates to CIC (Catechism) without explicit user request.
 * This test suite investigates potential causes and ensures deliberate navigation.
 */
test.describe('Mobile Navigation Stability (Bible to CIC)', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport as navigation logic often depends on window.innerWidth
    await page.setViewportSize({ width: 390, height: 844 });
    // Force PT language for consistent labels
    await page.goto('/bible?lang=pt');
    await page.waitForLoadState('networkidle');
  });

  test('should NOT navigate to CIC automatically on idle in Bible', async ({ page }) => {
    // Check initial state
    await expect(page).toHaveURL(/\/bible/);
    
    // Wait for 5 seconds to see if any automatic redirection occurs
    await page.waitForTimeout(5000);
    
    // Should still be in Bible
    await expect(page).toHaveURL(/\/bible/);
  });

  test('should NOT navigate to CIC on vertical scroll in Bible', async ({ page }) => {
    // Wait for content
    await page.waitForSelector('text="Bíblia Sagrada"', { timeout: 15000 }).catch(() => {});
    
    // Perform multiple vertical scrolls
    for (let i = 0; i < 3; i++) {
      await page.mouse.wheel(0, 500);
      await page.waitForTimeout(500);
    }
    
    // Should still be in Bible
    await expect(page).toHaveURL(/\/bible/);
  });

  test('should NOT navigate to CIC on subtle horizontal movements (stray touches)', async ({ page }) => {
    // Swipe logic in SwipeNavigation.tsx requires:
    // 1. Math.abs(info.offset.x) > Math.abs(info.offset.y) * 2
    // 2. info.offset.x < -threshold (80px)
    
    // Perform a small horizontal swipe (less than threshold)
    await page.mouse.move(200, 400);
    await page.mouse.down();
    await page.mouse.move(150, 400, { steps: 5 }); // 50px movement < 80px threshold
    await page.mouse.up();
    
    // Should still be in Bible
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/bible/);
  });

  test('should ONLY navigate to CIC on deliberate swipe left (Next)', async ({ page }) => {
    // Perform a large horizontal swipe left (drag from right to left)
    // SwipeNavigation order: Hoje (/) -> Bible (/bible) -> Catechism (/catechism)
    await page.mouse.move(350, 400);
    await page.mouse.down();
    await page.mouse.move(50, 400, { steps: 10 }); // 300px movement > 80px threshold
    await page.mouse.up();
    
    // Verify deliberate navigation to Catechism
    await expect(page).toHaveURL(/\/catechism/);
  });

  test('should NOT navigate to CIC when interacting with Bible Dictionary (Popovers)', async ({ page }) => {
    // This checks if touching a popover trigger or its content causes an accidental swipe
    
    // 1. Select a book to enter reading mode
    const bookBtn = page.locator('button:has-text("João")').first();
    if (await bookBtn.isVisible()) {
      await bookBtn.click();
      await page.waitForURL(/\/bible\?book=/);
    }
    
    // 2. Find a dictionary term (e.g., "Jesus", "Deus")
    const term = page.locator('button.underline').first();
    if (await term.isVisible()) {
      // Tap the term
      await term.click();
      
      // Wait to see if popover opens
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      
      // Interact inside popover (simulating reading/tapping)
      await page.mouse.click(200, 500); // Click inside common popover area
      
      // Close popover
      await page.keyboard.press('Escape');
      
      // Should still be in Bible
    }
    
    await expect(page).toHaveURL(/\/bible/);
  });

  test('should NOT navigate to CIC when interacting with Reading Settings', async ({ page }) => {
    // Check if toggling theme or font size triggers route change
    
    // Open reading settings
    const settingsBtn = page.locator('button[title="Configurações de Leitura"]').first();
    if (await settingsBtn.isVisible()) {
      await settingsBtn.click();
      
      // Toggle a theme (e.g., Pergaminho/Sepia)
      const sepiaBtn = page.locator('button:has-text("Pergaminho")');
      await sepiaBtn.click();
      
      // Should still be in Bible
      await expect(page).toHaveURL(/\/bible/);
    }
  });

  test('should NOT navigate to CIC when BottomNav items are clicked (except Catechism)', async ({ page }) => {
    // Click "Hoje" in BottomNav
    const hojeBtn = page.locator('button[aria-label="Hoje"]');
    await hojeBtn.click();
    await expect(page).toHaveURL(/\/hoje|^\/$/);
    
    // Navigate back to Bible
    await page.goto('/bible?lang=pt');
    
    // Click "Bíblia" (current page)
    const bibleBtn = page.locator('button[aria-label="Bíblia"]');
    await bibleBtn.click();
    
    // Should stay in Bible
    await expect(page).toHaveURL(/\/bible/);
  });
});
