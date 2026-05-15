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
          
          // Capture snapshot for each section
          await expect(locator).toHaveScreenshot(`home-${section.name}-${viewport.name}-logged-out.png`, {
            maxDiffPixelRatio: 0.02, // Allow slight differences for font rendering
            animations: 'disabled',
          });
        }

        // 2. Desktop Grid Alignment (2 columns)
        if (viewport.name === 'desktop') {
          const grid = page.locator('#main-content > div');
          const display = await grid.evaluate(el => window.getComputedStyle(el).display);
          const columns = await grid.evaluate(el => window.getComputedStyle(el).gridTemplateColumns);
          
          expect(display).toBe('grid');
          // Expect 2 columns on desktop (roughly equal width or at least 2 segments)
          expect(columns.split(' ').length).toBeGreaterThanOrEqual(2);
          
          // Max-width check
          const maxWidth = await grid.evaluate(el => window.getComputedStyle(el).maxWidth);
          expect(maxWidth).toBe('1280px');
        }

        // 3. Accessibility: Keyboard Actionability
        const actionableElements = page.locator('button, [role="button"], a[href]');
        const count = await actionableElements.count();
        
        if (count > 0) {
          const firstActionable = actionableElements.first();
          await firstActionable.focus();
          await expect(firstActionable).toBeFocused();
          
          // Verify focus visibility (outline or ring)
          const hasFocusRing = await firstActionable.evaluate(el => {
            const style = window.getComputedStyle(el);
            return style.outlineStyle !== 'none' || style.boxShadow !== 'none';
          });
          expect(hasFocusRing).toBe(true);

          // Test Enter/Space
          // We don't necessarily want to navigate away, so we just check it responds
          await page.keyboard.press('Enter');
          // If it navigates, the next page load state will be handled by Playwright
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
          // Key for Supabase GPWRP...
          window.localStorage.setItem('sb-gpwrpmoniglarqwfyryp-auth-token', JSON.stringify(session));
          // Prevent redirect by NOT setting cathedra_onboarding_done if we want to stay on /
          // Actually, Index.tsx redirects to /hoje if onboardingDone is true.
          // If we want to see the "Logged-in Home" on /, we keep onboardingDone false.
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
          await expect(locator).toHaveScreenshot(`home-${section.name}-${viewport.name}-logged-in.png`, {
            maxDiffPixelRatio: 0.02,
            animations: 'disabled',
          });
        }
      });
    });
  }
});
