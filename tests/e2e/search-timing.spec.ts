import { test, expect } from '@playwright/test';

test('search results have progressive delay', async ({ page }) => {
  // We use the preview URL provided by the environment
  const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:8080';
  await page.goto(`${baseUrl}/buscar`);

  // Type 'tomas' in the search input
  const searchInput = page.getByPlaceholder(/Buscar santos, termos, discussões/i);
  await searchInput.fill('tomas');

  // Wait for results to start appearing
  // We'll look for SearchResultCards. They are motion.div/Card.
  // We can identify them by their role or text.
  const cards = page.locator('.cursor-pointer.hover\\:bg-muted\\/30');
  
  // Wait for at least one card to appear to confirm search worked
  await expect(cards.first()).toBeVisible();

  const count = await cards.count();
  console.log(`Found ${count} cards`);

  if (count > 1) {
    for (let i = 0; i < Math.min(count, 5); i++) {
      const card = cards.nth(i);
      const expectedDelay = i * 40; // index * 0.04s = i * 40ms
      
      // Before expected delay (minus a small buffer), it should not be fully visible (opacity 0)
      // Note: framer-motion starts at opacity 0.
      // This is tricky to test exactly because Playwright's toBeVisible() checks if it's in the DOM and has size.
      // We might need to check the computed style 'opacity'.
      
      if (i > 0) {
        const startTime = Date.now();
        // Check halfway through the expected delay
        await page.waitForTimeout(Math.max(0, (i * 40) - 20));
        const opacity = await card.evaluate(el => window.getComputedStyle(el).opacity);
        // It might already be starting to fade in, but let's check if it's "low"
        // Actually, if we want to be strict: "nenhum card é exibido antes do tempo esperado"
        expect(parseFloat(opacity)).toBeLessThan(1);
      }

      // After expected delay (plus buffer for animation and execution overhead)
      await expect(card).toBeVisible({ timeout: 1000 });
    }
  }
});
