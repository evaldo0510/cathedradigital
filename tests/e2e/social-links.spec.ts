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
  test('Instagram button on About page triggers analytics event', async ({ page }) => {
    // Capture console logs to verify analytics
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('[Analytics]')) {
        consoleLogs.push(msg.text());
      }
    });

    await page.goto('/sobre');
    
    // Find the Instagram link in the social media section of the About page
    const instagramLink = page.locator('#redes-sociais a[aria-label="Instagram"]');
    await expect(instagramLink).toBeVisible();

    // Click it (we need to handle the new tab if it opens, but we just want to check the click event here)
    // We can use a promise to wait for the event if we want to be very precise, 
    // but checking the logs after click should work.
    await instagramLink.click();

    // The event should look like: [Analytics] Event: social_link_click { platform: 'Instagram', url: 'https://www.instagram.com/cathedradigital/' }
    const expectedUrl = 'https://www.instagram.com/cathedradigital/';
    
    // Give it a small timeout to process the log
    await page.waitForTimeout(500);

    const eventLogged = consoleLogs.some(log => 
      log.includes('social_link_click') && 
      log.includes('Instagram') && 
      log.includes(expectedUrl)
    );

    expect(eventLogged).toBe(true);
  });

  test('Instagram button on About page opens correct URL in a new tab using multi-tab context', async ({ page, context }) => {
    await page.goto('/sobre');

    const instagramLink = page.locator('#redes-sociais a[aria-label="Instagram"]');
    await expect(instagramLink).toBeVisible();

    // Start waiting for the new page (tab) before clicking
    const pagePromise = context.waitForEvent('page');
    
    await instagramLink.click();
    
    const newPage = await pagePromise;
    await newPage.waitForLoadState();

    const expectedUrl = 'https://www.instagram.com/cathedradigital/';
    expect(newPage.url()).toBe(expectedUrl);
    
    // Cleanup the new page
    await newPage.close();
  });
});
