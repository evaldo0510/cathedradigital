import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Contemplative Mode Keyboard & Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Mock Supabase itineraria_steps response
    await page.route('**/rest/v1/itineraria_steps*', async (route) => {
      const json = [
        {
          id: 'step-1',
          itinerarium_id: 'itin-1',
          title: 'Passo 1: Meditação Keyboard',
          step_order: 1,
          step_type: 'meditation',
          duration_minutes: 5,
          content: { html: '<div class="prose"><p>Conteúdo do Passo 1 para teste E2E de teclado e visual.</p></div>' },
          subtitle: 'Iniciando o Silêncio'
        },
        {
          id: 'step-2',
          itinerarium_id: 'itin-1',
          title: 'Passo 2: Contemplação Keyboard',
          step_order: 2,
          step_type: 'contemplation',
          duration_minutes: 10,
          content: { html: '<div class="prose"><p>Conteúdo do Passo 2 para teste E2E de teclado e visual.</p></div>' },
          subtitle: 'Aprofundando a Presença'
        }
      ];
      
      const url = route.request().url();
      if (url.includes('eq.step-1')) {
        await route.fulfill({ json: json[0] });
      } else if (url.includes('eq.step-2')) {
        await route.fulfill({ json: json[1] });
      } else {
        await route.fulfill({ json });
      }
    });

    // Mock progress
    await page.route('**/rest/v1/itineraria_progress*', async (route) => {
      await route.fulfill({ json: [] });
    });

    // Mock profile
    await page.route('**/rest/v1/profiles*', async (route) => {
      await route.fulfill({ json: [{ id: 'user-1', reading_settings: {} }] });
    });
  });

  test('should reveal UI using keyboard (Space/Enter) and validate ARIA', async ({ page }) => {
    await page.goto('/itineraria/itin-1/step?step=step-1');
    
    // Enable auto-hide UI
    await page.evaluate(() => {
      const settings = JSON.parse(localStorage.getItem('cathedra_reading_settings') || '{}');
      settings.autoHideUI = true;
      localStorage.setItem('cathedra_reading_settings', JSON.stringify(settings));
      window.location.reload();
    });

    // Wait for content
    await expect(page.locator('h1')).toBeVisible();

    // Ensure chrome is hidden by scrolling
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForFunction(() => document.documentElement.classList.contains('reading-scroll-down'));
    
    const chrome = page.locator('[data-reading-chrome]').first();
    
    // Test SPACE key
    await page.keyboard.press(' ');
    await expect(page.locator('html')).toHaveClass(/reveal-chrome/);
    await expect(chrome).toBeVisible();
    
    // Wait for it to disappear
    await page.evaluate(() => document.documentElement.classList.remove('reveal-chrome'));
    
    // Test ENTER key
    await page.keyboard.press('Enter');
    await expect(page.locator('html')).toHaveClass(/reveal-chrome/);
    
    // Validate ARIA attributes on chrome components
    const header = page.locator('.reading-chrome').first();
    const titleStatus = page.locator('[aria-live="polite"]');
    await expect(titleStatus).toBeVisible();
    
    const backButton = page.locator('button[aria-label="Voltar para o itinerário"]');
    await expect(backButton).toBeVisible();
  });

  test('should validate Accessibility Panel and ARIA controls', async ({ page }) => {
    await page.goto('/');
    
    // Open A11y Panel (Assuming it's triggered by a button in the header)
    const a11yButton = page.locator('button[aria-label*="acessibilidade"]').first();
    await a11yButton.click();

    const panel = page.locator('role=dialog[name="Acessibilidade"]');
    await expect(panel).toBeVisible();
    await expect(panel).toHaveAttribute('aria-labelledby', 'a11y-title');

    // Check switches and labels
    const contrastSwitch = page.locator('label:has-text("Alto Contraste")');
    await expect(contrastSwitch).toBeVisible();

    const fontSizeButtons = page.locator('button[aria-label*="tamanho da fonte"]');
    await expect(fontSizeButtons).toHaveCount(4);

    // Validate focus visible toggle
    const focusSwitch = page.locator('label:has-text("Foco Visível")');
    await expect(focusSwitch).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(panel).not.toBeVisible();
  });

  test('should navigate using Arrow Keys', async ({ page }) => {
    await page.goto('/itineraria/itin-1/step?step=step-1');

    await expect(page.locator('h1')).toContainText('Passo 1');

    // Press ArrowRight to go to Next Step
    await page.keyboard.press('ArrowRight');
    await expect(page).toHaveURL(/step=step-2/);
    await expect(page.locator('h1')).toContainText('Passo 2');

    // Press ArrowLeft to go back to Step 1
    await page.keyboard.press('ArrowLeft');
    await expect(page).toHaveURL(/step=step-1/);
    await expect(page.locator('h1')).toContainText('Passo 1');
  });

  test('visual regression of contemplative mode across screen widths', async ({ page }) => {
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1440, height: 900 }
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      await page.goto('/itineraria/itin-1/step?step=step-1');
      await page.waitForLoadState('networkidle');

      // 1. Visual Snapshot of normal state
      await expect(page).toHaveScreenshot(`contemplative-normal-${vp.name}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.02
      });

      // 2. Visual Snapshot of Hidden UI state
      await page.evaluate(() => {
        document.documentElement.classList.add('auto-hide-ui', 'reading-scroll-down');
      });
      
      // Wait for possible CSS transitions
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot(`contemplative-hidden-ui-${vp.name}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.02
      });

      // 3. Accessibility & Contrast check with Axe
      const accessibilityResults = await new AxeBuilder({ page })
        .withTags(['wcag2aa', 'wcag21aa'])
        .analyze();
      
      expect(accessibilityResults.violations).toEqual([]);
    }
  });
});
