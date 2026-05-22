import fs from 'fs';
import path from 'path';
import { extractRoutesFromTypesAST, getPublicRoutes, getPrivateRoutes } from './utils';

/**
 * Script to generate sitemap.xml and robots.txt dynamically from AppRoute enum in src/types.ts using AST.
 * Only public routes are included in sitemap.
 * Robots.txt Disallow list is derived from private routes.
 */

const BASE_URL = 'https://www.cathedradigital.com.br';

function generateSitemap() {
  const allRoutes = extractRoutesFromTypesAST();
  const publicRoutes = getPublicRoutes(allRoutes);
  const privateRoutes = getPrivateRoutes(allRoutes);
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
  
  const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
  fs.writeFileSync(sitemapPath, xml);
  console.log(`✅ Sitemap generated with ${publicRoutes.length} routes at ${sitemapPath} using AST.`);

  // Generate robots.txt
  let robotsTxt = `User-agent: *\nAllow: /\n`;
  
  // Sort and deduplicate private routes for robots.txt
  const disallowList = Array.from(new Set(privateRoutes)).sort();
  disallowList.forEach(route => {
    robotsTxt += `Disallow: ${route}\n`;
  });
  
  robotsTxt += `\nSitemap: ${BASE_URL}/sitemap.xml\n`;
  
  const robotsPath = path.join(process.cwd(), 'public', 'robots.txt');
  fs.writeFileSync(robotsPath, robotsTxt);
  console.log(`✅ robots.txt generated with ${disallowList.length} disallowed routes at ${robotsPath}`);
}

generateSitemap();
