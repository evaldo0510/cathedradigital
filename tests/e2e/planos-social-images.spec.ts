import { test, expect } from '@playwright/test';

/**
 * Após navegar /planos → /pricing, valida que og:image e twitter:image
 * (quando presentes) são https, não contêm /planos e retornam HTTP 200.
 */
test.describe('/planos → /pricing · og:image & twitter:image acessíveis', () => {
  test('imagens sociais retornam 200 e são https sem /planos', async ({ page, request }) => {
    await page.goto('/planos');
    await page.waitForURL('**/pricing');
    await page.waitForLoadState('networkidle');

    const ogImage = await page.locator('head meta[property="og:image"]').first().getAttribute('content');
    const twImage = await page.locator('head meta[name="twitter:image"]').first().getAttribute('content');

    const images = [ogImage, twImage].filter((v): v is string => !!v);
    // og:image é opcional (hosting injeta em runtime); se presente, precisa ser válido.
    for (const url of images) {
      expect(url, `imagem social não é https: ${url}`).toMatch(/^https:\/\//);
      expect(url, `imagem social referencia /planos: ${url}`).not.toContain('/planos');

      const res = await request.get(url, { failOnStatusCode: false });
      expect(res.status(), `imagem social ${url} não retornou 200`).toBe(200);

      const ct = res.headers()['content-type'] ?? '';
      expect(ct.toLowerCase(), `content-type inesperado em ${url}: ${ct}`).toMatch(/^image\//);
    }
  });
});
