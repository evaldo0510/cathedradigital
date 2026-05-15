import { test, expect } from '@playwright/test';

const HOME_SECTIONS = [
  { name: 'Hero', selector: '#hero' },
  { name: 'ContinueJornada', selector: 'section[aria-labelledby="section-jornada"]' },
  { name: 'RitualDoDia', selector: 'section[aria-labelledby="section-hoje"]' },
  { name: 'Catecismo', selector: 'section[aria-labelledby="section-doutrina"]' },
  { name: 'Trilhas', selector: 'section[aria-labelledby="section-trilhas"]' },
];

test.describe('Home Page Premium Audit', () => {
  test.beforeEach(async ({ page }) => {
    // Wait for fonts to load to ensure visual stability
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
  });

  test('Logged-out Home: Visual Consistency, Interactions & A11y', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Wait for initial animations

    // 1. Accessibility: ARIA Labels & Alt Text
    const images = page.locator('img');
    const imageCount = await images.count();
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      // If image is not explicitly decorative (role="presentation"), it should have alt text
      const role = await img.getAttribute('role');
      if (role !== 'presentation') {
        expect(alt, `Image ${i} is missing alt text`).toBeTruthy();
      }
    }

    const sections = page.locator('section');
    const sectionCount = await sections.count();
    for (let i = 0; i < sectionCount; i++) {
      const section = sections.nth(i);
      const ariaLabelledBy = await section.getAttribute('aria-labelledby');
      const ariaLabel = await section.getAttribute('aria-label');
      expect(ariaLabelledBy || ariaLabel, `Section ${i} is missing accessible name`).toBeTruthy();
    }

    // 2. Interactions: Enter and Space on Cards
    const cards = page.locator('.group.cursor-pointer, [role="button"]');
    const cardCount = await cards.count();
    
    if (cardCount > 0) {
      const firstCard = cards.first();
      const initialUrl = page.url();

      // Test Space key
      await firstCard.focus();
      await page.keyboard.press(' ');
      await page.waitForTimeout(500);
      expect(page.url()).not.toBe(initialUrl);

      // Go back for next test
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Test Enter key
      const secondCard = cards.nth(Math.min(1, cardCount - 1));
      await secondCard.focus();
      const secondInitialUrl = page.url();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      expect(page.url()).not.toBe(secondInitialUrl);
    }

    // 3. Focus Visibility
    const actionableElements = page.locator('button, a, [role="button"]');
    const actionCount = await actionableElements.count();
    for (let i = 0; i < Math.min(actionCount, 5); i++) {
      const el = actionableElements.nth(i);
      await el.focus();
      const isVisible = await el.evaluate(node => {
        const style = window.getComputedStyle(node);
        return style.outlineStyle !== 'none' || style.boxShadow !== 'none' || style.borderWidth !== '0px';
      });
      expect(isVisible, `Element ${i} focus not visible`).toBe(true);
    }

    // 4. Visual Regression by Section
    for (const section of HOME_SECTIONS) {
      const locator = page.locator(section.selector);
      if (await locator.isVisible()) {
        const maskSelectors = [];
        if (section.name === 'RitualDoDia') {
          maskSelectors.push(locator.locator('blockquote'));
          maskSelectors.push(locator.locator('p.font-reader'));
          maskSelectors.push(locator.locator('img'));
          maskSelectors.push(locator.locator('h3'));
        }
        if (section.name === 'Hero') {
          maskSelectors.push(locator.locator('img'));
        }

        await expect(locator).toHaveScreenshot(`home-${section.name}-logged-out.png`, {
          mask: maskSelectors.length > 0 ? maskSelectors : undefined,
          animations: 'disabled',
        });
      }
    }
  });

  test('Logged-in Home: Visual Consistency', async ({ page }) => {
    // Mock auth session
    await page.addInitScript(() => {
      const session = {
        access_token: 'fake-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'fake-refresh',
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          app_metadata: {},
          user_metadata: { name: 'Test User' },
          aud: 'authenticated',
          role: 'authenticated'
        }
      };
      window.localStorage.setItem('sb-gpwrpmoniglarqwfyryp-auth-token', JSON.stringify(session));
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);

    const sectionJornada = page.locator('section[aria-labelledby="section-jornada"]');
    await expect(sectionJornada).toContainText(/Retomar Jornada|Continuar/);

    for (const section of HOME_SECTIONS) {
      const locator = page.locator(section.selector);
      if (await locator.isVisible()) {
        const maskSelectors = [];
        if (section.name === 'RitualDoDia') {
          maskSelectors.push(locator.locator('blockquote'));
          maskSelectors.push(locator.locator('p.font-reader'));
          maskSelectors.push(locator.locator('img'));
        }
        
        await expect(locator).toHaveScreenshot(`home-${section.name}-logged-in.png`, {
          mask: maskSelectors.length > 0 ? maskSelectors : undefined,
          animations: 'disabled',
        });
      }
    }
  });
});
