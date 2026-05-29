import { test, expect } from '@playwright/test';

test.describe('Bottom Navigation Active States (Mobile)', () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 12 Pro

  test('should highlight "Hoje" when at root /', async ({ page }) => {
    await page.goto('/');
    // The "Hoje" label should be clearly visible and have high opacity
    const hojeButton = page.getByRole('navigation', { name: /Navegação móvel|Mobile navigation/i })
      .getByRole('link', { name: /Hoje|Today/i });
    
    // In our implementation, we use aria-current="page" for the active item
    await expect(page.getByRole('button', { name: /Hoje|Today/i })).toHaveAttribute('aria-current', 'page');
  });

  test('should highlight "Hoje" when at /hoje', async ({ page }) => {
    await page.goto('/hoje');
    await expect(page.getByRole('button', { name: /Hoje|Today/i })).toHaveAttribute('aria-current', 'page');
  });

  test('should highlight "Bíblia" when at /bible', async ({ page }) => {
    await page.goto('/bible');
    await expect(page.getByRole('button', { name: /Bíblia|Bible/i })).toHaveAttribute('aria-current', 'page');
  });

  test('should highlight "Catecismo" when at /catechism', async ({ page }) => {
    await page.goto('/catechism');
    await expect(page.getByRole('button', { name: /Catecismo|Catechism/i })).toHaveAttribute('aria-current', 'page');
  });

  test('should highlight "Logos" when at /logos', async ({ page }) => {
    await page.goto('/logos');
    await expect(page.getByRole('button', { name: /Logos/i })).toHaveAttribute('aria-current', 'page');
  });

  test('should keep "Hoje" active on subroutes of /hoje', async ({ page }) => {
    // Note: We don't necessarily have subroutes yet, but the logic should support it
    await page.goto('/hoje/settings'); // Even if it redirects, we check the logic
    // If it redirects to /hoje or / it will still be active
    const currentUrl = page.url();
    if (currentUrl.includes('/hoje') || currentUrl.endsWith('/')) {
      await expect(page.getByRole('button', { name: /Hoje|Today/i })).toHaveAttribute('aria-current', 'page');
    }
  });

  test('should handle deep links correctly', async ({ page }) => {
    // Deep link to a specific Bible verse for example
    await page.goto('/bible?book=Genesis&chapter=1');
    await expect(page.getByRole('button', { name: /Bíblia|Bible/i })).toHaveAttribute('aria-current', 'page');
  });
});
