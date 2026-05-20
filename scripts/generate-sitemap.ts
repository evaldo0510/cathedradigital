import fs from 'fs';
import path from 'path';

/**
 * Script to generate sitemap.xml dynamically from AppRoute enum.
 * Only public routes are included.
 */

const BASE_URL = 'https://www.cathedradigital.com.br';
const PUBLIC_ROUTES = [
  '/',
  '/hoje',
  '/bible',
  '/catechism',
  '/santos',
  '/liturgia',
  '/magisterium',
  '/temas',
  '/biblioteca',
  '/oracao',
  '/comunidade',
  '/about',
  '/papas',
  '/glossary',
  '/encyclopedia',
  '/az-faith',
  '/jornadas',
  '/diagnostico',
  '/transparencia',
  '/partners',
  '/guia-modulos',
  '/terms',
  '/privacy'
];

function generateSitemap() {
  const lastmod = new Date().toISOString().split('T')[0];
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  PUBLIC_ROUTES.forEach(route => {
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
    xml += `    <loc>${BASE_URL}${route}</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += `    <changefreq>${changefreq}</changefreq>\n`;
    xml += `    <priority>${priority}</priority>\n`;
    xml += '  </url>\n';
  });
  
  xml += '</urlset>';
  
  const outputPath = path.join(process.cwd(), 'public', 'sitemap.xml');
  fs.writeFileSync(outputPath, xml);
  console.log(`✅ Sitemap generated at ${outputPath}`);
}

generateSitemap();
