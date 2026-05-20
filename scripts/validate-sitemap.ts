import fs from 'fs';
import path from 'path';

/**
 * Script to validate sitemap.xml and legacy redirects.
 */

const SITEMAP_PATH = path.join(process.cwd(), 'public', 'sitemap.xml');
const REDIRECTS_PATH = path.join(process.cwd(), 'public', '_redirects');

function validateSitemap() {
  console.log('🔍 Validating sitemap.xml...');
  if (!fs.existsSync(SITEMAP_PATH)) {
    console.error('❌ Sitemap file not found!');
    process.exit(1);
  }

  const content = fs.readFileSync(SITEMAP_PATH, 'utf-8');
  
  // Basic XML structure check
  if (!content.startsWith('<?xml') || !content.includes('<urlset') || !content.includes('</urlset>')) {
    console.error('❌ Invalid XML structure in sitemap.xml');
    process.exit(1);
  }

  // Check for essential routes
  const essentialRoutes = ['https://www.cathedradigital.com.br', '/hoje', '/bible', '/catechism'];
  essentialRoutes.forEach(route => {
    if (!content.includes(route)) {
      console.error(`❌ Missing essential route in sitemap: ${route}`);
      process.exit(1);
    }
  });

  console.log('✅ Sitemap validation passed!');
}

function validateRedirects() {
  console.log('🔍 Validating legacy redirects...');
  if (!fs.existsSync(REDIRECTS_PATH)) {
    console.error('❌ _redirects file not found!');
    process.exit(1);
  }

  const content = fs.readFileSync(REDIRECTS_PATH, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));

  let errorCount = 0;
  lines.forEach(line => {
    const parts = line.split(/\s+/);
    if (parts.length < 3) {
      console.error(`❌ Invalid redirect line format: "${line}"`);
      errorCount++;
      return;
    }

    const [from, to, status] = parts;
    if (status !== '301') {
      console.error(`❌ Redirect for "${from}" should be 301, found: "${status}"`);
      errorCount++;
    }

    if (!to.startsWith('/') && !to.startsWith('http')) {
       console.error(`❌ Destination for "${from}" should start with "/" or "http", found: "${to}"`);
       errorCount++;
    }
  });

  if (errorCount > 0) {
    process.exit(1);
  }
  console.log('✅ Redirects validation passed!');
}

validateSitemap();
validateRedirects();
process.exit(0);
