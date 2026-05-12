import { writeFileSync } from 'fs';
import { join } from 'path';

const BASE_URL = 'https://cathedradigital.lovable.app';

const routes = [
  '',
  '/dashboard',
  '/biblia',
  '/catecismo',
  '/santos',
  '/liturgia',
  '/magisterio',
  '/temas',
  '/biblioteca',
  '/oracao',
  '/comunidade',
  '/sobre',
  '/papas',
  '/glossario',
  '/encyclopedia',
  '/az-faith',
  '/jornadas',
  '/diagnostico',
  '/hoje',
  '/cache-manager',
  '/transparencia'
];

const generateSitemap = () => {
  const date = new Date().toISOString().split('T')[0];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(route => `  <url>
    <loc>${BASE_URL}${route}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${route === '' ? '1.0' : '0.8'}</priority>
  </url>`).join('\n')}
</urlset>`;

  writeFileSync(join(process.cwd(), 'public', 'sitemap.xml'), sitemap);
  console.log('Sitemap generated successfully!');
};

const generateRobots = () => {
  const robots = `User-agent: *
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml`;

  writeFileSync(join(process.cwd(), 'public', 'robots.txt'), robots);
  console.log('Robots.txt generated successfully!');
};

generateSitemap();
generateRobots();
