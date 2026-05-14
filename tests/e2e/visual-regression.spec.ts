import { test, expect } from '@playwright/test';

const BREAKPOINTS = [
  { name: 'Mobile Mini', width: 360, height: 640 },
  { name: 'Mobile Standard', width: 390, height: 844 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Desktop Mini', width: 1024, height: 768 },
  { name: 'Desktop Full', width: 1280, height: 720 },
];

const PAGES = [
  { name: 'Home', path: '/hoje' },
  { name: 'Quiz', path: '/diagnostico' },
  { name: 'Catechism', path: '/catechism' },
  { name: 'Journeys', path: '/jornadas' },
  { name: 'Profile', path: '/profile' },
  { name: 'Admin', path: '/admin' },
];

test.describe('Visual Regression Audit', () => {
  for (const breakpoint of BREAKPOINTS) {
    test.describe(`${breakpoint.name} (${breakpoint.width}px)`, () => {
      test.use({ viewport: { width: breakpoint.width, height: breakpoint.height } });

      for (const pageInfo of PAGES) {
        test(`Audit layout for ${pageInfo.name}`, async ({ page }) => {
          await page.goto(pageInfo.path);
          
          // Wait for main content to be stable
          await page.waitForLoadState('networkidle');
          
          // Capture screenshot for visual baseline
          await expect(page).toHaveScreenshot(`${pageInfo.name}-${breakpoint.name}.png`, {
            fullPage: true,
            mask: [page.locator('.animate-pulse')], // Mask loading states
          });
        });
      }
    });
  }
});
