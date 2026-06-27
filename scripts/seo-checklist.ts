/**
 * SEO Checklist - roda no prebuild.
 * Verifica presença e validade de sitemap.xml, robots.txt, llms.txt e meta tags base.
 * Escreve relatório em public/seo-checklist-report.json (consumido pelo painel /admin/seo-status).
 */
import fs from 'fs';
import path from 'path';

const PROJECT_DOMAIN = 'https://www.cathedradigital.com.br';
const PUBLIC_DIR = path.join(process.cwd(), 'public');

type CheckStatus = 'pass' | 'warn' | 'fail';
interface Check {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
}

const checks: Check[] = [];

function read(file: string): string | null {
  const p = path.join(PUBLIC_DIR, file);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
}

// 1) sitemap.xml
const sitemap = read('sitemap.xml');
if (!sitemap) {
  checks.push({ id: 'sitemap_exists', label: 'sitemap.xml presente', status: 'fail', detail: 'public/sitemap.xml não encontrado.' });
} else {
  const urlCount = (sitemap.match(/<loc>/g) || []).length;
  const wrongHost = !sitemap.includes(PROJECT_DOMAIN);
  checks.push({
    id: 'sitemap_exists',
    label: 'sitemap.xml presente',
    status: 'pass',
    detail: `${urlCount} URLs declaradas.`,
  });
  checks.push({
    id: 'sitemap_host',
    label: 'sitemap.xml usa domínio do projeto',
    status: wrongHost ? 'fail' : 'pass',
    detail: wrongHost ? `Esperado base ${PROJECT_DOMAIN}.` : `Base ${PROJECT_DOMAIN} confirmada.`,
  });
}

// 2) robots.txt
const robots = read('robots.txt');
if (!robots) {
  checks.push({ id: 'robots_exists', label: 'robots.txt presente', status: 'fail', detail: 'public/robots.txt não encontrado.' });
} else {
  const sitemapLine = robots.match(/^Sitemap:\s*(.+)$/m)?.[1]?.trim();
  const expected = `${PROJECT_DOMAIN}/sitemap.xml`;
  checks.push({
    id: 'robots_exists',
    label: 'robots.txt presente',
    status: 'pass',
    detail: 'Arquivo presente.',
  });
  checks.push({
    id: 'robots_sitemap',
    label: 'robots.txt aponta para o sitemap correto',
    status: sitemapLine === expected ? 'pass' : 'fail',
    detail: sitemapLine ? `Sitemap: ${sitemapLine}` : 'Linha Sitemap: ausente.',
  });
  const blocksAll = /^Disallow:\s*\/\s*$/m.test(robots) && !/^Allow:\s*\/\s*$/m.test(robots);
  checks.push({
    id: 'robots_not_blocking',
    label: 'robots.txt não bloqueia o site inteiro',
    status: blocksAll ? 'fail' : 'pass',
    detail: blocksAll ? 'Encontrado "Disallow: /" sem Allow correspondente.' : 'Crawl permitido em /.',
  });
}

// 3) llms.txt
const llms = read('llms.txt');
if (!llms) {
  checks.push({ id: 'llms_exists', label: 'llms.txt presente', status: 'fail', detail: 'public/llms.txt não encontrado.' });
} else {
  const hasH1 = /^#\s+\S/m.test(llms);
  const hasSummary = /^>\s+\S/m.test(llms);
  checks.push({
    id: 'llms_exists',
    label: 'llms.txt presente',
    status: hasH1 ? 'pass' : 'warn',
    detail: hasH1 ? `${llms.length} bytes.` : 'Falta H1 inicial.',
  });
  checks.push({
    id: 'llms_summary',
    label: 'llms.txt traz resumo (>)',
    status: hasSummary ? 'pass' : 'warn',
    detail: hasSummary ? 'Resumo presente.' : 'Sem linha de blockquote (> ...).',
  });
}

// 4) index.html metadata
const indexHtmlPath = path.join(process.cwd(), 'index.html');
if (fs.existsSync(indexHtmlPath)) {
  const html = fs.readFileSync(indexHtmlPath, 'utf8');
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1] ?? '';
  const desc = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/)?.[1] ?? '';
  const canonical = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/)?.[1] ?? '';
  const ogTitle = /property=["']og:title["']/.test(html);
  const ogUrl = /property=["']og:url["']/.test(html);
  const generic = /lovable app|lovable generated project|vite app/i.test(title + ' ' + desc);

  checks.push({
    id: 'meta_title',
    label: '<title> definido e não genérico',
    status: !title ? 'fail' : generic ? 'warn' : 'pass',
    detail: title || 'ausente',
  });
  checks.push({
    id: 'meta_description',
    label: 'meta description definida',
    status: !desc ? 'fail' : desc.length < 50 || desc.length > 160 ? 'warn' : 'pass',
    detail: desc ? `${desc.length} caracteres` : 'ausente',
  });
  checks.push({
    id: 'meta_canonical',
    label: 'canonical aponta para o domínio',
    status: canonical.startsWith(PROJECT_DOMAIN) ? 'pass' : 'warn',
    detail: canonical || 'ausente',
  });
  checks.push({
    id: 'meta_og',
    label: 'Open Graph (og:title, og:url) presentes',
    status: ogTitle && ogUrl ? 'pass' : 'warn',
    detail: `og:title=${ogTitle}, og:url=${ogUrl}`,
  });
}

// 5) GSC verification meta tag (informativo)
const indexHtml = fs.existsSync(indexHtmlPath) ? fs.readFileSync(indexHtmlPath, 'utf8') : '';
const hasGscMeta = /name=["']google-site-verification["']/.test(indexHtml);
checks.push({
  id: 'gsc_meta',
  label: 'Google Search Console: meta verification',
  status: hasGscMeta ? 'pass' : 'warn',
  detail: hasGscMeta ? 'Meta google-site-verification presente.' : 'Sem meta google-site-verification (configurar via /admin/seo-status após conectar GSC).',
});

const summary = {
  pass: checks.filter((c) => c.status === 'pass').length,
  warn: checks.filter((c) => c.status === 'warn').length,
  fail: checks.filter((c) => c.status === 'fail').length,
};

const report = {
  generated_at: new Date().toISOString(),
  project_domain: PROJECT_DOMAIN,
  summary,
  checks,
};

const outPath = path.join(PUBLIC_DIR, 'seo-checklist-report.json');
fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

const icon = summary.fail > 0 ? '❌' : summary.warn > 0 ? '⚠️' : '✅';
console.log(`${icon} SEO checklist: ${summary.pass} pass / ${summary.warn} warn / ${summary.fail} fail → ${outPath}`);

if (summary.fail > 0 && process.env.SEO_CHECKLIST_STRICT === '1') {
  process.exit(1);
}
