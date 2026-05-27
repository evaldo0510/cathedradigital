import { chromium } from '@playwright/test';
import { z } from 'zod';
import { SEO_CONFIG } from '../src/config/seo';

const SchemaContext = z.literal('https://schema.org');

const WebSiteSchema = z.object({
  '@context': SchemaContext,
  '@type': z.literal('WebSite'),
  name: z.string(),
  url: z.string().url(),
  potentialAction: z.object({
    '@type': z.literal('SearchAction'),
    target: z.string().includes('{search_term_string}'),
    'query-input': z.string()
  })
});

const OrganizationSchema = z.object({
  '@context': SchemaContext,
  '@type': z.literal('Organization'),
  name: z.string(),
  url: z.string().url(),
  logo: z.string().url(),
  sameAs: z.array(z.string().url())
});

const BreadcrumbListSchema = z.object({
  '@context': SchemaContext,
  '@type': z.literal('BreadcrumbList'),
  itemListElement: z.array(z.object({
    '@type': z.literal('ListItem'),
    position: z.number(),
    name: z.string(),
    item: z.string()
  }))
});

async function validate() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const baseUrl = 'http://localhost:8080'; // Assume dev server is running

  console.log(`Auditing JSON-LD on ${baseUrl}...`);
  
  try {
    await page.goto(baseUrl);
    const scripts = await page.locator('script[type="application/ld+json"]').all();
    
    const results = {
      valid: [] as string[],
      errors: [] as { type: string, error: any }[]
    };

    const typeCounts: Record<string, number> = {};

    for (const script of scripts) {
      const content = await script.textContent();
      if (!content) continue;
      
      const json = JSON.parse(content);
      const type = json['@type'];
      typeCounts[type] = (typeCounts[type] || 0) + 1;

      try {
        if (type === 'WebSite') WebSiteSchema.parse(json);
        else if (type === 'Organization') OrganizationSchema.parse(json);
        else if (type === 'BreadcrumbList') BreadcrumbListSchema.parse(json);
        
        results.valid.push(type);
      } catch (e: any) {
        results.errors.push({ type, error: e.errors });
      }
    }

    // Check for duplicates
    ['WebSite', 'Organization'].forEach(type => {
      if (typeCounts[type] > 1) {
        results.errors.push({ type, error: `Duplicate detected: ${typeCounts[type]} instances found.` });
      }
    });

    console.log('\n--- JSON-LD Audit Report ---');
    console.log('Valid schemas found:', results.valid.join(', '));
    
    if (results.errors.length > 0) {
      console.error('\nCritical Errors Found:');
      results.errors.forEach(err => {
        console.error(`[${err.type}]`, JSON.stringify(err.error, null, 2));
      });
      process.exit(1);
    } else {
      console.log('\nAll schemas passed validation!');
      process.exit(0);
    }

  } catch (error) {
    console.error('Audit failed:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

validate();
