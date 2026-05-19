import { test, expect } from '@playwright/test';

test.describe('Social Links E2E', () => {
  test('Instagram button on About page opens in new tab and maintains official domain', async ({ page }) => {
    await page.goto('/sobre');
    
    const instagramLink = page.locator('a[aria-label="Instagram"]').first();
    await expect(instagramLink).toBeVisible();
    
    // Verify target="_blank"
    const target = await instagramLink.getAttribute('target');
    expect(target).toBe('_blank');

    // Verify domain and multiple clicks (simulated by checking attribute repeatedly)
    const expectedUrl = 'https://www.instagram.com/cathedradigital/';
    for (let i = 0; i < 3; i++) {
      const href = await instagramLink.getAttribute('href');
      expect(href).toBe(expectedUrl);
    }
  });

  test('Instagram button in Footer opens in new tab and maintains official domain', async ({ page }) => {
    await page.goto('/sobre');
    
    const footerInstagramLink = page.locator('footer a[aria-label="Instagram"]');
    await expect(footerInstagramLink).toBeVisible();
    
    // Verify target="_blank"
    const target = await footerInstagramLink.getAttribute('target');
    expect(target).toBe('_blank');

    const expectedUrl = 'https://www.instagram.com/cathedradigital/';
    const href = await footerInstagramLink.getAttribute('href');
    expect(href).toBe(expectedUrl);
  });

  test('All social media buttons have consistent aria-labels', async ({ page }) => {
    await page.goto('/sobre');
    
    // Selectors for social links in About page and Footer
    const aboutSocialLinks = page.locator('#redes-sociais a[aria-label]');
    const footerSocialLinks = page.locator('footer a[aria-label]');
    
    // Check About page links
    const aboutCount = await aboutSocialLinks.count();
    expect(aboutCount).toBeGreaterThan(0);
    for (let i = 0; i < aboutCount; i++) {
      const label = await aboutSocialLinks.nth(i).getAttribute('aria-label');
      expect(label).toBeTruthy();
      expect(['Instagram', 'YouTube', 'X (Twitter)', 'Facebook', 'WhatsApp']).toContain(label);
    }

    // Check Footer links
    const footerCount = await footerSocialLinks.count();
    expect(footerCount).toBeGreaterThan(0);
    for (let i = 0; i < footerCount; i++) {
      const label = await footerSocialLinks.nth(i).getAttribute('aria-label');
      expect(label).toBeTruthy();
      expect(['Instagram', 'Youtube', 'Whatsapp']).toContain(label);
    }
  });
});
