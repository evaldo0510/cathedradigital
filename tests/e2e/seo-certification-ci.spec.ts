/**
 * Validação automática de JSON-LD e SEO no CI.
 * Implementa validação do schema.org, geração de relatórios e testes E2E.
 */

import { test, expect } from '@playwright/test';
import { ROUTE_META } from '../../src/config/routeMeta';
import { validateJsonLdList } from '../../src/lib/seo/jsonLdValidator';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:8080';
const CRITICAL_ROUTES = ['/', '/bible', '/catechism', '/oracao', '/santos', '/pricing'];

test.describe('Fase 6.1 — Certificação SEO & JSON-LD', () => {
  const report: any[] = [];

  test.afterAll(async () => {
    const reportPath = path.join(process.cwd(), 'dist/seo/e2e-seo-report.json');
    const htmlPath = path.join(process.cwd(), 'dist/seo/e2e-seo-report.html');
    
    if (!fs.existsSync(path.dirname(reportPath))) {
      fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>SEO E2E Report</title>
        <style>
          body { font-family: sans-serif; padding: 20px; color: #0B1F3A; }
          .route { margin-bottom: 20px; border: 1px solid #C8A96A; padding: 15px; border-radius: 8px; }
          .error { color: #dc2626; }
          .success { color: #16a34a; }
          code { background: #f3f4f6; padding: 2px 4px; }
        </style>
      </head>
      <body>
        <h1>Cathedra SEO E2E Audit</h1>
        ${report.map(r => `
          <div class="route">
            <h2>${r.path}</h2>
            <p><strong>Status:</strong> <span class="${r.errors.length > 0 ? 'error' : 'success'}">${r.errors.length > 0 ? 'FALHA' : 'OK'}</span></p>
            ${r.errors.length > 0 ? `<ul>${r.errors.map((e: string) => `<li class="error">${e}</li>`).join('')}</ul>` : '<p class="success">Nenhum erro detectado.</p>'}
            <details>
              <summary>Metadados Extraídos</summary>
              <pre><code>${JSON.stringify(r.meta, null, 2)}</code></pre>
            </details>
          </div>
        `).join('')}
      </body>
      </html>
    `;
    fs.writeFileSync(htmlPath, html);
    console.log(`\n📄 SEO E2E Report: ${htmlPath}`);
  });

  for (const routePath of CRITICAL_ROUTES) {
    test(`Validar SEO e JSON-LD em ${routePath}`, async ({ page }) => {
      await page.goto(`${BASE_URL}${routePath}`);
      await page.waitForLoadState('networkidle');

      const routeErrors: string[] = [];
      const routeMeta = ROUTE_META[routePath] || {};

      // 1. Validar Título e Descrição
      const title = await page.title();
      const description = await page.getAttribute('meta[name="description"]', 'content');
      const canonical = await page.getAttribute('link[rel="canonical"]', 'href');

      if (!title) routeErrors.push('Título ausente');
      if (!description) routeErrors.push('Meta description ausente');
      if (!canonical) routeErrors.push('Link canonical ausente');
      
      if (routeMeta.title && title !== routeMeta.title) {
        routeErrors.push(`Título divergente. Esperado: "${routeMeta.title}", Obtido: "${title}"`);
      }

      // 2. Validar JSON-LD
      const jsonLdScripts = await page.locator('script[type="application/ld+json"]').all();
      if (jsonLdScripts.length === 0 && !routeMeta.noindex) {
        routeErrors.push('JSON-LD ausente em rota indexável');
      }

      for (const script of jsonLdScripts) {
        const content = await script.textContent();
        if (content) {
          try {
            const json = JSON.parse(content);
            const validationErrors = validateJsonLdList(json, routePath);
            routeErrors.push(...validationErrors);
          } catch (e) {
            routeErrors.push(`JSON-LD malformado: ${e}`);
          }
        }
      }

      report.push({
        path: routePath,
        errors: routeErrors,
        meta: { title, description, canonical, jsonLdCount: jsonLdScripts.length }
      });

      expect(routeErrors, `Erros de SEO em ${routePath}`).toHaveLength(0);
    });
  }
});
