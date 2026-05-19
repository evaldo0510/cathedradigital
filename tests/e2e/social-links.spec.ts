import { test, expect } from '@playwright/test';

test.describe('Social Links E2E', () => {
  test('Instagram button on About page points to correct official domain', async ({ page }) => {
    // Navigate to the About page
    // Using a relative path which Playwright will resolve against the baseUrl
    await page.goto('/sobre');
    
    // Find the Instagram link in the "Redes Sociais" section
    // We added aria-label="Instagram" to it in the previous step
    const instagramLink = page.locator('a[aria-label="Instagram"]').first();
    
    // Verify the href attribute
    const href = await instagramLink.getAttribute('href');
    expect(href).toBe('https://www.instagram.com/cathedradigital/');
    
    // Optional: Check if it's visible and clickable
    await expect(instagramLink).toBeVisible();
  });

  test('Instagram button in Footer points to correct official domain', async ({ page }) => {
    // Navigate to any page that has a footer (About page has one)
    await page.goto('/sobre');
    
    // Find the Instagram link in the footer
    // In Footer.tsx we also added aria-label="Instagram"
    const footerInstagramLink = page.locator('footer a[aria-label="Instagram"]');
    
    // Verify the href attribute
    const href = await footerInstagramLink.getAttribute('href');
    expect(href).toBe('https://www.instagram.com/cathedradigital/');
  });
});
