import { test, expect } from '@playwright/test';
import { AppRoute } from '../../src/types';
import fs from 'fs';
import path from 'path';

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
    
    // Ensure reporting directory exists
    const reportDir = 'test-results/focus-proof';
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
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

          const fileNameBase = `${theme}__${authState}__${target.name}`;

          // 1. Initial Focus Capture
          await locator.focus();
          await locator.screenshot({ 
            path: `test-results/focus-proof/${fileNameBase}__initial-focus.png` 
          });

          // 2. Navigation via Enter
          await page.keyboard.press('Enter');
          await expect(page).toHaveURL(new RegExp(`${target.expectedPath}`));
          
          // 3. Capture focus on destination (often it's the main heading or a focus wrapper)
          // We wait for any element to be focused and ensure it's not the body
          await page.waitForFunction(() => document.activeElement && document.activeElement !== document.body);
          const destinationFocus = page.locator(':focus');
          
          try {
            await destinationFocus.scrollIntoViewIfNeeded();
            await destinationFocus.screenshot({ 
              path: `test-results/focus-proof/${fileNameBase}__destination-focus.png` 
            });
          } catch (e) {
            // If specific focus capture fails, we mark it as a page capture but keep it categorized
            await page.screenshot({ path: `test-results/focus-proof/${fileNameBase}__destination-page-fallback.png` });
          }

          // Save HTML state for debugging context
          const htmlContent = await page.content();
          fs.writeFileSync(`test-results/focus-proof/${fileNameBase}__context.html`, htmlContent);

          // 4. Return Navigation and Focus Restoration
          await page.goBack();
          await page.waitForLoadState('networkidle');
          
          // Wait for focus to return to original CTA (accessibility requirement)
          await expect(locator).toBeFocused();
          
          await locator.screenshot({ 
            path: `test-results/focus-proof/${fileNameBase}__returned-focus.png` 
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
