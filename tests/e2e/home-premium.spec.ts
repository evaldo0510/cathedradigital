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
    await page.evaluate(() => document.fonts.ready);
  });

  test('Layout Stability (CLS) - Hero Section', async ({ page }) => {
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
        
        setTimeout(() => resolve(cumulativeLayoutShift), 2500);
      });
    });

    // Premium threshold: CLS < 0.1
    expect(cls).toBeLessThan(0.1);
  });

  const runNavigationTests = (isLoggedIn: boolean) => {
    const state = isLoggedIn ? 'logged-in' : 'logged-out';

    test(`${state} - Keyboard & Click Navigation on all CTAs`, async ({ page }) => {
      if (isLoggedIn) {
        await page.addInitScript(() => {
          const session = {
            access_token: 'fake-token',
            token_type: 'bearer',
            expires_in: 3600,
            user: {
              id: 'test-user',
              email: 'test@example.com',
              user_metadata: { name: 'Test' },
              role: 'authenticated'
            }
          };
          window.localStorage.setItem('sb-gpwrpmoniglarqwfyryp-auth-token', JSON.stringify(session));
        });
        await page.reload();
      }

      await page.waitForLoadState('networkidle');

      // Identify all primary CTAs and Cards
      const ctas = [
        { name: 'Jornada Card', selector: 'section[aria-labelledby="section-jornada"] .group' },
        { name: 'Jornada Button', selector: 'section[aria-labelledby="section-jornada"] button' },
        { name: 'Doutrina Card', selector: 'section[aria-labelledby="section-doutrina"] .group' },
        { name: 'Doutrina Button', selector: 'section[aria-labelledby="section-doutrina"] button' },
        { name: 'Temas Card', selector: 'section[aria-labelledby="section-trilhas"] .group:has-text("Temas")' },
        { name: 'Bíblia Card', selector: 'section[aria-labelledby="section-trilhas"] .group:has-text("Bíblico")' }
      ];

      for (const cta of ctas) {
        const locator = page.locator(cta.selector).first();
        if (await locator.isVisible()) {
          const initialUrl = page.url();
          
          // 1. Test Click
          await locator.click();
          await page.waitForTimeout(300);
          expect(page.url(), `Click on ${cta.name} should navigate`).not.toBe(initialUrl);
          await page.goBack();
          await page.waitForLoadState('networkidle');

          // 2. Test Enter Key
          await locator.focus();
          await page.keyboard.press('Enter');
          await page.waitForTimeout(300);
          expect(page.url(), `Enter on ${cta.name} should navigate`).not.toBe(initialUrl);
          await page.goBack();
          await page.waitForLoadState('networkidle');

          // 3. Test Space Key
          await locator.focus();
          await page.keyboard.press(' ');
          await page.waitForTimeout(300);
          expect(page.url(), `Space on ${cta.name} should navigate`).not.toBe(initialUrl);
          await page.goBack();
          await page.waitForLoadState('networkidle');
        }
      }
    });
  };

  test.describe('Logged-out Navigation', () => {
    runNavigationTests(false);
  });

  test.describe('Logged-in Navigation', () => {
    runNavigationTests(true);
  });

  test('Visual Regression - Themes & Sections', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const theme = await page.evaluate(() => document.documentElement.classList.contains('dark') ? 'dark' : 'light');

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

        await expect(locator).toHaveScreenshot(`home-${section.name}-${theme}.png`, {
          mask: maskSelectors.length > 0 ? maskSelectors : undefined,
          animations: 'disabled',
        });
      }
    }
  });
});
