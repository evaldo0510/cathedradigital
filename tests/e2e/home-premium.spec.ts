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

    expect(cls).toBeLessThan(0.1);
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
        test(`Navigation to ${target.name} via Click`, async ({ page }) => {
          const locator = page.locator(target.selector).first();
          await expect(locator).toBeVisible();
          await locator.click();
          await expect(page).toHaveURL(new RegExp(`${target.expectedPath}`));
          await expect(page.locator('h1, h2')).toContainText(target.expectedHeading);
        });

        test(`Keyboard Navigation to ${target.name} (Enter/Space) and Focus Ring`, async ({ page }, testInfo) => {
          const theme = testInfo.project.name.includes('dark') ? 'dark' : 'light';
          const locator = page.locator(target.selector).first();
          await expect(locator).toBeVisible();

          // 1. Move focus to element
          await locator.focus();
          
          // 2. Capture focus-visible/ring screenshot for accessibility confirmation
          // The name includes theme and authState for clear categorization
          await locator.screenshot({ 
            path: `test-results/focus-proof/${theme}-${authState}-${target.name}-focus.png` 
          });

          const isFocusVisible = await locator.evaluate(el => {
            const style = window.getComputedStyle(el);
            return style.outlineStyle !== 'none' || 
                   style.boxShadow !== 'none' || 
                   (style.borderWidth !== '0px' && style.borderColor !== 'transparent');
          });
          expect(isFocusVisible, `Focus ring should be visible on ${target.name} (${theme})`).toBe(true);

          // 3. Test Enter
          await page.keyboard.press('Enter');
          await expect(page).toHaveURL(new RegExp(`${target.expectedPath}`));
          await expect(page.locator('h1, h2')).toContainText(target.expectedHeading);
          
          await page.goBack();
          await page.waitForLoadState('networkidle');

          // 4. Test Space
          await locator.focus();
          await page.keyboard.press(' ');
          await expect(page).toHaveURL(new RegExp(`${target.expectedPath}`));
          await expect(page.locator('h1, h2')).toContainText(target.expectedHeading);
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
