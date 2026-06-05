import { test, expect } from '@playwright/test';

/**
 * Testes E2E para validação rigorosa de navegação por swipe.
 * Garante que a rota só mude quando o limiar de 80px for claramente ultrapassado.
 */
test.describe('Swipe Navigation Precision', () => {
  
  // Função auxiliar para simular swipe com vetores e velocidades variadas
  async function performSwipe(page, { startX, endX, y = 400, steps = 15, duration = 100 }) {
    await page.mouse.move(startX, y);
    await page.mouse.down();
    
    // Distribuímos o movimento em 'steps' ao longo de 'duration'
    const interval = duration / steps;
    for (let i = 1; i <= steps; i++) {
      const currentX = startX + (endX - startX) * (i / steps);
      await page.mouse.move(currentX, y);
      if (interval > 0) await page.waitForTimeout(interval);
    }
    
    await page.mouse.up();
    // Aguarda um pequeno tempo para processamento do gesto
    await page.waitForTimeout(300);
  }

  test.beforeEach(async ({ page }) => {
    // Começa na página inicial (Hoje)
    await page.goto('/?lang=pt');
    await page.waitForLoadState('networkidle');
    const hojeItem = page.locator('button[aria-label="Hoje"]');
    await expect(hojeItem).toHaveAttribute('aria-current', 'page');
  });

  test('swipe inferior ao limiar (75px) NÃO deve mudar a rota', async ({ page }) => {
    // Swipe left de 75px (300 -> 225)
    await performSwipe(page, { 
      startX: 300, 
      endX: 225, 
      steps: 10, 
      duration: 50 
    });

    // A URL deve permanecer a mesma
    expect(page.url()).not.toContain('/bible');
    const hojeItem = page.locator('button[aria-label="Hoje"]');
    await expect(hojeItem).toHaveAttribute('aria-current', 'page');
  });

  test('swipe superior ao limiar (85px) DEVE mudar a rota', async ({ page }) => {
    // Swipe left de 85px (300 -> 215)
    await performSwipe(page, { 
      startX: 300, 
      endX: 215, 
      steps: 20, 
      duration: 150 
    });

    // Deve navegar para a Bíblia
    await expect(page).toHaveURL(/\/bible/);
    const bibleItem = page.locator('button[aria-label="Bíblia"]');
    await expect(bibleItem).toHaveAttribute('aria-current', 'page');
  });

  test('swipe rápido (flick) superior ao limiar deve mudar a rota', async ({ page }) => {
    // Swipe rápido de 120px (300 -> 180) em poucos steps
    await performSwipe(page, { 
      startX: 300, 
      endX: 180, 
      steps: 5, 
      duration: 20 
    });

    await expect(page).toHaveURL(/\/bible/);
  });

  test('swipe lento superior ao limiar deve mudar a rota', async ({ page }) => {
    // Swipe lento de 100px (300 -> 200)
    await performSwipe(page, { 
      startX: 300, 
      endX: 200, 
      steps: 50, 
      duration: 500 
    });

    await expect(page).toHaveURL(/\/bible/);
  });

  test('swipe diagonal predominante horizontal deve mudar a rota', async ({ page }) => {
    // Inicia em 300,400 e termina em 200,450 (deltaX = 100, deltaY = 50)
    await page.mouse.move(300, 400);
    await page.mouse.down();
    await page.mouse.move(200, 450, { steps: 20 });
    await page.mouse.up();
    
    await page.waitForTimeout(300);
    await expect(page).toHaveURL(/\/bible/);
  });

  test('swipe diagonal predominante vertical NÃO deve mudar a rota', async ({ page }) => {
    // Inicia em 300,400 e termina em 250,200 (deltaX = 50, deltaY = 200)
    await page.mouse.move(300, 400);
    await page.mouse.down();
    await page.mouse.move(250, 200, { steps: 20 });
    await page.mouse.up();
    
    await page.waitForTimeout(300);
    expect(page.url()).not.toContain('/bible');
  });
});