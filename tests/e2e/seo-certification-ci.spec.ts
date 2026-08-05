import { test, expect } from '@playwright/test';
import { ROUTE_META } from '../../src/config/routeMeta';
import { validateJsonLdList } from '../../src/lib/seo/jsonLdValidator';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';
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
      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });

      const meta = ROUTE_META[route];
      if (!meta) return;
      
      const actual = {
        title: await page.title(),
        description: await page.locator('meta[name="description"]').getAttribute('content'),
        canonical: await page.locator('link[rel="canonical"]').getAttribute('href'),
        ogTitle: await page.locator('meta[property="og:title"]').getAttribute('content'),
        jsonLd: [] as any[]
      };

      const expectedCanonical = meta.canonicalPath 
        ? `https://www.cathedradigital.com.br${meta.canonicalPath}`
        : `https://www.cathedradigital.com.br${route === '/' ? '' : route}`;

      const jsonLdScripts = await page.locator('script[type="application/ld+json"]').all();
      for (const script of jsonLdScripts) {
        const content = await script.textContent();
        if (content) {
          try {
            actual.jsonLd.push(JSON.parse(content));
          } catch (e) {
            console.error(`[E2E Error] JSON-LD inválido em ${route}: ${e.message}`);
          }
        }
      }

      try {
        expect(actual.title, `Título incorreto em ${route}`).toBe(meta.title);
        expect(actual.description, `Descrição incorreta em ${route}`).toBe(meta.description);
        expect(actual.canonical, `Canonical incorreto em ${route}`).toBe(expectedCanonical);
        expect(actual.ogTitle, `OG Title incorreto em ${route}`).toBe(meta.ogTitle || meta.title);

        for (const json of actual.jsonLd) {
          const errors = validateJsonLdList(json);
          expect(errors, `JSON-LD erros em ${route}: ${errors.join(', ')}`).toHaveLength(0);
        }
      } catch (e) {
        console.log(`\n❌ Falha de SEO em: ${route}`);
        console.log(`--------------------------------------------------`);
        console.log(`ESPERADO:`, {
          title: meta.title,
          description: meta.description,
          canonical: expectedCanonical,
          ogTitle: meta.ogTitle || meta.title
        });
        console.log(`RECEBIDO:`, actual);
        console.log(`--------------------------------------------------\n`);
        throw e;
      }
    });
  }
});
