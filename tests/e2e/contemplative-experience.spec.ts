import { test, expect } from '@playwright/test';

test.describe('Contemplative Experience & Mobile Gestures', () => {
  test.beforeEach(async ({ page }) => {
    // Mock Supabase itineraria_steps response
    await page.route('**/rest/v1/itineraria_steps*', async (route) => {
      const json = [
        {
          id: 'step-1',
          itinerarium_id: 'itin-1',
          title: 'Passo 1: Meditação',
          step_order: 1,
          step_type: 'meditation',
          duration_minutes: 5,
          content: { html: '<div class="prose"><p>Conteúdo do Passo 1 para teste E2E.</p></div>' },
          subtitle: 'Iniciando o Silêncio'
        },
        {
          id: 'step-2',
          itinerarium_id: 'itin-1',
          title: 'Passo 2: Contemplação',
          step_order: 2,
          step_type: 'contemplation',
          duration_minutes: 10,
          content: { html: '<div class="prose"><p>Conteúdo do Passo 2 para teste E2E.</p></div>' },
          subtitle: 'Aprofundando a Presença'
        }
      ];
      
      const url = route.request().url();
      if (url.includes('select=%2A') && url.includes('eq.step-1')) {
        await route.fulfill({ json: json[0] });
      } else if (url.includes('select=%2A') && url.includes('eq.step-2')) {
        await route.fulfill({ json: json[1] });
      } else {
        await route.fulfill({ json });
      }
    });

    // Mock progress
    await page.route('**/rest/v1/itineraria_progress*', async (route) => {
      await route.fulfill({ json: [] });
    });

    // Mock profile for settings
    await page.route('**/rest/v1/profiles*', async (route) => {
      await route.fulfill({ json: [{ id: 'user-1', reading_settings: {} }] });
    });
  });

  test('should navigate between steps using swipe (simulated mobile)', async ({ page, isMobile }) => {
    await page.goto('/itineraria/itin-1/step?step=step-1');
    
    // Wait for content to load
    await expect(page.locator('h1')).toContainText('Passo 1');

    // Simulate Swipe Left (Next Step)
    // We use dispatchEvent to ensure touch events are fired correctly for useSwipeNavigation
    const viewport = page.viewportSize();
    if (viewport) {
      const centerX = viewport.width / 2;
      const centerY = viewport.height / 2;

      await page.evaluate(({ startX, endX, y }) => {
        const startEvent = new TouchEvent('touchstart', {
          touches: [new Touch({ identifier: 0, target: window, clientX: startX, clientY: y })] as any
        });
        window.dispatchEvent(startEvent);

        const moveEvent = new TouchEvent('touchmove', {
          touches: [new Touch({ identifier: 0, target: window, clientX: endX, clientY: y })] as any
        });
        window.dispatchEvent(moveEvent);

        const endEvent = new TouchEvent('touchend', {
          changedTouches: [new Touch({ identifier: 0, target: window, clientX: endX, clientY: y })] as any
        });
        window.dispatchEvent(endEvent);
      }, { startX: viewport.width * 0.8, endX: viewport.width * 0.2, y: centerY });
    }

    // Navigation should happen
    await expect(page).toHaveURL(/step=step-2/);
    await expect(page.locator('h1')).toContainText('Passo 2');
  });

  test('should reveal UI on tap in auto-hide mode', async ({ page }) => {
    await page.goto('/itineraria/itin-1/step?step=step-1');
    
    // Enable auto-hide UI in settings via localStorage
    await page.evaluate(() => {
      const settings = JSON.parse(localStorage.getItem('cathedra_reading_settings') || '{}');
      settings.autoHideUI = true;
      localStorage.setItem('cathedra_reading_settings', JSON.stringify(settings));
      window.location.reload();
    });

    // Confirm auto-hide class is present on html
    await expect(page.locator('html')).toHaveClass(/auto-hide-ui/);

    const chrome = page.locator('[data-reading-chrome]').first();
    
    // Simulate scroll down to hide UI
    await page.evaluate(() => window.scrollTo(0, 500));
    
    // Wait for the scroll logic to trigger (it has a requestAnimationFrame and threshold)
    await page.waitForFunction(() => document.documentElement.classList.contains('reading-scroll-down'));
    
    // UI elements should have opacity 0 or be transformed (based on CSS)
    // We check the class on html as it's the driver
    await expect(page.locator('html')).toHaveClass(/reading-scroll-down/);

    // Tap to reveal (dispatching a short tap)
    await page.evaluate(() => {
      const tapEvent = new TouchEvent('touchstart', {
        touches: [new Touch({ identifier: 1, target: window, clientX: 100, clientY: 100 })] as any
      });
      window.dispatchEvent(tapEvent);
      
      const endEvent = new TouchEvent('touchend', {
        changedTouches: [new Touch({ identifier: 1, target: window, clientX: 100, clientY: 100 })] as any
      });
      window.dispatchEvent(endEvent);
    });

    // Should add reveal-chrome class
    await expect(page.locator('html')).toHaveClass(/reveal-chrome/);
    
    // UI should be visible again (opacity 1 !important in CSS)
    const opacity = await chrome.evaluate(el => window.getComputedStyle(el).opacity);
    expect(opacity).toBe('1');
  });

  test('should adjust reading column width and persist preference', async ({ page }) => {
    await page.goto('/itineraria/itin-1/step?step=step-1');
    
    // Open settings panel
    const settingsButton = page.locator('button:has(.lucide-settings2), button:has-text("Estética")').first();
    await settingsButton.click();

    // Find the column width slider (range input)
    const slider = page.locator('input[type="range"]');
    await expect(slider).toBeVisible();
    
    // Change value to 55ch
    await slider.fill('55');
    
    // Verify persistence in localStorage
    const storedValue = await page.evaluate(() => {
      const settings = JSON.parse(localStorage.getItem('cathedra_reading_settings') || '{}');
      return settings.columnWidth;
    });
    expect(storedValue).toBe(55);

    // Verify CSS variable application
    const container = page.locator('.reader-container');
    const maxWidth = await container.evaluate(el => (el as HTMLElement).style.maxWidth);
    expect(maxWidth).toBe('55ch');
    
    // Reload to ensure it stays
    await page.reload();
    await expect(page.locator('.reader-container')).toHaveAttribute('style', /max-width: 55ch/);
  });

  test('should responsive test different widths for contemplative mode', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667 }, // iPhone SE
      { width: 768, height: 1024 }, // iPad
      { width: 1280, height: 800 } // Desktop
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      await page.goto('/itineraria/itin-1/step?step=step-1');
      
      const isMobile = vp.width < 768;
      
      // Check if side margins are applied correctly based on responsive settings
      const container = page.locator('.reader-container');
      if (isMobile) {
        // On mobile we expect full width or small padding
        const padding = await container.evaluate(el => window.getComputedStyle(el).paddingLeft);
        expect(parseFloat(padding)).toBeLessThanOrEqual(24); // 1.5rem approx
      } else {
        // On desktop, columnWidth should be respected
        const maxWidth = await container.evaluate(el => window.getComputedStyle(el).maxWidth);
        expect(maxWidth).not.toBe('none');
      }
    }
  });
});
