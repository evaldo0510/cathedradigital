import { test, expect } from '@playwright/test';
import { SEO_CONFIG } from '../../src/config/seo';

test.describe('SEO & Structured Data Audit', () => {
  test('should have correct JSON-LD schemas and search configuration', async ({ page }) => {
    await page.goto('/');

    const scripts = await page.locator('script[type="application/ld+json"]').all();
    expect(scripts.length).toBeGreaterThan(0);

    const typeCounts: Record<string, number> = {};
    const schemaResults: any[] = [];

    for (const script of scripts) {
      const content = await script.textContent();
      if (!content) continue;
      
      try {
        const json = JSON.parse(content);
        const type = json['@type'];
        
        typeCounts[type] = (typeCounts[type] || 0) + 1;

        if (type === 'WebSite') {
          // Validate SearchAction
          const searchAction = json.potentialAction;
          expect(searchAction?.['@type']).toBe('SearchAction');
          
          const expectedTarget = `${SEO_CONFIG.BASE_URL}${SEO_CONFIG.SEARCH_PATH}?${SEO_CONFIG.SEARCH_PARAM}={search_term_string}`;
          expect(searchAction.target).toBe(expectedTarget);
          
          // Verify it accepts the query parameter correctly
          const url = new URL(searchAction.target.replace('{search_term_string}', 'teologia'));
          expect(url.searchParams.get(SEO_CONFIG.SEARCH_PARAM)).toBe('teologia');
          
          expect(json.url).toBe(SEO_CONFIG.BASE_URL);
          schemaResults.push({ type: 'WebSite', status: 'valid' });
        }

        if (type === 'Organization') {
          expect(json.name).toBe(SEO_CONFIG.ORGANIZATION.name);
          expect(json.url).toBe(SEO_CONFIG.BASE_URL);
          expect(json.logo).toContain('logo-cathedra.png');
          expect(Array.isArray(json.sameAs)).toBe(true);
          schemaResults.push({ type: 'Organization', status: 'valid' });
        }

        if (type === 'BreadcrumbList') {
          expect(json.itemListElement.length).toBeGreaterThan(0);
          expect(json.itemListElement[0].name).toBe('Home');
          schemaResults.push({ type: 'BreadcrumbList', status: 'valid' });
        }
      } catch (e) {
        expect(false, `Malformed JSON-LD found: ${e}`).toBe(true);
      }
    }

    // Check for duplicates of critical schemas
    expect(typeCounts['WebSite'] || 0, 'Multiple WebSite schemas detected. This is a critical SEO error.').toBeLessThanOrEqual(1);
    expect(typeCounts['Organization'] || 0, 'Multiple Organization schemas detected. This is a critical SEO error.').toBeLessThanOrEqual(1);

    expect(typeCounts['WebSite'], 'WebSite schema missing').toBe(1);
    expect(typeCounts['Organization'], 'Organization schema missing').toBe(1);
    expect(typeCounts['BreadcrumbList'], 'BreadcrumbList schema missing').toBeGreaterThanOrEqual(1);
    
    console.log('--- Schema Validation Report ---');
    console.table(schemaResults);
  });
});
