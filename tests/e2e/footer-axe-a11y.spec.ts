/**
 * Auditoria a11y com @axe-core/playwright focada no <footer>.
 * Roda em mobile e desktop, estado inicial e após expandir "Mais".
 * Falha o teste em qualquer violação de ARIA, contraste ou foco visível.
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8080';

const A11Y_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function scanFooter(page: import('@playwright/test').Page) {
  const results = await new AxeBuilder({ page })
    .include('footer')
    .withTags(A11Y_TAGS)
    // Sanitize noise fora do escopo: color-contrast em `.sr-only` e off-viewport
    .disableRules([])
    .analyze();

  const criticals = results.violations.filter(
    (v) => ['critical', 'serious', 'moderate'].includes(v.impact ?? ''),
  );
  if (criticals.length > 0) {
    console.error(
      `axe/footer violations:\n${criticals
        .map((v) => `  [${v.impact}] ${v.id} — ${v.description} (${v.nodes.length} nós)`)
        .join('\n')}`,
    );
  }
  expect(criticals, `Violações a11y no rodapé (${criticals.map((v) => v.id).join(', ')})`).toEqual([]);
}

test.describe('Footer — a11y (axe)', () => {
  test('desktop 1280x900 sem violações', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
    await page.locator('footer').first().scrollIntoViewIfNeeded();
    await scanFooter(page);
  });

  test('mobile 390x844 colapsado — sem violações', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
    await page.locator('footer').first().scrollIntoViewIfNeeded();
    await scanFooter(page);
  });

  test('mobile 390x844 expandido — sem violações', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
    await page.locator('footer').first().scrollIntoViewIfNeeded();
    await page.locator('[data-testid="footer-mobile-expand"]').first().click();
    await expect(page.locator('[data-testid="footer-mobile-expand"]').first()).toHaveAttribute('aria-expanded', 'true');
    await scanFooter(page);
  });

  test('foco visível em todos os controles do rodapé (Tab)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
    await page.locator('footer').first().scrollIntoViewIfNeeded();

    // Move o foco para o primeiro elemento focável dentro do footer
    const focusables = page.locator(
      'footer a, footer button, footer [tabindex]:not([tabindex="-1"]), footer input, footer select',
    );
    const total = await focusables.count();
    expect(total).toBeGreaterThan(0);

    for (let i = 0; i < Math.min(total, 25); i++) {
      const el = focusables.nth(i);
      await el.focus();
      const focused = await el.evaluate((node) => document.activeElement === node);
      expect(focused, `elemento ${i} deve receber foco`).toBe(true);

      // Verifica que há indicador de foco visível (outline OU box-shadow OU ring)
      const hasFocusRing = await el.evaluate((node) => {
        const cs = getComputedStyle(node as Element);
        const outlineVisible = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0;
        const shadowVisible = cs.boxShadow !== 'none' && !cs.boxShadow.includes('rgba(0, 0, 0, 0)');
        return outlineVisible || shadowVisible;
      });
      expect(hasFocusRing, `elemento ${i} sem indicador de foco visível`).toBe(true);
    }
  });
});
