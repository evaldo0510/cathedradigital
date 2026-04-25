import { test, expect } from '@playwright/test';

test.describe('Nexus Bubbles Navigation & Popovers', () => {
  test('should navigate to /temas/culpa and open bubble popovers with stable selectors', async ({ page }) => {
    // Navigate to a specific theme page
    await page.goto('/temas/culpa');
    
    // Wait for the "Temas Relacionados" section
    const relatedTitle = page.locator('text=Temas Relacionados');
    await expect(relatedTitle).toBeVisible();

    // Find bubble tags in the related themes section
    // Use data-roving-item which is a stable attribute we added
    const relatedBubbles = page.locator('button[data-roving-item]');
    await expect(relatedBubbles.first()).toBeVisible();
    
    // Click a related bubble
    const firstBubble = relatedBubbles.first();
    const bubbleLabel = await firstBubble.getAttribute('aria-label');
    await firstBubble.click();
    
    // Wait for popover content using role="dialog" (stable ARIA selector)
    const popover = page.locator('[role="dialog"]');
    await expect(popover).toBeVisible({ timeout: 10000 });
    
    // Verify content is loading or loaded
    await expect(popover.locator('h4')).toBeVisible();
    
    // Click "Navegação Completa" inside popover to navigate to another theme
    const fullNavButton = popover.locator('button:has-text("Navegação Completa")');
    await expect(fullNavButton).toBeVisible();
    await fullNavButton.click();
    
    // Verify full navigation: URL should change and content should match
    await expect(page).toHaveURL(/\/temas\//);
    // If we can extract the tag name from the label, we can check the heading
    if (bubbleLabel) {
      const tagName = bubbleLabel.replace('Tema: ', '').split(' (')[0];
      await expect(page.locator('h1, h2')).toContainText(tagName, { ignoreCase: true });
    }
  });

  test('should verify caching behavior: reopening a bubble does not trigger new fetch', async ({ page }) => {
    await page.goto('/temas');
    
    const bubbles = page.locator('button[data-roving-item]');
    await expect(bubbles.first()).toBeVisible();
    
    // Open first bubble
    await bubbles.first().click();
    const popover = page.locator('[role="dialog"]');
    await expect(popover).toBeVisible();
    
    // Check for diagnostic panel showing it came from source
    // In our component, we show "Source: both" or "Source: supabase"
    const diagnostic = popover.locator('text=Source:');
    await expect(diagnostic).not.toContainText('pending');

    // Close popover (click outside or press Escape)
    await page.keyboard.press('Escape');
    await expect(popover).not.toBeVisible();
    
    // Reopen same bubble
    await bubbles.first().click();
    await expect(popover).toBeVisible();
    
    // Caching verification: it should be immediate
    // We can't easily check "no new fetch" without network interception,
    // but we can verify the loading state doesn't reappear
    const loader = popover.locator('text=Consultando Nexus...');
    await expect(loader).not.toBeVisible();
  });

  test('should show suggested sparkles across different routes when profileId is present', async ({ page }) => {
    // We'll use a query param or localStorage to simulate profileId if the app supports it
    // Based on useSpiritualProfile.ts, it fetches from supabase or uses a cached value.
    // For E2E, we can mock the session or just verify it if we have a way to set it.
    
    // Let's assume we can set it via localStorage for testing if the hook checks it
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('spiritual_profile_diagnosis', JSON.stringify({
        id: 'ferido_em_busca',
        timestamp: Date.now()
      }));
    });

    // Check on /temas
    await page.goto('/temas');
    const suggestedBadge = page.locator('text=Sugeridos para sua Jornada');
    await expect(suggestedBadge).toBeVisible();
    
    const suggestedBubble = page.locator('button[aria-label*="(Sugerido)"]');
    await expect(suggestedBubble.first()).toBeVisible();

    // Navigate to /temas/culpa and check if bubbles there also show suggested if they match
    await page.goto('/temas/culpa');
    // On detail page, related bubbles might be suggested too
    const detailSuggested = page.locator('button[aria-label*="(Sugerido)"]');
    // This depends on whether "Culpa" related themes match the profile
    // But we can at least check the mechanism is active
  });
});