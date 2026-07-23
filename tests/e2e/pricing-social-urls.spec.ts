import { test, expect } from '@playwright/test';
import { SEO_CONFIG } from '../../src/config/seo';

/**
 * og:url e twitter:url devem apontar exatamente para /pricing (URL absoluta
 * com domínio canônico) e nunca conter /planos.
 */
test.describe('/pricing · og:url + twitter:url', () => {
  test('social URLs absolutas, canônicas e sem /planos', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    const ogUrl = await page.locator('head meta[property="og:url"]').first().getAttribute('content');
    const twUrl = await page.locator('head meta[name="twitter:url"]').first().getAttribute('content');

    expect(ogUrl, 'og:url ausente em /pricing').toBeTruthy();
    expect(twUrl, 'twitter:url ausente em /pricing').toBeTruthy();

    for (const [tag, value] of [['og:url', ogUrl!], ['twitter:url', twUrl!]] as const) {
      // Absoluta https
      expect(value, `${tag} deve ser URL absoluta`).toMatch(/^https:\/\//);
      // Domínio canônico configurado no projeto
      expect(value.startsWith(SEO_CONFIG.BASE_URL), `${tag} não usa BASE_URL canônico: ${value}`).toBe(true);
      // Path exato = /pricing
      const path = new URL(value).pathname.replace(/\/$/, '') || '/';
      expect(path, `${tag} deveria terminar em /pricing, veio: ${value}`).toBe('/pricing');
      // Nenhuma menção a /planos
      expect(value).not.toContain('/planos');
    }
  });
});
