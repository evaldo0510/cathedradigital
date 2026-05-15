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
    await page.goto('/');
    // Wait for fonts to ensure visual stability
    await page.evaluate(() => document.fonts.ready);
  });

  test('Layout Stability (CLS) - Hero Section', async ({ page }) => {
    // Measure Layout Shift during loading
    const cls = await page.evaluate(() => {
      return new Promise((resolve) => {
        let cumulativeLayoutShift = 0;
        new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              cumulativeLayoutShift += (entry as any).value;
            }
          }
        }).observe({ type: 'layout-shift', buffered: true });
        
        // Wait 3 seconds to capture any shifts
        setTimeout(() => resolve(cumulativeLayoutShift), 3000);
      });
    });

    // CLS should be under 0.1 for good UX
    expect(cls).toBeLessThan(0.1);
  });

  test('Logged-out Home: Visual Consistency & Navigation', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const theme = await page.evaluate(() => document.documentElement.classList.contains('dark') ? 'dark' : 'light');

    // 1. Visual Regression by Section (with Theme)
    for (const section of HOME_SECTIONS) {
      const locator = page.locator(section.selector);
      if (await locator.isVisible()) {
        const maskSelectors = [];
        if (section.name === 'RitualDoDia') {
          maskSelectors.push(locator.locator('blockquote'));
          maskSelectors.push(locator.locator('p.font-reader'));
          maskSelectors.push(locator.locator('img'));
        }
        if (section.name === 'Hero') {
          maskSelectors.push(locator.locator('img'));
        }

        await expect(locator).toHaveScreenshot(`home-${section.name}-logged-out-${theme}.png`, {
          mask: maskSelectors.length > 0 ? maskSelectors : undefined,
          animations: 'disabled',
        });
      }
    }

    // 2. Navigation Validation for cards
    const cardSelectors = [
      'section[aria-labelledby="section-jornada"] .group',
      'section[aria-labelledby="section-doutrina"] .group',
      'section[aria-labelledby="section-trilhas"] .group'
    ];

    for (const selector of cardSelectors) {
      const card = page.locator(selector).first();
      if (await card.isVisible()) {
        const initialUrl = page.url();
        await card.click();
        await page.waitForTimeout(500);
        expect(page.url()).not.toBe(initialUrl);
        await page.goto('/'); // Back to home
        await page.waitForLoadState('networkidle');
      }
    }
  });

  test('Logged-in Home: Visual Consistency & Navigation', async ({ page }) => {
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

    const theme = await page.evaluate(() => document.documentElement.classList.contains('dark') ? 'dark' : 'light');

    // 1. Visual Regression for Logged-in state
    for (const section of HOME_SECTIONS) {
      const locator = page.locator(section.selector);
      if (await locator.isVisible()) {
        const maskSelectors = [];
        if (section.name === 'RitualDoDia') {
          maskSelectors.push(locator.locator('blockquote'));
          maskSelectors.push(locator.locator('p.font-reader'));
          maskSelectors.push(locator.locator('img'));
        }
        
        await expect(locator).toHaveScreenshot(`home-${section.name}-logged-in-${theme}.png`, {
          mask: maskSelectors.length > 0 ? maskSelectors : undefined,
          animations: 'disabled',
        });
      }
    }

    // 2. Navigation Validation for "Continuar" Button in Jornada
    const continueBtn = page.locator('section[aria-labelledby="section-jornada"] button').first();
    const initialUrl = page.url();
    await continueBtn.click();
    await page.waitForTimeout(500);
    expect(page.url()).not.toBe(initialUrl);
  });

  test('A11y & Focus States', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Focus visible check
    const buttons = page.locator('button').all();
    for (const btn of (await buttons).slice(0, 5)) {
      await btn.focus();
      const hasFocusRing = await btn.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.outlineStyle !== 'none' || style.boxShadow !== 'none' || style.borderWidth !== '0px';
      });
      expect(hasFocusRing, 'Button focus should be visible').toBe(true);
    }

    // ARIA labels check for icons/images
    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');
      if (role !== 'presentation') {
        expect(alt || role === 'img', 'Non-decorative image should have alt or role="img"').toBeTruthy();
      }
    }
  });
});
