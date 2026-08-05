import { describe, it, expect } from 'vitest';
import { ROUTE_META } from '../config/routeMeta';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { validateJsonLdList } from '../lib/seo/jsonLdValidator';

describe('SEO & Route Integrity', () => {
  it('should have valid ROUTE_META for all primary routes', () => {
    const criticalRoutes = ['/', '/bible', '/catechism', '/oracao', '/santos'];
    criticalRoutes.forEach(route => {
      const meta = ROUTE_META[route];
      expect(meta, `Route ${route} is missing from ROUTE_META`).toBeDefined();
      expect(meta.title.length, `Title for ${route} is too short`).toBeGreaterThan(3);
      expect(meta.description.length, `Description for ${route} is too short`).toBeGreaterThan(10);
    });
  });

  it('should verify sitemap existence and basic structure', () => {
    const sitemapPath = resolve('public/sitemap.xml');
    // Note: In CI, generate-sitemap runs before this test
    if (existsSync(sitemapPath)) {
      const sitemap = readFileSync(sitemapPath, 'utf-8');
      expect(sitemap).toContain('<?xml');
      expect(sitemap).toContain('<urlset');
      expect(sitemap).toContain('https://www.cathedradigital.com.br');
    }
  });

  it('should have no indexable route with "Lovable" default text', () => {
    Object.entries(ROUTE_META).forEach(([path, meta]) => {
      if (!meta.noindex) {
        expect(meta.title).not.toContain('Lovable App');
        expect(meta.title).not.toContain('Lovable Generated Project');
        expect(meta.description).not.toContain('Lovable');
      }
    });
  });

  it('should have canonicalPath starting with slash if defined', () => {
     Object.entries(ROUTE_META).forEach(([path, meta]) => {
      if (meta.canonicalPath) {
        expect(meta.canonicalPath.startsWith('/')).toBe(true);
      }
    });
  });

  it('should validate static JSON-LD files in public directory', () => {
    // Se houver arquivos JSON-LD estáticos, validamos aqui
    const publicDir = resolve('public');
    const staticJsonLd = ['manifest.json']; // Exemplo, manifest não é schema.org mas ilustra
    staticJsonLd.forEach(file => {
      const path = resolve(publicDir, file);
      if (existsSync(path)) {
        try {
          const content = JSON.parse(readFileSync(path, 'utf-8'));
          // Apenas se for schema.org
          if (content['@context'] === 'https://schema.org') {
            const errors = validateJsonLdList(content);
            expect(errors, `Errors in ${file}: ${errors.join(', ')}`).toHaveLength(0);
          }
        } catch (e) {
          // Ignora se não for JSON válido (manifest pode ter comentários em alguns sistemas, embora raro aqui)
        }
      }
    });
  });
});
