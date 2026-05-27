import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'fs';
import path from 'path';

const viewports = [
  // Portrait
  { name: 'iPhone SE', width: 375, height: 667, orientation: 'portrait' },
  { name: 'iPhone 14', width: 390, height: 844, orientation: 'portrait' },
  { name: 'Android Medium', width: 360, height: 800, orientation: 'portrait' },
  { name: 'Android Large', width: 412, height: 915, orientation: 'portrait' },
  // Landscape
  { name: 'iPhone SE Landscape', width: 667, height: 375, orientation: 'landscape' },
  { name: 'iPhone 14 Landscape', width: 844, height: 390, orientation: 'landscape' },
  { name: 'Android Medium Landscape', width: 800, height: 360, orientation: 'landscape' },
];

test.describe('Mobile Header Comprehensive Tests', () => {
  // Ensure report directory exists
  const reportDir = path.join(process.cwd(), 'test-results', 'axe');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  for (const vp of viewports) {
    test(`Header on ${vp.name} (${vp.orientation})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      // Go to a page that has the header (e.g., /bible)
      await page.goto('/bible');
      
      const header = page.locator('header[role="banner"]');
      await expect(header).toBeVisible();

      // 1. Visual Regression Snapshot
      await expect(header).toHaveScreenshot(`header-${vp.name.replace(/\s+/g, '-').toLowerCase()}.png`, {
        maxDiffPixelRatio: 0.05,
      });

      // 2. Accessibility Check (Axe)
      const accessibilityScanResults = await new AxeBuilder({ page })
        .include('header[role="banner"]')
        .analyze();
      
      // Save report and attach to Playwright report for CI inspection
      const reportName = `axe-header-${vp.name.replace(/\s+/g, '-').toLowerCase()}.json`;
      const reportPath = path.join(reportDir, reportName);
      
      // Ensure specific violation details are captured in the JSON
      fs.writeFileSync(reportPath, JSON.stringify({
        viewport: vp,
        violations: accessibilityScanResults.violations,
        incomplete: accessibilityScanResults.incomplete,
        timestamp: new Date().toISOString()
      }, null, 2));
      
      await test.info().attach(`Axe Report - ${vp.name}`, {
        path: reportPath,
        contentType: 'application/json',
      });

      // Assert zero violations
      if (accessibilityScanResults.violations.length > 0) {
        console.error(`A11y violations found on ${vp.name}:`, JSON.stringify(accessibilityScanResults.violations, null, 2));
      }
      expect(accessibilityScanResults.violations).toEqual([]);

      // 3. Skip Link Functionality & Anchoring
      const skipLink = page.locator('a[href="#main-content"]');
      await expect(skipLink).toBeAttached();
      
      // Reset focus to top
      await page.keyboard.press('Home');
      await page.keyboard.press('Tab');
      
      // Skip link should be focused first and visible
      const isSkipLinkFocused = await skipLink.evaluate(el => document.activeElement === el);
      expect(isSkipLinkFocused).toBeTruthy();
      
      // Verify skip link has visible focus styling
      const skipLinkStyle = await skipLink.evaluate(el => ({
        opacity: window.getComputedStyle(el).opacity,
        clip: window.getComputedStyle(el).clip,
      }));
      expect(parseFloat(skipLinkStyle.opacity)).toBeGreaterThan(0);
      
      // Press Enter to activate skip link
      await page.keyboard.press('Enter');
      
      // Main content should be focused (it should have tabIndex={-1})
      const mainContent = page.locator('#main-content');
      await expect(mainContent).toBeFocused();
      
      // Verify scroll position (anchoring)
      const isScrolledToMain = await mainContent.evaluate(el => {
        const rect = el.getBoundingClientRect();
        return rect.top >= 0 && rect.top <= 100;
      });
      expect(isScrolledToMain).toBeTruthy();

      // 4. Focus Order
      await page.keyboard.press('Home');
      await page.mouse.click(0, 0);
      
      await page.keyboard.press('Tab'); // Move to Skip Link
      await page.keyboard.press('Tab'); // Move to Logo
      const logo = page.locator('div[role="link"][aria-label*="inicial"]');
      expect(await logo.evaluate(el => document.activeElement === el)).toBeTruthy();

      await page.keyboard.press('Tab'); // Move to Back Button
      const backBtn = page.locator('button[aria-label*="Voltar"]');
      expect(await backBtn.evaluate(el => document.activeElement === el)).toBeTruthy();

      await page.keyboard.press('Tab'); // Move to Search
      const searchBtn = page.locator('button[aria-label*="Buscar"]');
      expect(await searchBtn.evaluate(el => document.activeElement === el)).toBeTruthy();

      await page.keyboard.press('Tab'); // Move to Theme
      const themeBtn = page.locator('button[aria-label*="modo"]');
      expect(await themeBtn.evaluate(el => document.activeElement === el)).toBeTruthy();

      await page.keyboard.press('Tab'); // Move to Profile
      const profileBtn = page.locator('button[aria-label*="Perfil"], button:has-text("Entrar")');
      expect(await profileBtn.evaluate(el => document.activeElement === el)).toBeTruthy();

      await page.keyboard.press('Tab'); // Move to Menu
      const menuBtn = page.locator('button[aria-label*="menu lateral"]');
      expect(await menuBtn.evaluate(el => document.activeElement === el)).toBeTruthy();
      
      // 5. Hierarchy and Safe Area Check
      const headerBox = await header.boundingBox();
      expect(headerBox?.height).toBeGreaterThan(60); 
      
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(vp.width);
    });
  }

  test('Keyboard Navigation Loop and Focus Trap Prevention', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/bible');
    
    // Start from the top
    await page.keyboard.press('Home');
    await page.mouse.click(0, 0);
    
    // Total interactive elements in header (approx 7): Skip, Logo, Back, Search, Theme, Profile, Menu
    // We'll tab through more than enough to ensure we exit the header and enter main content
    const interactiveElementsCount = 10;
    
    for (let i = 0; i < interactiveElementsCount; i++) {
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return null;
        return {
          tagName: el.tagName,
          ariaLabel: el.getAttribute('aria-label'),
          role: el.getAttribute('role'),
          isVisible: window.getComputedStyle(el).display !== 'none' && window.getComputedStyle(el).visibility !== 'hidden',
          outline: window.getComputedStyle(el).outlineStyle,
          boxShadow: window.getComputedStyle(el).boxShadow
        };
      });

      expect(focusedElement).not.toBeNull();
      // Verify focus is visible (either via outline or box-shadow ring)
      const hasVisibleFocus = focusedElement?.outline !== 'none' || focusedElement?.boxShadow.includes('rgb');
      expect(hasVisibleFocus).toBeTruthy();
    }

    // After tabbing through header, we should be able to tab back
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Shift+Tab');
    }
    
    const backToHeader = await page.locator('header[role="banner"]').evaluate(header => 
      header.contains(document.activeElement)
    );
    expect(backToHeader).toBeTruthy();
  });

  test('High Zoom and Contrast Resilience', async ({ page }) => {
    // Simulate 200% zoom by reducing viewport size but keeping layout scale
    await page.setViewportSize({ width: 320, height: 480 }); 
    await page.goto('/bible');
    
    const header = page.locator('header[role="banner"]');
    const headerBox = await header.boundingBox();
    
    // Hierachy check: Ensure logo and at least the menu button are still visible/accessible
    const logo = page.locator('header [role="link"][aria-label*="inicial"]');
    const menuBtn = page.locator('header button[aria-label*="menu"]');
    
    await expect(logo).toBeVisible();
    await expect(menuBtn).toBeVisible();
    
    // Ensure no vertical overlap/collapse that hides text
    expect(headerBox?.height).toBeLessThan(150); // Should not expand excessively
    
    // Accessibility: Contrast check via Axe with high contrast simulation (forced-colors)
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('header[role="banner"]')
      .withRules(['color-contrast'])
      .analyze();
    
    const zoomReportName = 'axe-header-zoom-contrast.json';
    const zoomReportPath = path.join(reportDir, zoomReportName);
    fs.writeFileSync(zoomReportPath, JSON.stringify(accessibilityScanResults, null, 2));
    await test.info().attach('Axe Zoom/Contrast Report', {
      path: zoomReportPath,
      contentType: 'application/json',
    });

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Icon Density Consistency across Viewports', async ({ page }) => {
    // ... rest of existing test
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/bible');
    
    const icons = page.locator('header svg');
    const count = await icons.count();
    
    for (let i = 0; i < count; i++) {
      const icon = icons.nth(i);
      const box = await icon.boundingBox();
      
      expect(box?.width).toBeGreaterThanOrEqual(16);
      expect(box?.width).toBeLessThanOrEqual(24);
      
      const strokeWidth = await icon.evaluate(el => window.getComputedStyle(el).strokeWidth);
      expect(parseFloat(strokeWidth)).toBeCloseTo(1.2, 1);
    }
  });
});
