import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-core/playwright';

test.describe('AUDIT 7.7 — Acessibilidade e Performance', () => {
  const routes = [
    { name: 'Catecismo', path: '/catecismo' },
    { name: 'Bíblia', path: '/biblia' },
    { name: 'Santos', path: '/santos' }
  ];

  for (const route of routes) {
    test(`Certificação A11y e Performance: ${route.name}`, async ({ page }) => {
      // 1. Métricas de Performance
      const start = Date.now();
      const response = await page.goto(`http://localhost:8080${route.path}`);
      const ttfb = Date.now() - start;
      
      // Esperar o LCP aproximado (primeiro conteúdo significativo)
      await page.waitForLoadState('domcontentloaded');
      const loadTime = Date.now() - start;

      // Capturar LCP via Performance API
      const lcp = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            resolve(lastEntry.startTime);
          }).observe({ type: 'largest-contentful-paint', buffered: true });
          
          // Fallback se não disparar em 3s
          setTimeout(() => resolve(performance.now()), 3000);
        });
      });

      console.log(`Route: ${route.name}`);
      console.log(`TTFB: ${ttfb}ms`);
      console.log(`LoadTime: ${loadTime}ms`);
      console.log(`LCP: ${Math.round(Number(lcp))}ms`);

      // 2. Acessibilidade (Axe)
      await injectAxe(page);
      
      // Contraste, Labels, etc.
      await checkA11y(page, null, {
        detailedReport: true,
        detailedReportOptions: { html: true }
      });

      // 3. Navegação por Teclado
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => document.activeElement?.tagName);
      expect(focused).not.toBe('BODY');
    });
  }
});
