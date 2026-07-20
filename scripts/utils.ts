import fs from 'fs';
import path from 'path';
import ts from 'typescript';

export function extractRoutesFromTypesAST() {
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
          routes.push(route);
        }
      });
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return routes;
}

/**
 * Rotas presentes no enum AppRoute mas que não estão registradas em <Route>
 * no App.tsx (ou foram descontinuadas). Mantidas no enum porque outras partes
 * do código ainda referenciam a constante — mas NÃO devem ir para o sitemap.
 */
const STALE_ROUTES = new Set<string>([
  '/catechism/explorer',
  '/daily-liturgy',
  '/diagnostico',
  '/jornada-guiada',
  '/mass',
]);

export function getPublicRoutes(allRoutes: string[]) {
  const priv = new Set(getPrivateRoutes(allRoutes));
  return Array.from(new Set(['/', ...allRoutes.filter(route => {
    return !route.includes(':') &&
           !route.startsWith('/admin') &&
           !priv.has(route) &&
           !STALE_ROUTES.has(route);
  })])).sort((a, b) => {
    if (a === '/') return -1;
    if (b === '/') return 1;
    return a.localeCompare(b);
  });
}

export function getPrivateRoutes(allRoutes: string[]) {
  const privateList = [
    '/login', '/checkout', '/profile', '/favorites', '/checkout/result',
    '/vendedor', '/transactions', '/a11y-audit', '/security-audit',
    '/catechism/integrity', '/catechism/health', '/catechism/verify',
    '/offline', '/cache-manager', '/diario', '/diagnostics', '/upgrade',
    // Rotas de desenvolvimento / preview — não devem ser indexadas
    '/home-v3', '/legacy-home', '/home', '/dev/editorial', '/dev/mobile',
  ];

  return allRoutes.filter(route => {
    return route.startsWith('/admin') || privateList.includes(route);
  });
}
