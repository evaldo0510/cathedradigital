import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 667 },
];

const HOME_SECTIONS = [
  { name: 'Hero', selector: '#hero' },
  { name: 'ContinueJornada', selector: 'section[aria-labelledby="section-jornada"]' },
  { name: 'RitualDoDia', selector: 'section[aria-labelledby="section-hoje"]' },
  { name: 'Catecismo', selector: 'section[aria-labelledby="section-doutrina"]' },
  { name: 'Trilhas', selector: 'section[aria-labelledby="section-trilhas"]' },
];

test.describe('Home Page Premium Audit', () => {
  for (const viewport of VIEWPORTS) {
    test.describe(`Viewport: ${viewport.name}`, () => {
      test.use({ viewport: { width: viewport.width, height: viewport.height } });

      test('Logged-out Home: Visual Consistency & A11y', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000); // Animations

        // 1. Visual Regression by Section
        for (const section of HOME_SECTIONS) {
          const locator = page.locator(section.selector);
          await expect(locator).toBeVisible();
          
          // Identify dynamic elements within each section for masking
          const maskSelectors = [];
          if (section.name === 'RitualDoDia') {
            maskSelectors.push(locator.locator('blockquote'));
            maskSelectors.push(locator.locator('p.font-reader'));
            maskSelectors.push(locator.locator('span.text-muted-foreground\\/40')); // Date
            maskSelectors.push(locator.locator('img')); // Saint image
            maskSelectors.push(locator.locator('h3')); // Saint name
            maskSelectors.push(locator.locator('.line-clamp-1')); // Saint bio snippet
          }
          if (section.name === 'Hero') {
            maskSelectors.push(locator.locator('img'));
          }

          // Capture snapshot for each section
          await expect(locator).toHaveScreenshot(`home-${section.name}-${viewport.name}-logged-out.png`, {
            maxDiffPixelRatio: 0.05, 
            animations: 'disabled',
            mask: maskSelectors.length > 0 ? maskSelectors : undefined,
          });
        }

        // 2. Desktop Grid Alignment (2 columns)
        if (viewport.name === 'desktop') {
          const grid = page.locator('#main-content > div');
          const display = await grid.evaluate(el => window.getComputedStyle(el).display);
          const columns = await grid.evaluate(el => window.getComputedStyle(el).gridTemplateColumns);
          
          expect(display).toBe('grid');
          // Expect 2 columns on desktop
          expect(columns.split(' ').length).toBeGreaterThanOrEqual(2);
          
          // Max-width check (1280px)
          const maxWidth = await grid.evaluate(el => window.getComputedStyle(el).maxWidth);
          expect(maxWidth).toBe('1280px');
          
          // Padding check (24px lateral)
          const paddingLeft = await grid.evaluate(el => window.getComputedStyle(el).paddingLeft);
          expect(paddingLeft).toBe('24px');
        }

        // 3. Accessibility: Keyboard Actionability & Focus Visible
        const actionableElements = page.locator('button, [role="button"], a[href]');
        const count = await actionableElements.count();
        
        if (count > 0) {
          const target = actionableElements.first();
          await target.focus();
          await expect(target).toBeFocused();
          
          // Verify focus visibility (outline or shadow)
          const isFocusVisible = await target.evaluate(el => {
            const style = window.getComputedStyle(el);
            return style.outlineStyle !== 'none' || style.boxShadow !== 'none';
          });
          expect(isFocusVisible).toBe(true);

          // Verify Enter/Space trigger click
          const wasClicked = await target.evaluate(el => {
            return new Promise(resolve => {
               let triggered = false;
               const handler = (e: Event) => {
                 e.preventDefault();
                 triggered = true;
               };
               el.addEventListener('click', handler, { once: true });
               // Simulate Enter
               el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
               setTimeout(() => resolve(triggered), 50);
            });
          });
          expect(wasClicked).toBe(true);
        }
      });

      test('Logged-in Home: Visual Consistency', async ({ page }) => {
        // Mock auth session to simulate logged-in state without redirecting
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
        await page.waitForTimeout(1000);

        // Verify "Retomar Jornada" text appears instead of "Inicie sua Caminhada"
        const sectionJornada = page.locator('section[aria-labelledby="section-jornada"]');
        await expect(sectionJornada).toContainText(/Retomar Jornada|Continuar/);

        // Visual Regression for Logged-in state
        for (const section of HOME_SECTIONS) {
          const locator = page.locator(section.selector);
          await expect(locator).toBeVisible();
          
          const maskSelectors = [];
          if (section.name === 'RitualDoDia') {
            maskSelectors.push(locator.locator('blockquote'));
            maskSelectors.push(locator.locator('p.font-reader'));
            maskSelectors.push(locator.locator('span.text-muted-foreground\\/40'));
            maskSelectors.push(locator.locator('img'));
            maskSelectors.push(locator.locator('h3'));
          }
          if (section.name === 'Hero') {
            maskSelectors.push(locator.locator('img'));
          }

          await expect(locator).toHaveScreenshot(`home-${section.name}-${viewport.name}-logged-in.png`, {
            maxDiffPixelRatio: 0.05,
            animations: 'disabled',
            mask: maskSelectors.length > 0 ? maskSelectors : undefined,
          });
        }
      });
    });
  }
});
