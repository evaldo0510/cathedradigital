/**
 * Valida metadata SEO de todas as rotas mapeadas em src/config/routeMeta.ts.
 *
 * Regras:
 *  - title:        3..60 chars, sem defaults Lovable, sem duplicatas globais
 *  - description:  50..160 chars, sem defaults Lovable, sem duplicatas globais
 *  - canonicalPath (quando presente): começa com "/", sem query/hash
 *  - noindex:      admin/dev/legacy/auth devem estar noindex; rotas públicas não
 *  - cobertura:    toda rota <Route path="..."> pública em src/App.tsx deve
 *                  ter meta estática OU casar com um DYNAMIC_PATTERN
 *
 * Uso:
 *   bunx tsx scripts/validate-route-seo.ts           # falha o processo em erros
 *   bunx tsx scripts/validate-route-seo.ts --warn    # apenas relata
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { ROUTE_META, resolveRouteMeta, type RouteMeta } from '../src/config/routeMeta';

const LIMITS = {
  titleMin: 3,
  titleMax: 60,
  descMin: 50,
  descMax: 160,
};

const LOVABLE_DEFAULTS = ['Lovable App', 'Lovable Generated Project'];

const PRIVATE_PATTERNS: RegExp[] = [
  /^\/(admin|dev)(\/|$)/,
  /^\/(auth|login|reset-password|onboarding|profile|spiritual-profile|diario)(\/|$)/,
  /-legacy(\/|$)/,
  /^\/home-v3$/,
  /^\/legacy-home$/,
];

interface Issue {
  path: string;
  level: 'error' | 'warn';
  message: string;
}

const issues: Issue[] = [];
const seenTitles = new Map<string, string>();
const seenDescriptions = new Map<string, string>();

function push(path: string, level: Issue['level'], message: string) {
  issues.push({ path, level, message });
}

function validateEntry(path: string, meta: RouteMeta) {
  const { title, description, canonicalPath, noindex } = meta;

  // title (comprimento só cobrado em rotas indexáveis)
  if (!title || title.trim().length < LIMITS.titleMin) {
    push(path, 'error', `title vazio ou curto demais (<${LIMITS.titleMin})`);
  } else if (!noindex && title.length > LIMITS.titleMax) {
    push(path, 'error', `title com ${title.length} chars (>${LIMITS.titleMax})`);
  }
  if (title && LOVABLE_DEFAULTS.some((d) => title.includes(d))) {
    push(path, 'error', `title usa default Lovable: "${title}"`);
  }

  // description (comprimento só cobrado em rotas indexáveis)
  if (!description || description.trim().length === 0) {
    push(path, 'error', `description vazia`);
  } else if (!noindex) {
    if (description.length < LIMITS.descMin) {
      push(path, 'error', `description com ${description.length} chars (<${LIMITS.descMin})`);
    } else if (description.length > LIMITS.descMax) {
      push(path, 'error', `description com ${description.length} chars (>${LIMITS.descMax})`);
    }
  }
  if (description && LOVABLE_DEFAULTS.some((d) => description.includes(d))) {
    push(path, 'error', `description usa default Lovable`);
  }

  // canonicalPath (se presente)
  if (canonicalPath !== undefined) {
    if (!canonicalPath.startsWith('/')) {
      push(path, 'error', `canonicalPath deve começar com "/" (got "${canonicalPath}")`);
    }
    if (canonicalPath.includes('?') || canonicalPath.includes('#')) {
      push(path, 'error', `canonicalPath não pode ter query/hash (got "${canonicalPath}")`);
    }
  }

  // noindex coerente com natureza da rota
  const shouldBePrivate = PRIVATE_PATTERNS.some((p) => p.test(path));
  if (shouldBePrivate && !noindex) {
    push(path, 'error', `rota privada/legacy sem noindex`);
  }
  if (!shouldBePrivate && noindex && path !== '/') {
    push(path, 'warn', `rota pública marcada noindex — confirmar intenção`);
  }

  // duplicidade global (só em rotas indexáveis)
  if (!noindex) {
    if (title) {
      const prev = seenTitles.get(title);
      if (prev && prev !== path) {
        push(path, 'error', `title duplicado com ${prev}: "${title}"`);
      } else {
        seenTitles.set(title, path);
      }
    }
    if (description) {
      const prev = seenDescriptions.get(description);
      if (prev && prev !== path) {
        push(path, 'error', `description duplicada com ${prev}`);
      } else {
        seenDescriptions.set(description, path);
      }
    }
  }
}

// 1) Validar todas as entradas estáticas do ROUTE_META
for (const [path, meta] of Object.entries(ROUTE_META)) {
  validateEntry(path, meta);
}

// 2) Cobertura: percorrer <Route path="..."> em src/App.tsx
const appSource = readFileSync(resolve('src/App.tsx'), 'utf-8');
const routeRegex = /<Route\s+path="([^"]+)"/g;
const declaredPaths = new Set<string>();
let m: RegExpExecArray | null;
while ((m = routeRegex.exec(appSource)) !== null) {
  const raw = m[1];
  if (raw === '*' || raw.includes('/lovable')) continue;
  declaredPaths.add(raw);
}

const IGNORED_COVERAGE: RegExp[] = [
  /^\*$/,
  /^\/(admin|dev)(\/|$)/,             // cobertos pelo pattern dinâmico admin
  /^\/not-found$/,
  /^\/prototype-/,                    // rotas de prototipagem interna
  /^\/__test\//,                      // rotas de teste
  /-legacy(\/|$)/,                    // legados noindex
  // Ferramentas internas / dashboards de dev não expostos ao público
  /^\/(cache-manager|bible-recovery|telemetry|security|security-alerts|cid-compliance|seo-verify|seo-status|a11y-audit|visual-audit|axe-contrast|ui-errors|audit|integrity|bible-coverage|bible-cache|bible-abbr-validate|bible-perf|bible-perf-breakdown|bible-sources|bible-import|catechism-explorer|design-system|language|offline|nexus)(\/|$)/,
  // Aliases de rota (têm <Navigate replace>): não precisam de meta própria
  /^\/(library|prayer|prayers|rezar|orar|oracoes|rosario|via-crucis|via-sacra|saints|liturgy|today|journeys|notes|pesquisar|formacao|formar-se|minha-jornada|transparencia|about|terms|privacy)$/,
];

const coverageMisses: string[] = [];
for (const raw of declaredPaths) {
  if (IGNORED_COVERAGE.some((p) => p.test(raw))) continue;
  // normaliza :param para valor de exemplo
  const sample = raw.replace(/:[^/]+/g, 'exemplo');
  const resolved = resolveRouteMeta(sample);
  if (!resolved) coverageMisses.push(raw);
}

for (const raw of coverageMisses) {
  push(raw, 'warn', `rota declarada em App.tsx sem meta (nem estática, nem dinâmica)`);
}

// ── Relatório ──────────────────────────────────────────────────
const errors = issues.filter((i) => i.level === 'error');
const warnings = issues.filter((i) => i.level === 'warn');

const total = Object.keys(ROUTE_META).length;
console.log(`\n📋 Route SEO Validation`);
console.log(`   ${total} rotas mapeadas · ${declaredPaths.size} rotas em App.tsx`);
console.log(`   ${errors.length} erros · ${warnings.length} avisos\n`);

for (const i of issues) {
  const icon = i.level === 'error' ? '❌' : '⚠️ ';
  console.log(`${icon} ${i.path.padEnd(38)} ${i.message}`);
}

if (issues.length === 0) {
  console.log('✅ Sem problemas. Todos os títulos, descriptions, canonicals e robots dentro do padrão.');
}

const warnOnly = process.argv.includes('--warn');
if (errors.length > 0 && !warnOnly) {
  console.error(`\n💥 ${errors.length} erro(s) de SEO. Corrija antes do merge.\n`);
  process.exit(1);
}
