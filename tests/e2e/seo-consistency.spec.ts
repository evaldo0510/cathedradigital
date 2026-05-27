import { test, expect } from '@playwright/test';
import { SEO_CONFIG } from '../../src/config/seo';

const ROUTES = ['/', '/biblia', '/catecismo', '/search'];

test.describe('Multi-Route SEO & Structured Data Consistency Audit', () => {
  for (const route of ROUTES) {
    test(`Audit SEO and JSON-LD on route: ${route}`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      const scripts = await page.locator('script[type="application/ld+json"]').all();
      expect(scripts.length, `No JSON-LD scripts found on ${route}`).toBeGreaterThan(0);

      const typeMap: Record<string, any[]> = {};

      for (const script of scripts) {
        const content = await script.textContent();
        if (!content) continue;
        
        try {
          const json = JSON.parse(content);
          const type = json['@type'];
          if (!typeMap[type]) typeMap[type] = [];
          typeMap[type].push(json);

          if (type === 'WebSite') {
            // Validate SearchAction consistency
            const searchAction = json.potentialAction;
            expect(searchAction?.['@type']).toBe('SearchAction');
            
            const expectedTarget = `${SEO_CONFIG.BASE_URL}${SEO_CONFIG.SEARCH_PATH}?${SEO_CONFIG.SEARCH_PARAM}={search_term_string}`;
            expect(searchAction.target).toBe(expectedTarget);
            expect(json.url).toBe(SEO_CONFIG.BASE_URL);
          }

          if (type === 'Organization') {
            expect(json.name).toBe(SEO_CONFIG.ORGANIZATION.name);
            expect(json.url).toBe(SEO_CONFIG.BASE_URL);
            expect(json.logo).toBe(SEO_CONFIG.ORGANIZATION.logo);
          }
        } catch (e) {
          throw new Error(`Malformed JSON-LD on ${route}: ${e}`);
        }
      }

      // 1. Conflict Detection: Check for multiple instances of same type with divergent content
      for (const [type, instances] of Object.entries(typeMap)) {
        if (instances.length > 1) {
          const first = JSON.stringify(instances[0]);
          for (let i = 1; i < instances.length; i++) {
            const current = JSON.stringify(instances[i]);
            expect(first, `Conflict detected in ${type} schema on ${route}. Multiple versions with different content exist.`).toBe(current);
          }
        }
      }

      // 2. Global Consistency: Every page should have WebSite and Organization
      expect(typeMap['WebSite']?.length, `WebSite schema missing or duplicate on ${route}`).toBe(1);
      expect(typeMap['Organization']?.length, `Organization schema missing or duplicate on ${route}`).toBe(1);
      expect(typeMap['BreadcrumbList']?.length, `BreadcrumbList schema missing on ${route}`).toBeGreaterThanOrEqual(1);
    });
  }
});
