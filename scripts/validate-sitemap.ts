import fs from 'fs';
import path from 'path';
import { extractRoutesFromTypesAST, getPublicRoutes } from './utils';

/**
 * Script to validate sitemap.xml and legacy redirects.
 * Also compares sitemap entries with AppRoute enum from AST.
 * Generates an artifact report on mismatch.
 */

const SITEMAP_PATH = path.join(process.cwd(), 'public', 'sitemap.xml');
const REDIRECTS_PATH = path.join(process.cwd(), 'public', '_redirects');
const REPORT_PATH = path.join(process.cwd(), 'sitemap-validation-report.json');
const BASE_URL = 'https://www.cathedradigital.com.br';

function validateSitemapContent() {
  console.log('🔍 Validating sitemap.xml against AppRoute enum...');
  if (!fs.existsSync(SITEMAP_PATH)) {
    console.error('❌ Sitemap file not found!');
    process.exit(1);
  }

  const content = fs.readFileSync(SITEMAP_PATH, 'utf-8');
  
  // Extract URLs from sitemap
  const urlRegex = /<loc>(https:\/\/www\.cathedradigital\.com\.br[^<]*)<\/loc>/g;
  const sitemapUrls: string[] = [];
  let match;
  while ((match = urlRegex.exec(content)) !== null) {
    const url = match[1];
    const path = url.replace(BASE_URL, '') || '/';
    sitemapUrls.push(path);
  }

  // Get expected routes from AST
  const allRoutes = extractRoutesFromTypesAST();
  const expectedRoutes = getPublicRoutes(allRoutes);

  // Compare
  const missingInSitemap = expectedRoutes.filter(r => !sitemapUrls.includes(r));
  const extraInSitemap = sitemapUrls.filter(r => !expectedRoutes.includes(r));

  const report = {
    timestamp: new Date().toISOString(),
    status: (missingInSitemap.length === 0 && extraInSitemap.length === 0) ? 'success' : 'failure',
    summary: {
      totalInApp: expectedRoutes.length,
      totalInSitemap: sitemapUrls.length,
      missingCount: missingInSitemap.length,
      extraCount: extraInSitemap.length
    },
    missingRoutes: missingInSitemap,
    extraRoutes: extraInSitemap
  };

  // Always save report
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  console.log(`📝 Validation report saved to ${REPORT_PATH}`);

  let hasErrors = false;

  if (missingInSitemap.length > 0) {
    console.error('❌ Missing routes in sitemap:');
    missingInSitemap.forEach(r => console.error(`   - ${r}`));
    hasErrors = true;
  }

  if (extraInSitemap.length > 0) {
    console.error('❌ Extra routes in sitemap (not in AppRoute or private):');
    extraInSitemap.forEach(r => console.error(`   - ${r}`));
    hasErrors = true;
  }

  if (hasErrors) {
    console.error('❌ Sitemap is out of sync with AppRoute enum!');
    process.exit(1);
  }

  console.log(`✅ Sitemap validation passed! Found ${sitemapUrls.length} synchronized routes.`);
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

  // Check for essential legacy redirects
  const essentialRedirects = ['/dashboard', '/biblia', '/catecismo', '/curso-pch'];
  essentialRedirects.forEach(route => {
    if (!content.includes(route)) {
      console.error(`❌ Missing essential legacy redirect: ${route}`);
      errorCount++;
    }
  });

  if (errorCount > 0) {
    process.exit(1);
  }
  console.log('✅ Redirects validation passed!');
}

validateSitemapContent();
validateRedirects();
process.exit(0);
