import { test, expect } from '@playwright/test';

/**
 * E2E test to verify progressive delay in search results.
 * Each result at index 'i' should have a delay of 'i * 0.04s'.
 * We verify that cards are not fully visible before their expected time.
 */
test('search results appear with progressive delay', async ({ page }) => {
  // Navigate to the search page
  await page.goto('/buscar');

  // Find the search input and type 'tomas'
  const searchInput = page.getByPlaceholder(/Buscar santos, termos, discussões/i);
  await searchInput.fill('tomas');

  // Locate result cards
  // The cards have a specific class from SearchResultCard.tsx
  const cards = page.locator('.cursor-pointer.hover\\:bg-muted\\/30');
  
  // Wait for the first card to be at least present in the DOM
  await cards.first().waitFor({ state: 'attached' });

  const count = await cards.count();
  console.log(`Verified ${count} results found.`);

  // We check the first few results for timing
  for (let i = 0; i < Math.min(count, 5); i++) {
    const card = cards.nth(i);
    const expectedDelayMs = i * 40; // index * 0.04s = i * 40ms

    if (i > 0) {
      // Small buffer to check just before the expected animation start
      const checkTime = Math.max(0, expectedDelayMs - 15);
      await page.waitForTimeout(checkTime);
      
      // Check opacity. It should be 0 or very close to it before the delay kicks in.
      // framer-motion sets initial opacity to 0.
      const opacity = await card.evaluate(el => window.getComputedStyle(el).opacity);
      expect(parseFloat(opacity), `Card at index ${i} should not be visible before ${expectedDelayMs}ms`).toBeLessThan(0.1);
    }

    // Now wait for it to become visible
    // We allow some extra time for the spring animation to actually make it visible
    await expect(card).toBeVisible({ timeout: 1000 });
    
    const finalOpacity = await card.evaluate(el => window.getComputedStyle(el).opacity);
    expect(parseFloat(finalOpacity), `Card at index ${i} should be visible after its delay`).toBeGreaterThan(0.5);
  }
});
