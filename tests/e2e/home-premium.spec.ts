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
  test.beforeEach(async ({ page, context }, testInfo) => {
    // Start tracing for every test in this suite to link in the gallery
    await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
    
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    
    const reportDir = 'test-results/focus-proof';
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
  });

  test.afterEach(async ({ context }, testInfo) => {
    const theme = testInfo.project.name.includes('dark') ? 'dark' : 'light';
    const authState = testInfo.title.includes('logged-in') ? 'logged-in' : 'logged-out';
    
    // We want a trace name that matches our gallery grouping
    let testId = 'General';
    if (testInfo.title.includes('for ')) {
      testId = testInfo.title.split('for ')[1].replace(/[^a-z0-9]/gi, '');
    } else if (testInfo.title.includes('Tab Order')) {
      testId = testInfo.title.includes('Reverse') ? 'ShiftTabNavigation' : 'TabNavigation';
    }
    
    const tracePath = path.join(process.cwd(), `test-results/focus-proof/${theme}__${authState}__${testId}__trace.zip`);
    
    await context.tracing.stop({ path: tracePath });
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
        for (const keyToPress of ['Enter', ' ']) {
          const keyName = keyToPress === ' ' ? 'Space' : 'Enter';
          
          test(`Keyboard Navigation (${keyName}) and Focus Management for ${target.name}`, async ({ page }, testInfo) => {
            const theme = testInfo.project.name.includes('dark') ? 'dark' : 'light';
            const locator = page.locator(target.selector).first();
            await expect(locator).toBeVisible();

            const fileNameBase = `${theme}__${authState}__${target.name}__${keyName}`;

            // 1. Initial Focus Capture
            await locator.focus();
            await page.evaluate((sel) => {
              const el = document.querySelector(sel) as HTMLElement;
              if (el) el.style.outline = '4px solid #3b82f6';
            }, target.selector);
            
            await locator.screenshot({ 
              path: `test-results/focus-proof/${fileNameBase}__initial-focus.png` 
            });

            await page.evaluate((sel) => {
              const el = document.querySelector(sel) as HTMLElement;
              if (el) el.style.outline = '';
            }, target.selector);

            // 2. Navigation via Key
            await page.keyboard.press(keyToPress);
            await expect(page).toHaveURL(new RegExp(`${target.expectedPath}`));
            
            // 3. Capture focus on destination
            await page.waitForFunction(() => document.activeElement && document.activeElement !== document.body);
            
            const hasFocus = await page.evaluate(() => {
              const el = document.activeElement;
              return el && el !== document.body;
            });

            if (hasFocus) {
              const destinationFocus = page.locator(':focus');
              // Highlight the destination focus
              await page.evaluate(() => {
                const el = document.activeElement as HTMLElement;
                if (el) el.style.outline = '4px solid #10b981';
              });

              try {
                await destinationFocus.scrollIntoViewIfNeeded();
                await destinationFocus.screenshot({ 
                  path: `test-results/focus-proof/${fileNameBase}__destination-focus.png` 
                });
              } catch (e) {
                await page.screenshot({ path: `test-results/focus-proof/${fileNameBase}__destination-page-fallback.png` });
              }

              await page.evaluate(() => {
                const el = document.activeElement as HTMLElement;
                if (el) el.style.outline = '';
              });
            } else {
              await page.screenshot({ path: `test-results/focus-proof/${fileNameBase}__destination-none.png` });
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
      }

      test(`Keyboard Sequential Navigation (Tab Order)`, async ({ page }, testInfo) => {
        const theme = testInfo.project.name.includes('dark') ? 'dark' : 'light';
        const fileNameBase = `${theme}__${authState}__TabNavigation`;
        
        // Start from top
        await page.keyboard.press('Home');
        
        // Tab through major sections
        const focusHistory: any[] = [];
        let lastStableSelector = '';
        let trapDetected = false;

        for (let i = 0; i < 20; i++) {
          await page.keyboard.press('Tab');
          const focusedInfo = await page.evaluate(() => {
            const el = document.activeElement;
            if (!el || el === document.body) return null;
            
            // Generate a stable selector for trap detection
            const tag = el.tagName.toLowerCase();
            const id = el.id ? `#${el.id}` : '';
            const ariaLabel = el.getAttribute('aria-label') ? `[aria-label="${el.getAttribute('aria-label')}"]` : '';
            const role = el.getAttribute('role') ? `[role="${el.getAttribute('role')}"]` : '';
            const text = el.textContent?.substring(0, 20).trim() || '';
            
            return {
              tag,
              id,
              ariaLabel,
              role,
              text,
              stableSelector: `${tag}${id}${ariaLabel}${role}`,
              className: el.className
            };
          });

          if (focusedInfo) {
            if (focusedInfo.stableSelector === lastStableSelector) {
              trapDetected = true;
              break;
            }
            lastStableSelector = focusedInfo.stableSelector;

            focusHistory.push({
              index: i,
              ...focusedInfo
            });
            
            // Highlight the focused element for the screenshot
            await page.evaluate(() => {
              const el = document.activeElement as HTMLElement;
              if (el) el.style.outline = '4px solid #3b82f6';
            });

            await page.locator(':focus').screenshot({ 
              path: `test-results/focus-proof/${fileNameBase}__tab-${i}${trapDetected ? '-trap' : ''}.png` 
            });

            if (trapDetected) {
              const htmlContent = await page.content();
              fs.writeFileSync(`test-results/focus-proof/${fileNameBase}__tab-${i}-trap-context.html`, htmlContent);
              break;
            }

            // Clean up highlight
            await page.evaluate(() => {
              const el = document.activeElement as HTMLElement;
              if (el) el.style.outline = '';
            });
          }
        }
        
        expect(focusHistory.length).toBeGreaterThan(0);
      });

      test(`Keyboard Reverse Navigation (Shift+Tab Order)`, async ({ page }, testInfo) => {
        const theme = testInfo.project.name.includes('dark') ? 'dark' : 'light';
        const fileNameBase = `${theme}__${authState}__ShiftTabNavigation`;
        
        // Go to bottom first
        await page.keyboard.press('End');
        
        // Shift+Tab back up
        const focusHistory: string[] = [];
        for (let i = 0; i < 10; i++) {
          await page.keyboard.press('Shift+Tab');
          const focusedInfo = await page.evaluate(() => {
            const el = document.activeElement;
            if (!el || el === document.body) return null;
            return {
              tag: el.tagName,
              text: el.textContent?.substring(0, 30).trim()
            };
          });

          if (focusedInfo) {
            focusHistory.push(focusedInfo.tag);
            
            await page.evaluate(() => {
              const el = document.activeElement as HTMLElement;
              if (el) el.style.outline = '4px solid #ef4444';
            });

            await page.locator(':focus').screenshot({ 
              path: `test-results/focus-proof/${fileNameBase}__shifttab-${i}.png` 
            });
          }
        }
        
        expect(focusHistory.length).toBeGreaterThan(0);
      });
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
