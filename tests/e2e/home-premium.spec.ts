import { test, expect } from '@playwright/test';
import { AppRoute } from '../../src/types';

const HOME_SECTIONS = [
  { name: 'Hero', selector: '#hero' },
  { name: 'ContinueJornada', selector: 'section[aria-labelledby="section-jornada"]' },
  { name: 'RitualDoDia', selector: 'section[aria-labelledby="section-hoje"]' },
  { name: 'Catecismo', selector: 'section[aria-labelledby="section-doutrina"]' },
  { name: 'Trilhas', selector: 'section[aria-labelledby="section-trilhas"]' },
];

const NAVIGATION_TARGETS = [
  { 
    name: 'Jornada', 
    selector: 'section[aria-labelledby="section-jornada"] .group', 
    expectedPath: AppRoute.JORNADAS,
    expectedHeading: /Jornadas|Formação/
  },
  { 
    name: 'Catecismo', 
    selector: 'section[aria-labelledby="section-doutrina"] .group', 
    expectedPath: AppRoute.CATECHISM,
    expectedHeading: /Catecismo|CIC/
  },
  { 
    name: 'Temas', 
    selector: 'section[aria-labelledby="section-trilhas"] .group:has-text("Temas")', 
    expectedPath: AppRoute.TEMAS,
    expectedHeading: /Temas|Trilhas/
  },
  { 
    name: 'Bíblia', 
    selector: 'section[aria-labelledby="section-trilhas"] .group:has-text("Bíblico")', 
    expectedPath: AppRoute.BIBLE,
    expectedHeading: /Bíblia|Palavra/
  }
];

test.describe('Home Page Premium Audit', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
  });

  for (const isLoggedIn of [false, true]) {
    const authState = isLoggedIn ? 'logged-in' : 'logged-out';

    test.describe(`${authState}`, () => {
      test.beforeEach(async ({ page }) => {
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
          await page.waitForLoadState('networkidle');
        }
      });

      for (const target of NAVIGATION_TARGETS) {
        test(`Keyboard Navigation and Focus Management for ${target.name}`, async ({ page }, testInfo) => {
          const theme = testInfo.project.name.includes('dark') ? 'dark' : 'light';
          const locator = page.locator(target.selector).first();
          await expect(locator).toBeVisible();

          // 1. Initial Focus Capture
          await locator.focus();
          await locator.screenshot({ 
            path: `test-results/focus-proof/${theme}-${authState}-${target.name}-initial-focus.png` 
          });

          // 2. Navigation via Enter
          await page.keyboard.press('Enter');
          await expect(page).toHaveURL(new RegExp(`${target.expectedPath}`));
          
          // 3. Capture focus on destination (often it's the main heading or a focus wrapper)
          const destinationFocus = page.locator(':focus');
          await destinationFocus.screenshot({ 
            path: `test-results/focus-proof/${theme}-${authState}-${target.name}-destination-focus.png` 
          }).catch(() => {
             // Fallback to full page if no specific element is focused
             return page.screenshot({ path: `test-results/focus-proof/${theme}-${authState}-${target.name}-destination-page.png` });
          });

          // 4. Return Navigation and Focus Restoration
          await page.goBack();
          await page.waitForLoadState('networkidle');
          
          // Wait for focus to return to original CTA (accessibility requirement)
          const isFocusedAgain = await locator.evaluate(el => document.activeElement === el);
          expect(isFocusedAgain, `Focus should return to ${target.name} after goBack`).toBe(true);
          
          await locator.screenshot({ 
            path: `test-results/focus-proof/${theme}-${authState}-${target.name}-returned-focus.png` 
          });
        });
      }
    });
  }

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
