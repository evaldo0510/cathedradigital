import fs from 'fs';
import path from 'path';
import { extractRoutesFromTypesAST, getPublicRoutes, getPrivateRoutes } from './utils';

const BASE_URL = 'https://www.cathedradigital.com.br';
const SITEMAP_PATH = path.join(process.cwd(), 'public', 'sitemap.xml');
const ROBOTS_PATH = path.join(process.cwd(), 'public', 'robots.txt');

function generateSitemap() {
  console.log('📦 Generating sitemap.xml...');
  const allRoutes = extractRoutesFromTypesAST();
  const publicRoutes = getPublicRoutes(allRoutes);

  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${publicRoutes.map(route => `  <url>
    <loc>${BASE_URL}${route === '/' ? '' : route}</loc>
    <changefreq>${route === '/' ? 'daily' : 'weekly'}</changefreq>
    <priority>${route === '/' ? '1.0' : '0.8'}</priority>
  </url>`).join('\n')}
</urlset>`;

  fs.writeFileSync(SITEMAP_PATH, sitemapContent);
  console.log(`✅ Sitemap generated at ${SITEMAP_PATH} with ${publicRoutes.length} routes.`);
}

function generateRobotsTxt() {
  console.log('📦 Generating robots.txt...');
  const allRoutes = extractRoutesFromTypesAST();
  const privateRoutes = getPrivateRoutes(allRoutes);

  const robotsContent = `User-agent: *
${privateRoutes.map(route => `Disallow: ${route}`).join('\n')}
Disallow: /admin/*
Disallow: /api/*

Sitemap: ${BASE_URL}/sitemap.xml`;

  fs.writeFileSync(ROBOTS_PATH, robotsContent);
  console.log(`✅ robots.txt generated at ${ROBOTS_PATH}.`);
}

generateSitemap();
generateRobotsTxt();
