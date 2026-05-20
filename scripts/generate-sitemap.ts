import fs from 'fs';
import path from 'path';
import ts from 'typescript';

/**
 * Script to generate sitemap.xml dynamically from AppRoute enum in src/types.ts using AST.
 * Only public routes are included.
 */

const BASE_URL = 'https://www.cathedradigital.com.br';

function extractRoutesFromTypesAST() {
  const typesPath = path.join(process.cwd(), 'src', 'types.ts');
  const sourceFile = ts.createSourceFile(
    'types.ts',
    fs.readFileSync(typesPath, 'utf-8'),
    ts.ScriptTarget.Latest,
    true
  );

  const routes: string[] = [];
  
  function visit(node: ts.Node) {
    if (ts.isEnumDeclaration(node) && node.name.text === 'AppRoute') {
      node.members.forEach(member => {
        if (member.initializer && ts.isStringLiteral(member.initializer)) {
          const route = member.initializer.text;
          // Skip routes with parameters (e.g. /santos/:id) and admin/private routes
          if (!route.includes(':') && 
              !route.startsWith('/admin') && 
              !['/login', '/checkout', '/profile', '/favorites', '/checkout/result', '/vendedor', '/transactions', '/a11y-audit', '/security-audit', '/catechism/integrity', '/catechism/health', '/catechism/verify', '/offline', '/cache-manager', '/diario', '/diagnostics', '/upgrade'].includes(route)) {
            routes.push(route);
          }
        }
      });
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  
  // Ensure home is first and unique
  return Array.from(new Set(['/', ...routes])).sort((a, b) => {
    if (a === '/') return -1;
    if (b === '/') return 1;
    return a.localeCompare(b);
  });
}

function generateSitemap() {
  const publicRoutes = extractRoutesFromTypesAST();
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
