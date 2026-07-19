/**
 * scripts/nav-coverage-report.ts
 *
 * Gera relatório de cobertura de navegação:
 *  - Rotas em src/config/routes.ts (APP_ROUTES)
 *  - Aliases legados via <Navigate> em src/App.tsx
 *  - Destinos da MobileBottomNav
 *  - AUTH_REQUIRED / ADMIN_SUBROUTES / MOBILE_NAV / LEGACY listados nos
 *    specs Playwright de nav
 *
 * Saída: REPORTS/nav-coverage.md
 *
 * Rodar: bun run scripts/nav-coverage-report.ts
 */
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const read = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf8');

function extractAppPaths(src: string): string[] {
  const paths: string[] = [];
  const re = /<Route\s+[^>]*path=["']([^"']+)["']/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) paths.push(m[1]);
  return paths;
}

function extractNavigateFromTo(src: string): Array<[string, string]> {
  const pairs: Array<[string, string]> = [];
  const re =
    /<Route\s+path=["']([^"']+)["']\s+element=\{<Navigate\s+to=["']([^"']+)["']/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) pairs.push([m[1], m[2]]);
  return pairs;
}

function extractAppRoutes(src: string): string[] {
  const out: string[] = [];
  const re = /\{\s*path:\s*['"]([^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) out.push(m[1]);
  return out;
}

function extractMobileNav(src: string): string[] {
  const out: string[] = [];
  const re = /\{\s*to:\s*["']([^"']+)["']/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) out.push(m[1]);
  return out;
}

function extractListFromSpec(src: string, constName: string): string[] {
  const re = new RegExp(`const\\s+${constName}\\s*[:=][\\s\\S]*?\\[([\\s\\S]*?)\\];`);
  const m = re.exec(src);
  if (!m) return [];
  const body = m[1];
  const strings: string[] = [];
  const s = /['"]([^'"]+)['"]/g;
  let mm: RegExpExecArray | null;
  while ((mm = s.exec(body)) !== null) {
    if (mm[1].startsWith('/')) strings.push(mm[1]);
  }
  return Array.from(new Set(strings));
}

const appSrc = read('src/App.tsx');
const routesSrc = read('src/config/routes.ts');
const mobileNavSrc = read('src/components/mobile/MobileBottomNav.tsx');
const specA = read('tests/e2e/bottom-nav-and-redirects-no-404.spec.ts');
const specB = read('tests/e2e/nav-auth-admin-snapshots.spec.ts');

const appPaths = extractAppPaths(appSrc);
const navigates = extractNavigateFromTo(appSrc); // [from, to]
const configRoutes = extractAppRoutes(routesSrc);
const mobileNav = extractMobileNav(mobileNavSrc);

const coveredMobile = extractListFromSpec(specA, 'MOBILE_NAV_TARGETS');
const coveredLegacy = extractListFromSpec(specA, 'LEGACY_REDIRECTS');
const coveredAuth = extractListFromSpec(specB, 'AUTH_REQUIRED');
const coveredAdmin = extractListFromSpec(specB, 'ADMIN_SUBROUTES');
const coveredSnap = extractListFromSpec(specB, 'NAV_ROUTES');

const covered = new Set<string>([
  ...coveredMobile,
  ...coveredLegacy,
  ...coveredAuth,
  ...coveredAdmin,
  ...coveredSnap,
]);

const legacyFroms = navigates.map(([f]) => f);

function bullets(list: string[]): string {
  if (!list.length) return '_(vazio)_';
  return list.map((x) => `- \`${x}\``).join('\n');
}

const uncoveredMobile = mobileNav.filter((r) => !covered.has(r));
const uncoveredLegacy = legacyFroms.filter((r) => !covered.has(r));
const uncoveredConfig = configRoutes.filter(
  (r) => !covered.has(r) && !r.includes(':') && r !== '*',
);

const total = mobileNav.length + legacyFroms.length + configRoutes.length;
const coveredCount =
  (mobileNav.length - uncoveredMobile.length) +
  (legacyFroms.length - uncoveredLegacy.length) +
  (configRoutes.length - uncoveredConfig.length);
const pct = total ? ((coveredCount / total) * 100).toFixed(1) : '0.0';

const md = `# Nav Coverage Report

_Gerado por \`scripts/nav-coverage-report.ts\`_

**Cobertura geral:** ${coveredCount}/${total} (${pct}%)

## Bottom Nav (MobileBottomNav)
Total: ${mobileNav.length} · Cobertos: ${mobileNav.length - uncoveredMobile.length} · Faltando: ${uncoveredMobile.length}

### Faltando
${bullets(uncoveredMobile)}

## Redirects legados (\`<Navigate to=...>\`)
Total: ${legacyFroms.length} · Cobertos: ${legacyFroms.length - uncoveredLegacy.length} · Faltando: ${uncoveredLegacy.length}

### Faltando
${bullets(uncoveredLegacy)}

## Rotas em \`src/config/routes.ts\`
Total: ${configRoutes.length} · Cobertos: ${configRoutes.length - uncoveredConfig.length} · Faltando: ${uncoveredConfig.length}

### Faltando
${bullets(uncoveredConfig)}

## Especificações que compõem a cobertura

- \`tests/e2e/bottom-nav-and-redirects-no-404.spec.ts\` — bottom nav + redirects legados
- \`tests/e2e/nav-auth-admin-snapshots.spec.ts\` — AuthGuard, /admin/*, snapshot estrutural
- \`src/test/BottomNavRoutesResolvable.test.ts\` — análise estática (vitest)

## Sanidade
- Rotas concretas declaradas em App.tsx: ${appPaths.length}
- <Navigate> mapeados: ${navigates.length}
`;

const out = resolve(process.cwd(), 'REPORTS/nav-coverage.md');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, md, 'utf8');
console.log(`✔ Relatório gerado: ${out}`);
console.log(`Cobertura: ${coveredCount}/${total} (${pct}%)`);

// Exit code 1 se cobertura crítica (mobile nav) tiver buracos.
if (uncoveredMobile.length > 0) {
  console.error(
    `\n✖ Itens da MobileBottomNav sem cobertura: ${uncoveredMobile.join(', ')}`,
  );
  process.exit(1);
}
