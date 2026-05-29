import { test, expect } from '@playwright/test';

// Define mobile devices to test for visual consistency
const devices = [
  { name: 'iPhone-12-390px', width: 390, height: 844 },
  { name: 'Pixel-5-393px', width: 393, height: 851 },
  { name: 'Small-Mobile-360px', width: 360, height: 740 },
  { name: 'Large-Mobile-430px', width: 430, height: 932 },
];

const routes = {
  home: '/',
  logos: '/logos',
  hoje: '/hoje',
};

// Selectors to mask for stability (dates, random quotes, etc.)
const MASK_SELECTORS = [
  '.dynamic-date',
  '.dynamic-quote',
  '.user-name',
  '.streak-count',
  '.xp-count',
  '[data-testid="liturgy-text"]',
  '[data-testid="saint-of-the-day-name"]',
  '.saint-of-the-day-card h4',
  '.saint-of-the-day-card p',
  '.liturgia-content',
  '.diario-entry-date',
  '#ritual-do-dia blockquote', // Content changes daily
  '.bible-verse-text',
];

test.describe('Mobile Visual Regression - Layout Stability', () => {
  for (const device of devices) {
    test.describe(`${device.name} (${device.width}x${device.height})`, () => {
      test.use({ viewport: { width: device.width, height: device.height } });

      test('Home Page - Mobile Scale & Padding', async ({ page }) => {
        await page.goto(routes.home);
        await page.waitForLoadState('networkidle');
        // Wait for animations to finish
        await page.waitForTimeout(3000);
        
        // Take screenshot of the top fold to check Hero & first card
        // We compare against baseline to ensure rhythm stability
        await expect(page).toHaveScreenshot(`mobile-home-top-${device.name}.png`, {
          maxDiffPixelRatio: 0.02, // Stricter for rhythm consistency
          mask: MASK_SELECTORS.map(s => page.locator(s)),
          fullPage: false,
        });

        // Check full page scroll length (roughly)
        const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
        console.log(`Home scroll height on ${device.name}: ${scrollHeight}px`);
        
        // Ensure scroll height isn't excessive (heuristic check)
        // Adjusting threshold based on content, but we want to see it decrease
        expect(scrollHeight).toBeLessThan(8000); 
      });

      test('Logos IA (Chat) - Mobile Scale & Hierarchy', async ({ page }) => {
        await page.goto(routes.logos);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
        
        await expect(page).toHaveScreenshot(`mobile-logos-chat-${device.name}.png`, {
          maxDiffPixelRatio: 0.05,
          mask: MASK_SELECTORS.map(s => page.locator(s)),
        });
      });

      test('Ritual do Dia - Mobile Density', async ({ page }) => {
        // Find Ritual section on home or go to dedicated if exists
        await page.goto(routes.home);
        const ritual = page.locator('#ritual-do-dia');
        await ritual.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1000);
        
        await expect(ritual).toHaveScreenshot(`mobile-ritual-card-${device.name}.png`, {
          maxDiffPixelRatio: 0.05,
          mask: MASK_SELECTORS.map(s => page.locator(s)),
        });
      });
    });
  }
});
