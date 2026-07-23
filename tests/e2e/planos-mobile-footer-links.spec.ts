import { test, expect, devices, Page } from '@playwright/test';

/**
 * Sweep de links em modo mobile (header hambúrguer + footer) que possam
 * apontar para /planos ou /pricing. Cada link deve resolver em /pricing
 * sem loops de redirecionamento e com canonical correto.
 */

const MOBILE_SELECTORS = [
  'header a[href$="/planos"]',
  'header a[href$="/pricing"]',
  'footer a[href$="/planos"]',
  'footer a[href$="/pricing"]',
  'nav a[href$="/planos"]',
  'nav a[href$="/pricing"]',
].join(', ');

async function collectHrefs(page: Page): Promise<string[]> {
  return page.$$eval(MOBILE_SELECTORS, (nodes) =>
    Array.from(
      new Set(nodes.map((n) => (n as HTMLAnchorElement).getAttribute('href') ?? '')),
    ).filter(Boolean),
  );
}

test.use({ ...devices['Pixel 5'] });

test.describe('Mobile header/footer → /pricing (sem loop)', () => {
  test('todos os links mobile terminam em /pricing', async ({ page }) => {
    const navCount = { n: 0 };
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) navCount.n += 1;
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Abre menu hambúrguer, se existir, para expor links do header mobile.
    const menuToggle = page.locator('header button[aria-label*="menu" i]').first();
    if (await menuToggle.isVisible().catch(() => false)) {
      await menuToggle.click().catch(() => undefined);
    }

    const hrefs = await collectHrefs(page);
    // Se não há links diretos, o próprio /planos ainda precisa ser validado.
    const targets = hrefs.length > 0 ? hrefs : ['/planos'];

    for (const href of targets) {
      navCount.n = 0;
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      if (await menuToggle.isVisible().catch(() => false)) {
        await menuToggle.click().catch(() => undefined);
      }

      const link = page.locator(`a[href="${href}"]`).first();
      if (await link.count()) {
        await link.scrollIntoViewIfNeeded().catch(() => undefined);
        await link.click();
      } else {
        await page.goto(href);
      }

      await page.waitForURL('**/pricing', { timeout: 10_000 });
      expect(new URL(page.url()).pathname, `href ${href} não terminou em /pricing`).toBe('/pricing');
      expect(navCount.n, `loop detectado a partir de ${href}`).toBeLessThanOrEqual(4);

      const canonical = await page.getAttribute('link[rel="canonical"]', 'href');
      expect(canonical).toContain('/pricing');
      expect(canonical).not.toContain('/planos');
    }
  });
});
