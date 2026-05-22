import { test, expect } from '@playwright/test';

/**
 * SEO Audit for Home Page
 * Checks: H1, H2s, Title, Description, OG Tags, Alt texts, and Canonical.
 */
test.describe('SEO Review - Home Page', () => {
  test('Audit critical SEO elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const issues: string[] = [];
    const recommendations: string[] = [];

    // 1. Heading Structure
    const h1Count = await page.locator('h1').count();
    if (h1Count !== 1) {
      issues.push(`Found ${h1Count} H1 tags. Exactly one H1 is required.`);
      recommendations.push('Ensure only the main title (e.g., CATHEDRA) is an H1.');
    }

    const h2s = await page.locator('h2').allInnerTexts();
    if (h2s.length < 5) {
      issues.push(`Found only ${h2s.length} H2 tags. Main sections should have H2s.`);
    }

    // 2. Meta Tags
    const title = await page.title();
    if (title.length < 30 || title.length > 60) {
      issues.push(`Title length is ${title.length}. Ideal is between 30 and 60 chars.`);
    }

    const description = await page.getAttribute('meta[name="description"]', 'content');
    if (!description) {
      issues.push('Meta description is missing.');
    } else if (description.length < 120 || description.length > 160) {
      issues.push(`Description length is ${description.length}. Ideal is between 120 and 160 chars.`);
    }

    // 3. Open Graph
    const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content');
    if (!ogTitle) issues.push('OG Title is missing.');

    const ogImage = await page.getAttribute('meta[property="og:image"]', 'content');
    if (!ogImage) issues.push('OG Image is missing.');

    // 4. Alt texts
    const imagesWithoutAlt = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('img')).filter(img => !img.alt).length;
    });
    if (imagesWithoutAlt > 0) {
      issues.push(`Found ${imagesWithoutAlt} images without alt text.`);
      recommendations.push('Add descriptive alt text to all images for accessibility and SEO.');
    }

    // 5. Canonical
    const canonical = await page.getAttribute('link[rel="canonical"]', 'href');
    if (!canonical) {
      issues.push('Canonical tag is missing.');
    }

    // Report
    if (issues.length > 0) {
      console.log('\n--- SEO Audit Issues ---');
      issues.forEach(i => console.log(`- ${i}`));
      console.log('\n--- Actionable Recommendations ---');
      recommendations.forEach(r => console.log(`- ${r}`));
    }

    expect(issues.length).toBe(0);
  });
});
