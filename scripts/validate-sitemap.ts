import fs from 'fs';
import path from 'path';

/**
 * Script to validate that all public routes in AppRoute are present in sitemap.xml
 */

const SITEMAP_PATH = path.join(process.cwd(), 'public', 'sitemap.xml');

// Define what we consider "public" routes that SHOULD be in the sitemap
// This should match the list in generate-sitemap.ts
const EXPECTED_PUBLIC_ROUTES = [
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

function validateSitemap() {
  if (!fs.existsSync(SITEMAP_PATH)) {
    console.error('❌ Sitemap file not found!');
    process.exit(1);
  }

  const content = fs.readFileSync(SITEMAP_PATH, 'utf-8');
  let missingCount = 0;

  EXPECTED_PUBLIC_ROUTES.forEach(route => {
    const loc = `https://www.cathedradigital.com.br${route}`;
    if (!content.includes(`<loc>${loc}</loc>`)) {
      console.error(`❌ Missing route in sitemap: ${route}`);
      missingCount++;
    }
  });

  if (missingCount > 0) {
    console.error(`\n❌ Validation failed: ${missingCount} routes missing from sitemap.`);
    process.exit(1);
  }

  console.log('✅ Sitemap validation passed!');
  process.exit(0);
}

validateSitemap();
