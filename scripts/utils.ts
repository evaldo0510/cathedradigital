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

export function getPublicRoutes(allRoutes: string[]) {
  return Array.from(new Set(['/', ...allRoutes.filter(route => {
    // Public routes: no parameters, not starting with /admin, and not in the private list
    return !route.includes(':') && 
           !route.startsWith('/admin') && 
           !getPrivateRoutes(allRoutes).includes(route);
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
    '/offline', '/cache-manager', '/diario', '/diagnostics', '/upgrade'
  ];
  
  return allRoutes.filter(route => {
    return route.startsWith('/admin') || privateList.includes(route);
  });
}
