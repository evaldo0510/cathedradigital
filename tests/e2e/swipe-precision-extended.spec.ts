import { test, expect } from '@playwright/test';

/**
 * Testes E2E para validação rigorosa de navegação por swipe e proteção contra toques.
 */
test.describe('Swipe Navigation Precision & Stability', () => {
  
  async function performSwipe(page, { startX, endX, startY = 400, endY = 400, steps = 15, duration = 100 }) {
    console.log(`[Test Logger] Current Route Before Swipe: ${page.url()}`);
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    
    const interval = duration / steps;
    for (let i = 1; i <= steps; i++) {
      const currentX = startX + (endX - startX) * (i / steps);
      const currentY = startY + (endY - startY) * (i / steps);
      await page.mouse.move(currentX, currentY);
      if (interval > 0) await page.waitForTimeout(interval);
    }
    
    await page.mouse.up();
    await page.waitForTimeout(300);
    console.log(`[Test Logger] Current Route After Swipe: ${page.url()}`);
  }

  test.beforeEach(async ({ page }) => {
    await page.goto('/?lang=pt');
    await page.waitForLoadState('networkidle');
    // Registra console logs para capturar telemetria
    page.on('console', msg => {
      if (msg.text().includes('[Telemetry]')) {
        console.log(`[Browser Telemetry] ${msg.text()}`);
      }
    });
  });

  test('swipe inferior ao limiar (79px) NUNCA deve mudar a rota', async ({ page }) => {
    await performSwipe(page, { startX: 300, endX: 221, duration: 50 }); // 79px
    expect(page.url()).not.toContain('/bible');
  });

  test('swipe superior ao limiar (81px) DEVE mudar a rota', async ({ page }) => {
    await performSwipe(page, { startX: 300, endX: 219, duration: 150 }); // 81px
    await expect(page).toHaveURL(/\/bible/);
  });

  test('toque duplo rápido NÃO deve disparar navegação acidental', async ({ page }) => {
    const initialUrl = page.url();
    // Simula dois toques rápidos no mesmo lugar
    await page.mouse.click(200, 400);
    await page.waitForTimeout(50);
    await page.mouse.click(200, 400);
    await page.waitForTimeout(500);
    expect(page.url()).toBe(initialUrl);
  });

  test('swipe diagonal predominante vertical (Y > X*2.5) NÃO deve navegar', async ({ page }) => {
    // Delta X = 50, Delta Y = 150 (Razão 3)
    await performSwipe(page, { 
      startX: 200, endX: 250, 
      startY: 400, endY: 550, 
      steps: 20 
    });
    expect(page.url()).not.toContain('/bible');
  });

  test('swipe diagonal predominante horizontal (X > Y*3) DEVE navegar', async ({ page }) => {
    // Delta X = 150, Delta Y = 30 (Razão 5)
    await performSwipe(page, { 
      startX: 300, endX: 150, 
      startY: 400, endY: 430, 
      steps: 20 
    });
    await expect(page).toHaveURL(/\/bible/);
  });

  test('flick rápido superior a 80px DEVE navegar', async ({ page }) => {
    await performSwipe(page, { startX: 300, endX: 100, steps: 5, duration: 20 });
    await expect(page).toHaveURL(/\/bible/);
  });
});
