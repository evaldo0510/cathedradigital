import fs from 'fs';
import path from 'path';
import { extractRoutesFromTypesAST, getPublicRoutes } from './utils';

/**
 * Script to generate sitemap.xml dynamically from AppRoute enum in src/types.ts using AST.
 * Only public routes are included.
 */

const BASE_URL = 'https://www.cathedradigital.com.br';

function generateSitemap() {
  const allRoutes = extractRoutesFromTypesAST();
  const publicRoutes = getPublicRoutes(allRoutes);
  const lastmod = new Date().toISOString().split('T')[0];
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  publicRoutes.forEach(route => {
    let priority = '0.8';
    let changefreq = 'daily';
    
    if (route === '/') {
      priority = '1.0';
    } else if (['/about', '/terms', '/privacy', '/transparencia', '/partners', '/diagnostico'].includes(route)) {
      priority = '0.5';
      changefreq = 'monthly';
    } else if (['/glossary', '/papas', '/guia-modulos'].includes(route)) {
      priority = '0.6';
      changefreq = 'weekly';
    }
    
    xml += '  <url>\n';
    xml += `    <loc>${BASE_URL}${route === '/' ? '' : route}</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += `    <changefreq>${changefreq}</changefreq>\n`;
    xml += `    <priority>${priority}</priority>\n`;
    xml += '  </url>\n';
  });
  
  xml += '</urlset>';
  
  const outputPath = path.join(process.cwd(), 'public', 'sitemap.xml');
  fs.writeFileSync(outputPath, xml);
  console.log(`✅ Sitemap generated with ${publicRoutes.length} routes at ${outputPath} using AST.`);
}

generateSitemap();
