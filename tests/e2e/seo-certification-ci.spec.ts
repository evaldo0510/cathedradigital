import { test, expect } from '@playwright/test';
import { ROUTE_META } from '../../src/config/routeMeta';
import { validateJsonLdList } from '../../src/lib/seo/jsonLdValidator';

const BASE_URL = 'http://localhost:8080';
// Reduzimos para rotas mais críticas para o CI não estourar tempo
const CRITICAL_ROUTES = [
  '/',
  '/bible',
  '/catechism',
  '/oracao',
  '/santos',
  '/pricing'
];

test.describe('SEO & Schema Certification E2E', () => {
  for (const route of CRITICAL_ROUTES) {
    test(`Certificação: ${route}`, async ({ page }) => {
      // Usamos domcontentloaded para ser mais rápido
      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });

      const meta = ROUTE_META[route];
      if (!meta) return;
      
      // 1. Título e Descrição
      const title = await page.title();
      expect(title).toBe(meta.title);
      
      const description = await page.locator('meta[name="description"]').getAttribute('content');
      expect(description).toBe(meta.description);

      // 2. Canonical
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      const expectedCanonical = meta.canonicalPath 
        ? `https://www.cathedradigital.com.br${meta.canonicalPath}`
        : `https://www.cathedradigital.com.br${route === '/' ? '' : route}`;
      expect(canonical).toBe(expectedCanonical);

      // 3. OpenGraph
      const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
      expect(ogTitle).toBe(meta.ogTitle || meta.title);
      
      // 4. JSON-LD Validation
      const jsonLdScripts = await page.locator('script[type="application/ld+json"]').all();
      for (const script of jsonLdScripts) {
        const content = await script.textContent();
        if (content) {
          try {
            const json = JSON.parse(content);
            const errors = validateJsonLdList(json);
            expect(errors, `JSON-LD erros em ${route}: ${errors.join(', ')}`).toHaveLength(0);
          } catch (e) {
            // Se falhar o parse, o teste deve falhar
            throw new Error(`Falha ao parsear JSON-LD em ${route}: ${e.message}`);
          }
        }
      }
    });
  }
});
