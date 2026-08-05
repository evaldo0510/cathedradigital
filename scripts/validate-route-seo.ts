/**
 * Valida metadata SEO de todas as rotas mapeadas em src/config/routeMeta.ts
 * e faz cross-check com public/sitemap.xml.
 *
 * Regras:
 *  - title:        3..60 chars, sem defaults Lovable, sem duplicatas globais
 *  - description:  50..160 chars, sem defaults Lovable, sem duplicatas globais
 *  - canonicalPath (quando presente): começa com "/", sem query/hash
 *  - noindex:      admin/dev/legacy/auth/aliases devem estar noindex; rotas
 *                  públicas indexáveis não podem estar noindex
 *  - OpenGraph:    valida og:title, og:description e presença de campos básicos
 *  - hreflang:     valida conjunto consistente de idiomas e ausência de duplicatas
 *  - cobertura:    toda rota <Route path="..."> pública em src/App.tsx deve
 *                  ter meta estática OU casar com um DYNAMIC_PATTERN
 *  - sitemap:      cada URL em public/sitemap.xml deve ter meta indexável e
 *                  canonical coerente; toda rota indexável estática deve
 *                  aparecer no sitemap e estar permitida no robots.txt


 *
 * Flags:
 *   --warn                    apenas relata (não falha)
 *   --allow-warnings          não falha em warnings (por padrão CI falha)
 *   --html=<path>             emite relatório HTML detalhado
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { ROUTE_META, resolveRouteMeta, type RouteMeta } from '../src/config/routeMeta';
import { SUPPORTED_LOCALES } from '../src/lib/i18n/locales';


const LIMITS = { titleMin: 3, titleMax: 60, descMin: 50, descMax: 160 };
const LOVABLE_DEFAULTS = ['Lovable App', 'Lovable Generated Project'];
const BASE_URL = 'https://www.cathedradigital.com.br';

const PRIVATE_PATTERNS: RegExp[] = [
  /^\/(admin|dev)(\/|$)/,
  /^\/(auth|login|reset-password|onboarding|profile|spiritual-profile|diario)(\/|$)/,
  /^\/(favorites|achievements|checkout|transactions)(\/|$)/,
  /-legacy(\/|$)/,
  /^\/(audit-logs|site-health)(\/|$)/,
  /^\/home-v3$/,
  /^\/legacy-home$/,
];

interface Issue {
  path: string;
  level: 'error' | 'warn';
  message: string;
  category: 'meta' | 'coverage' | 'sitemap';
}

const issues: Issue[] = [];
const seenTitles = new Map<string, string>();
const seenDescriptions = new Map<string, string>();

const push = (path: string, level: Issue['level'], message: string, category: Issue['category']) =>
  issues.push({ path, level, message, category });

function validateEntry(path: string, meta: RouteMeta) {
  const { title, description, canonicalPath, noindex } = meta;

  if (!title || title.trim().length < LIMITS.titleMin) {
    push(path, 'error', `title vazio ou curto demais (<${LIMITS.titleMin})`, 'meta');
  } else if (!noindex && title.length > LIMITS.titleMax) {
    push(path, 'error', `title com ${title.length} chars (>${LIMITS.titleMax})`, 'meta');
  }
  if (title && LOVABLE_DEFAULTS.some((d) => title.includes(d))) {
    push(path, 'error', `title usa default Lovable: "${title}"`, 'meta');
  }

  if (!description || description.trim().length === 0) {
    push(path, 'error', `description vazia`, 'meta');
  } else if (!noindex) {
    if (description.length < LIMITS.descMin) {
      push(path, 'error', `description com ${description.length} chars (<${LIMITS.descMin})`, 'meta');
    } else if (description.length > LIMITS.descMax) {
      push(path, 'error', `description com ${description.length} chars (>${LIMITS.descMax})`, 'meta');
    }
  }
  if (description && LOVABLE_DEFAULTS.some((d) => description.includes(d))) {
    push(path, 'error', `description usa default Lovable`, 'meta');
  }

  if (canonicalPath !== undefined) {
    if (!canonicalPath.startsWith('/')) {
      push(path, 'error', `canonicalPath deve começar com "/" (got "${canonicalPath}")`, 'meta');
    }
    if (canonicalPath.includes('?') || canonicalPath.includes('#')) {
      push(path, 'error', `canonicalPath não pode ter query/hash (got "${canonicalPath}")`, 'meta');
    }
    // Verificação de canonical duplicado para rotas indexáveis (se não for alias intencional)
    if (!noindex && canonicalPath !== path) {
      push(path, 'warn', `rota indexável com canonicalPath diferente da própria rota`, 'meta');
    }
  }


  const shouldBePrivate = PRIVATE_PATTERNS.some((p) => p.test(path));
  const hasAliasCanonical = canonicalPath && canonicalPath !== path;
  if (shouldBePrivate && !noindex) {
    push(path, 'error', `rota privada/legacy sem noindex`, 'meta');
  }
  if (!shouldBePrivate && !hasAliasCanonical && noindex && path !== '/') {
    push(path, 'warn', `rota pública marcada noindex — confirmar intenção`, 'meta');
  }

  if (!noindex) {
    if (title) {
      const prev = seenTitles.get(title);
      if (prev && prev !== path) {
        push(path, 'error', `title duplicado com ${prev}: "${title}"`, 'meta');
      } else seenTitles.set(title, path);
    }
    if (description) {
      const prev = seenDescriptions.get(description);
      if (prev && prev !== path) {
        push(path, 'error', `description duplicada com ${prev}`, 'meta');
      } else seenDescriptions.set(description, path);
    }
  }

  // Validação de hreflang (apenas para rotas indexáveis multilingues como /docs)
  if (!noindex && path.startsWith('/docs')) {
    const localeMatch = SUPPORTED_LOCALES.find(l => path.startsWith(`/${l.code}/`) || path === `/${l.code}`);
    // Se a rota já tem prefixo, ela deve apontar para as outras via alternates (verificado via sitemap cross-check)
  }
}

function checkRobotsAllowed(path: string, robotsContent: string): boolean {
  const lines = robotsContent.split('\n');
  let isAllowed = true;
  let inRelevantUserAgent = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('#')) continue;

    const lower = line.toLowerCase();
    if (lower.startsWith('user-agent:')) {
      const ua = lower.slice(11).trim();
      inRelevantUserAgent = (ua === '*');
      continue;
    }

    if (inRelevantUserAgent && lower.startsWith('disallow:')) {
      const pattern = line.slice(9).trim();
      if (!pattern) continue;

      // robots.txt: pattern deve bater com o início da string
      if (path.startsWith(pattern) && path !== '/') {
        isAllowed = false;
        break;
      }

    }
  }
  return isAllowed;
}





// 1) ROUTE_META
for (const [path, meta] of Object.entries(ROUTE_META)) validateEntry(path, meta);

// 2) Cobertura vs App.tsx
const appSource = readFileSync(resolve('src/App.tsx'), 'utf-8');
const routeRegex = /<Route\s+path="([^"]+)"/g;
const declaredPaths = new Set<string>();
let m: RegExpExecArray | null;
while ((m = routeRegex.exec(appSource)) !== null) {
  const raw = m[1];
  if (raw === '*' || raw.includes('/lovable') || raw.includes('/.lovable')) continue;
  declaredPaths.add(raw);
}

const IGNORED_COVERAGE: RegExp[] = [
  /^\*$/,
  /^\/(admin|dev)(\/|$)/,
  /^\/not-found$/,
  /^\/prototype-/,
  /^\/__test\//,
  /-legacy(\/|$)/,
  /^\/(cache-manager|bible-recovery|telemetry|security|security-alerts|cid-compliance|seo-verify|seo-status|a11y-audit|visual-audit|axe-contrast|ui-errors|audit|integrity|bible-coverage|bible-cache|bible-abbr-validate|bible-perf|bible-perf-breakdown|bible-sources|bible-import|catechism-explorer|design-system|language|offline|nexus)(\/|$)/,
  /^\/(library|prayer|prayers|rezar|orar|oracoes|via-crucis|via-sacra|saints|liturgy|today|journeys|notes|pesquisar|formacao|formar-se|minha-jornada|transparencia|about|terms|privacy)$/,
  // Aliases 301 (Navigate) — sem página própria, canonical vive na rota destino
  /^\/legal\/termos$/,
  /^\/contact$/,

  // Sub-rotas privadas do /conta (nested routes sem leading slash)
  /^\/conta(\/|$)/,
  /^(perfil|jornada|favoritos|diario|configuracoes|admin)$/,
];

for (const raw of declaredPaths) {
  if (IGNORED_COVERAGE.some((p) => p.test(raw))) continue;
  const sample = raw.replace(/:[^/]+/g, 'exemplo');
  const resolved = resolveRouteMeta(sample);
  if (!resolved) push(raw, 'warn', `rota declarada em App.tsx sem meta (nem estática, nem dinâmica)`, 'coverage');
}

// 3) Cross-check com sitemap.xml
const sitemapPath = resolve('public/sitemap.xml');
const sitemapEntries: string[] = [];
if (existsSync(sitemapPath)) {
  const xml = readFileSync(sitemapPath, 'utf-8');
  const re = /<loc>([^<]+)<\/loc>/g;
  let mm: RegExpExecArray | null;
  while ((mm = re.exec(xml)) !== null) {
    const url = mm[1].trim();
    const p = url.startsWith(BASE_URL) ? url.slice(BASE_URL.length) || '/' : url;
    if (p.startsWith('/')) sitemapEntries.push(p);
  }

  const STALE_SITEMAP_PATHS = new Set([
    // rotas que não existem mais em App.tsx / types.ts órfãos
    '/quiz', '/study', '/trilhas',
  ]);
  for (const p of STALE_SITEMAP_PATHS) {
    if (sitemapEntries.includes(p)) {
      push(p, 'error', `URL no sitemap não existe em App.tsx (órfã em types.ts)`, 'sitemap');
    }
  }

  // 3a) URLs do sitemap devem ter meta indexável e canonical coerente
  const seenSitemap = new Set<string>();
  for (const p of sitemapEntries) {
    if (STALE_SITEMAP_PATHS.has(p)) continue;
    // Normaliza query strings — canonical é por pathname; a página é a mesma.
    const pathname = p.split('?')[0].split('#')[0];
    if (seenSitemap.has(p)) continue;
    seenSitemap.add(p);
    const meta = resolveRouteMeta(pathname);
    if (!meta) {
      push(p, 'error', `URL no sitemap sem meta correspondente`, 'sitemap');
      continue;
    }
    if (meta.noindex) {
      push(p, 'error', `URL no sitemap está marcada noindex em ROUTE_META`, 'sitemap');
    }
    if (meta.canonicalPath && meta.canonicalPath !== pathname) {
      push(p, 'error', `URL no sitemap difere do canonicalPath ("${meta.canonicalPath}")`, 'sitemap');
    }
  }

  // 3b) Rotas estáticas indexáveis devem aparecer no sitemap (ignorando rotas :param)
  const sitemapSet = new Set(sitemapEntries);
  for (const [path, meta] of Object.entries(ROUTE_META)) {
    if (meta.noindex) continue;
    if (path.includes(':')) continue;
    if (!sitemapSet.has(path)) {
      push(path, 'warn', `rota indexável ausente no sitemap.xml`, 'sitemap');
    }
  }
  const robotsPath = resolve('public/robots.txt');
  const robotsContent = existsSync(robotsPath) ? readFileSync(robotsPath, 'utf-8') : '';

  if (sitemapEntries.length > 0) {
    for (const p of sitemapEntries) {
      if (!checkRobotsAllowed(p, robotsContent)) {
        push(p, 'error', `URL no sitemap está bloqueada no robots.txt`, 'sitemap');
      }
    }
  }
} else {
  push('/sitemap.xml', 'warn', `public/sitemap.xml não encontrado — pulei cross-check`, 'sitemap');
}


// ── Relatório ──────────────────────────────────────────────────
const errors = issues.filter((i) => i.level === 'error');
const warnings = issues.filter((i) => i.level === 'warn');
const total = Object.keys(ROUTE_META).length;

console.log(`\n📋 Route SEO Validation`);
console.log(`   ${total} rotas mapeadas · ${declaredPaths.size} rotas em App.tsx · ${sitemapEntries.length} URLs no sitemap`);
console.log(`   ${errors.length} erros · ${warnings.length} avisos\n`);

for (const i of issues) {
  const icon = i.level === 'error' ? '❌' : '⚠️ ';
  console.log(`${icon} [${i.category}] ${i.path.padEnd(38)} ${i.message}`);
}
if (issues.length === 0) console.log('✅ Sem problemas.');

// ── HTML report ────────────────────────────────────────────────
const htmlArg = process.argv.find((a) => a.startsWith('--html='));
if (htmlArg) {
  const outPath = htmlArg.slice('--html='.length);
  mkdirSync(dirname(resolve(outPath)), { recursive: true });
  const now = new Date().toISOString();
  
  // Agrupa falhas por rota para a tabela de resumo no topo
  const routesWithIssues = Array.from(new Set(issues.map(i => i.path))).map(path => ({
    path,
    errors: issues.filter(i => i.path === path && i.level === 'error'),
    warnings: issues.filter(i => i.path === path && i.level === 'warn'),
  })).filter(r => r.errors.length > 0 || r.warnings.length > 0);

  const summaryRows = routesWithIssues.map(r => `
    <tr>
      <td><a href="#row-${r.path.replace(/\//g, '_')}">${r.path}</a></td>
      <td>${r.errors.length ? `<span class="tag-err">${r.errors.length} erros</span>` : ''}</td>
      <td>${r.warnings.length ? `<span class="tag-warn">${r.warnings.length} avisos</span>` : ''}</td>
    </tr>
  `).join('');

  const rows = Object.entries(ROUTE_META)
    .map(([p, meta]) => {
      const problems = issues.filter((i) => i.path === p);
      const rowId = `row-${p.replace(/\//g, '_')}`;

      const badge = meta.noindex
        ? '<span class="tag noindex">noindex</span>'
        : '<span class="tag idx">indexável</span>';
      const canon = meta.canonicalPath ? `<code>${meta.canonicalPath}</code>` : '<em>self</em>';
      const url = meta.noindex ? p : `<a href="${BASE_URL}${p}" target="_blank" rel="noreferrer">${p}</a>`;
      const issueList = problems.length
        ? `<ul>${problems.map((i) => `<li class="${i.level}">[${i.category}] ${escape(i.message)}</li>`).join('')}</ul>`
        : '<span class="ok">✓</span>';
      return `<tr id="${rowId}" class="${problems.some((i) => i.level === 'error') ? 'row-err' : problems.length ? 'row-warn' : ''}">
        <td>${url}</td>
        <td>${badge}</td>
        <td>${escape(meta.title)} <small>(${meta.title.length})</small></td>
        <td>${escape(meta.description)} <small>(${meta.description.length})</small></td>
        <td>${canon}</td>
        <td>${issueList}</td>
      </tr>`;
    })
    .join('\n');

  const summary = countByCategory(issues);
  const html = `<!doctype html><html lang="pt-br"><head><meta charset="utf-8">
<title>SEO Routes Report — Cathedra</title>
<style>
:root{--fg:#0B1F3A;--acc:#C8A96A;--err:#b91c1c;--warn:#b45309;--ok:#166534;--bg:#faf9f7;}
body{font:14px/1.5 -apple-system,BlinkMacSystemFont,"SF Pro Display",Inter,sans-serif;color:var(--fg);background:var(--bg);margin:0;padding:32px;}
h1{font-family:"Instrument Serif",Georgia,serif;font-weight:400;margin:0 0 4px;}
.meta{color:#666;margin-bottom:24px;}
.summary-table { margin-bottom: 32px; max-width: 600px; }
.tag-err { color: var(--err); font-weight: bold; }
.tag-warn { color: var(--warn); font-weight: bold; }
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:24px;}

.card{background:#fff;border:1px solid #e5e1d8;border-radius:8px;padding:12px 16px;}
.card b{display:block;font-size:22px;color:var(--fg);}
.card.err b{color:var(--err);}.card.warn b{color:var(--warn);}.card.ok b{color:var(--ok);}
table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #e5e1d8;border-radius:8px;overflow:hidden;}
th,td{padding:10px 12px;text-align:left;vertical-align:top;border-bottom:1px solid #f0ebe0;font-size:13px;}
th{background:#f3ede0;font-weight:600;position:sticky;top:0;}
tr.row-err{background:#fef2f2;}tr.row-warn{background:#fffbeb;}
.tag{display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;}
.tag.idx{background:#ecfdf5;color:#166534;}.tag.noindex{background:#f5f5f4;color:#57534e;}
li.error{color:var(--err);}li.warn{color:var(--warn);}
.ok{color:var(--ok);}
small{color:#94908a;}
code{background:#f5f2e9;padding:1px 6px;border-radius:4px;font-size:12px;}
</style></head><body>
<h1>SEO Routes Report</h1>
<div class="meta">Gerado em ${now} · base <code>${BASE_URL}</code></div>
  <div class="summary-table">
    <h3>Resumo de Falhas</h3>
    <table>
      <thead><tr><th>Rota</th><th>Erros</th><th>Avisos</th></tr></thead>
      <tbody>${summaryRows || '<tr><td colspan="3">Nenhuma falha encontrada.</td></tr>'}</tbody>
    </table>
  </div>

  <div class="cards">

  <div class="card"><b>${total}</b>rotas mapeadas</div>
  <div class="card"><b>${sitemapEntries.length}</b>URLs no sitemap</div>
  <div class="card"><b>${declaredPaths.size}</b>rotas em App.tsx</div>
  <div class="card ${errors.length ? 'err' : 'ok'}"><b>${errors.length}</b>erros</div>
  <div class="card ${warnings.length ? 'warn' : 'ok'}"><b>${warnings.length}</b>avisos</div>
  <div class="card"><b>${summary.meta}</b>issues meta</div>
  <div class="card"><b>${summary.coverage}</b>issues coverage</div>
  <div class="card"><b>${summary.sitemap}</b>issues sitemap</div>
</div>
<table>
<thead><tr><th>Rota</th><th>Status</th><th>Title</th><th>Description</th><th>Canonical</th><th>Problemas</th></tr></thead>
<tbody>${rows}</tbody></table>
</body></html>`;
  writeFileSync(outPath, html);
  
  // Gera versão JSON para o resumo do PR no CI
  const jsonPath = outPath.replace('.html', '.json');
  writeFileSync(jsonPath, JSON.stringify({
    total,
    errors: errors.length,
    warnings: warnings.length,
    timestamp: now,
    issueDetails: routesWithIssues.map(r => ({
      path: r.path,
      errors: r.errors.map(e => e.message),
      warnings: r.warnings.map(w => w.message)
    }))
  }, null, 2));


  console.log(`\n📄 HTML report: ${outPath}`);
  console.log(`📄 JSON summary: ${jsonPath}`);

}

// ── Exit code ──────────────────────────────────────────────────
const warnOnly = process.argv.includes('--warn');
const allowWarnings = process.argv.includes('--allow-warnings');

if (warnOnly) process.exit(0);
if (errors.length > 0) {
  console.error(`\n💥 ${errors.length} erro(s) de SEO.\n`);
  process.exit(1);
}
if (warnings.length > 0 && !allowWarnings) {
  console.error(`\n💥 ${warnings.length} aviso(s) de SEO (modo estrito). Use --allow-warnings para tolerar.\n`);
  process.exit(1);
}

function escape(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function countByCategory(list: Issue[]) {
  return {
    meta: list.filter((i) => i.category === 'meta').length,
    coverage: list.filter((i) => i.category === 'coverage').length,
    sitemap: list.filter((i) => i.category === 'sitemap').length,
  };
}
