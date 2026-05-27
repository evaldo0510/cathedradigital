import { test, expect } from '@playwright/test';
import { SEO_CONFIG } from '../../src/config/seo';

test.describe('SEO & Structured Data Audit', () => {
  test('should have correct JSON-LD schemas and search configuration', async ({ page }) => {
    await page.goto('/');

    const scripts = await page.locator('script[type="application/ld+json"]').all();
    expect(scripts.length).toBeGreaterThan(0);

    const typeCounts: Record<string, number> = {};
    let foundWebSite = false;
    let foundOrganization = false;
    let foundBreadcrumb = false;

    for (const script of scripts) {
      const content = await script.textContent();
      const json = JSON.parse(content || '{}');
      const type = json['@type'];
      
      typeCounts[type] = (typeCounts[type] || 0) + 1;

      if (type === 'WebSite') {
        foundWebSite = true;
        // Validate SearchAction with config values
        const searchAction = json.potentialAction;
        expect(searchAction?.['@type']).toBe('SearchAction');
        const expectedTarget = `${SEO_CONFIG.BASE_URL}${SEO_CONFIG.SEARCH_PATH}?${SEO_CONFIG.SEARCH_PARAM}={search_term_string}`;
        expect(searchAction.target).toBe(expectedTarget);
        expect(json.url).toBe(SEO_CONFIG.BASE_URL);
      }

      if (type === 'Organization') {
        foundOrganization = true;
        expect(json.name).toBe(SEO_CONFIG.ORGANIZATION.name);
        expect(json.url).toBe(SEO_CONFIG.BASE_URL);
      }

      if (type === 'BreadcrumbList') {
        foundBreadcrumb = true;
        expect(json.itemListElement.length).toBeGreaterThan(0);
      }
    }

    // Check for duplicates of critical schemas
    expect(typeCounts['WebSite'] || 0, 'Duplicate WebSite schema detected').toBeLessThanOrEqual(1);
    expect(typeCounts['Organization'] || 0, 'Duplicate Organization schema detected').toBeLessThanOrEqual(1);

    expect(foundWebSite, 'WebSite schema missing').toBe(true);
    expect(foundOrganization, 'Organization schema missing').toBe(true);
    expect(foundBreadcrumb, 'BreadcrumbList schema missing').toBe(true);
  });
});
