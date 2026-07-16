/**
 * Agrega os relatórios por-rota gravados por
 * tests/e2e/axe-color-contrast-regression.spec.ts (ou pelo runner ad-hoc
 * scripts/axe-contrast-run.ts) em:
 *
 * - reports/axe-contrast/summary.json — dado bruto para automações
 * - reports/axe-contrast/summary.md   — comentário sticky do PR
 * - reports/axe-contrast/heatmap.md   — top classes recorrentes cross-rota
 *
 * O heatmap categoriza cada classe encontrada em:
 *   color    → tokens de cor (text-*, bg-*, placeholder:text-*)
 *   opacity  → modificadores de opacidade (opacity-N, text-primary com /N)
 *   typography (ruído — presença correlacionada mas não causal)
 *   layout   (idem)
 *
 * O ranking de "top classes" IGNORA typography/layout — só reporta o que
 * de fato pode ter causado a falha (color/opacity). Cada rota também
 * ganha uma seção com seletor DOM completo + utility responsável + trecho
 * de HTML para localizar o componente.
 *
 * Sem dependências externas — roda em `bunx tsx`.
 */
import fs from 'fs';
import path from 'path';

type NodeReport = {
  target: string[];
  html?: string;
  failureSummary?: string;
  any?: Array<{ id: string; data?: unknown }>;
};
type ViolationReport = {
  id: string;
  impact?: string;
  help: string;
  helpUrl: string;
  nodes: NodeReport[];
};
type RouteReport = {
  route: string;
  tier: 'enforced' | 'tracked' | 'adhoc';
  timestamp: string;
  totalNodes: number;
  violations: ViolationReport[];
};

const REPORT_DIR = path.join(process.cwd(), 'reports', 'axe-contrast');
const ARTIFACT_BASE_URL = process.env.ARTIFACT_BASE_URL ?? '';
const RUN_ID = process.env.GITHUB_RUN_ID ?? '';
const REPO = process.env.GITHUB_REPOSITORY ?? '';
// Link direto ao arquivo dentro do artifact (só funciona após download).
// Como GH não expõe arquivo-a-arquivo do artifact, apontamos para a página
// do run onde o artifact está listado. Cada linha inclui também o path
// literal para quem baixar o zip.
const ARTIFACT_HINT = RUN_ID && REPO
  ? `https://github.com/${REPO}/actions/runs/${RUN_ID}#artifacts`
  : '';

if (!fs.existsSync(REPORT_DIR)) {
  console.error(`[axe-contrast-heatmap] no reports at ${REPORT_DIR}`);
  process.exit(0);
}

const files = fs
  .readdirSync(REPORT_DIR)
  .filter((f) => f.endsWith('.json') && f !== 'summary.json');

const reports: RouteReport[] = files
  .map((f) => JSON.parse(fs.readFileSync(path.join(REPORT_DIR, f), 'utf8')))
  .sort((a, b) => a.route.localeCompare(b.route));

// ---------- classificação de classes ----------
type Category = 'color' | 'opacity' | 'typography' | 'layout' | 'other';

function classifyClass(cls: string): Category {
  // opacity utilities
  if (/^opacity-\d+$/.test(cls)) return 'opacity';
  // tailwind color+opacity: text-primary/40, text-muted-foreground/60, bg-*/N
  if (/^(text|bg|placeholder:text|border|ring|from|to|via|fill|stroke)-.+\/\d+$/.test(cls)) {
    return 'opacity';
  }
  // plain color utilities
  if (/^(text|bg|placeholder:text|border|ring|from|to|via|fill|stroke)-/.test(cls)) {
    return 'color';
  }
  // typography noise
  if (
    cls === 'uppercase' ||
    cls === 'lowercase' ||
    cls === 'capitalize' ||
    cls === 'italic' ||
    cls === 'not-italic' ||
    /^font-/.test(cls) ||
    /^tracking-/.test(cls) ||
    /^leading-/.test(cls) ||
    /^text-\[/.test(cls) ||   // arbitrary font-size
    /^text-(xs|sm|base|lg|xl|\dxl)$/.test(cls) ||
    /^text-premium-/.test(cls)
  ) {
    return 'typography';
  }
  // layout noise
  if (
    /^(m|p|w|h|min|max|gap|space|grid|flex|inline|block|hidden|shrink|grow|justify|items|self|absolute|relative|fixed|sticky|top|bottom|left|right|inset|z|order|col|row|aspect|rounded|shadow|transition|group|hover|focus|active|dark|md|lg|xl|2xl|sm)-?/.test(
      cls,
    ) ||
    cls === 'group' ||
    cls === 'container'
  ) {
    return 'layout';
  }
  return 'other';
}

function extractClasses(html: string): string[] {
  const matches = html.match(/class="([^"]+)"/g) ?? [];
  const out = new Set<string>();
  for (const m of matches) {
    const raw = m.slice(7, -1);
    for (const c of raw.split(/\s+/)) {
      if (c && c.length < 80) out.add(c);
    }
  }
  return Array.from(out);
}

function pickResponsibleUtilities(html: string): { primary: string[]; category: Category } {
  const classes = extractClasses(html);
  const opacity = classes.filter((c) => classifyClass(c) === 'opacity');
  const color = classes.filter((c) => classifyClass(c) === 'color');
  if (opacity.length) return { primary: opacity, category: 'opacity' };
  if (color.length) return { primary: color, category: 'color' };
  return { primary: [], category: 'other' };
}

function nearestComponentHint(target: string[]): string {
  // axe target é um array de seletores (um por iframe); pegamos o primeiro
  // e cortamos os últimos 3 segmentos para dar contexto.
  const chain = target[0] ?? '';
  const parts = chain.split(/\s*>\s*/);
  return parts.slice(-3).join(' > ');
}

function anchor(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// ---------- buckets ----------
type Bucket = { key: string; count: number; routes: Set<string>; sample: string; category: Category };
const causalBuckets = new Map<string, Bucket>();
const allBuckets = new Map<string, Bucket>();

function bump(map: Map<string, Bucket>, key: string, route: string, sample: string, category: Category) {
  const b = map.get(key) ?? { key, count: 0, routes: new Set<string>(), sample, category };
  b.count += 1;
  b.routes.add(route);
  map.set(key, b);
}

// ---------- per-route detail rows ----------
type RouteDetail = {
  route: string;
  tier: string;
  domSelector: string;
  utility: string[];
  utilityCategory: Category;
  htmlSample: string;
  contrastRatio?: number;
  expectedRatio?: number;
  fgColor?: string;
  bgColor?: string;
};
const perRouteDetail = new Map<string, RouteDetail[]>();

for (const r of reports) {
  const bucket: RouteDetail[] = [];
  for (const v of r.violations) {
    for (const n of v.nodes) {
      const html = n.html ?? '';
      const classes = extractClasses(html);
      const responsible = pickResponsibleUtilities(html);
      for (const c of classes) {
        const cat = classifyClass(c);
        bump(allBuckets, c, r.route, html.slice(0, 200), cat);
        if (cat === 'color' || cat === 'opacity') {
          bump(causalBuckets, c, r.route, html.slice(0, 200), cat);
        }
      }
      const check = n.any?.find((a) => a.id === 'color-contrast');
      const data = (check?.data ?? {}) as Record<string, unknown>;
      bucket.push({
        route: r.route,
        tier: r.tier,
        domSelector: nearestComponentHint(n.target),
        utility: responsible.primary,
        utilityCategory: responsible.category,
        htmlSample: html.slice(0, 240),
        contrastRatio: typeof data.contrastRatio === 'number' ? data.contrastRatio : undefined,
        expectedRatio: typeof data.expectedContrastRatio === 'number' ? data.expectedContrastRatio : undefined,
        fgColor: typeof data.fgColor === 'string' ? data.fgColor : undefined,
        bgColor: typeof data.bgColor === 'string' ? data.bgColor : undefined,
      });
    }
  }
  perRouteDetail.set(r.route, bucket);
}

const topCausal = Array.from(causalBuckets.values())
  .sort((a, b) => b.count - a.count || b.routes.size - a.routes.size)
  .slice(0, 30);

// ---------- summary por rota ----------
const perRoute = reports.map((r) => ({
  route: r.route,
  tier: r.tier,
  violations: r.violations.length,
  nodes: r.totalNodes,
  reportFile: `${r.tier}-${r.route.replace(/[^a-z0-9]+/gi, '_') || 'root'}.json`,
}));

const enforcedFailing = perRoute.filter((r) => r.tier === 'enforced' && r.nodes > 0);
const trackedCleaned = perRoute.filter((r) => r.tier === 'tracked' && r.nodes === 0);
const trackedDirty = perRoute.filter((r) => r.tier === 'tracked' && r.nodes > 0);
const totalNodes = perRoute.reduce((n, r) => n + r.nodes, 0);

// ---------- write summary.json ----------
fs.writeFileSync(
  path.join(REPORT_DIR, 'summary.json'),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      totals: {
        routes: perRoute.length,
        nodes: totalNodes,
        enforcedFailing: enforcedFailing.length,
        trackedCleaned: trackedCleaned.length,
        trackedDirty: trackedDirty.length,
      },
      perRoute,
      trackedDirty,
      trackedCleaned,
      enforcedFailing,
      topCausalClasses: topCausal.map((b) => ({
        class: b.key,
        category: b.category,
        count: b.count,
        routes: Array.from(b.routes),
        sample: b.sample,
      })),
      perRouteDetail: Object.fromEntries(perRouteDetail),
    },
    null,
    2,
  ),
);

// ---------- helpers de link ----------
function jsonLink(file: string) {
  if (!ARTIFACT_HINT) return `\`reports/axe-contrast/${file}\``;
  return `[JSON](${ARTIFACT_HINT}) · \`reports/axe-contrast/${file}\``;
}

function heatmapAnchorLink(cls: string) {
  return `[${cls}](#hm-${anchor(cls)})`;
}

// ---------- summary.md (sticky PR comment) ----------
let s = `## axe-core · color-contrast · resumo por rota\n\n`;
s += `**Totais:** ${perRoute.length} rotas · ${totalNodes} nó(s) · `;
s += `${enforcedFailing.length} enforced falhando · ${trackedDirty.length} tracked com violações · `;
s += `${trackedCleaned.length} tracked prontas para promoção\n\n`;

if (enforcedFailing.length > 0) {
  s += `> ❌ **Regressão em rota enforced:** ${enforcedFailing.map((r) => `\`${r.route}\``).join(', ')}\n\n`;
}
if (trackedCleaned.length > 0) {
  s += `> ✅ **Promover para ENFORCED_ROUTES:** ${trackedCleaned.map((r) => `\`${r.route}\``).join(', ')}\n\n`;
}

s += `| Rota | Tier | Violations | Nós | Report | Top classes causais |\n`;
s += `|---|---|---:|---:|---|---|\n`;
for (const r of perRoute.slice().sort((a, b) => b.nodes - a.nodes || a.route.localeCompare(b.route))) {
  const details = perRouteDetail.get(r.route) ?? [];
  const topUtils = new Map<string, number>();
  for (const d of details) {
    if (d.utilityCategory === 'color' || d.utilityCategory === 'opacity') {
      for (const u of d.utility) topUtils.set(u, (topUtils.get(u) ?? 0) + 1);
    }
  }
  const topList = Array.from(topUtils.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([u, n]) => `${heatmapAnchorLink(u)}×${n}`)
    .join(', ') || '—';
  s += `| \`${r.route}\` | ${r.tier} | ${r.violations} | ${r.nodes} | ${jsonLink(r.reportFile)} | ${topList} |\n`;
}

// heatmap embutido
s += `\n## Heatmap · classes causais (color/opacity)\n\n`;
if (topCausal.length === 0) {
  s += `_Nenhuma classe causal detectada — auditar failureSummary manualmente._\n`;
} else {
  s += `| Classe | Categoria | Ocorrências | Rotas |\n|---|---|---:|---|\n`;
  for (const b of topCausal) {
    s += `| <a id="hm-${anchor(b.key)}"></a>\`${b.key}\` | ${b.category} | ${b.count} | ${Array.from(b.routes).map((r) => `\`${r}\``).join(', ')} |\n`;
  }
}

// detalhamento por rota (colapsado)
s += `\n## Detalhes por rota\n\n`;
for (const r of perRoute) {
  const details = perRouteDetail.get(r.route) ?? [];
  if (details.length === 0) continue;
  s += `<details><summary><code>${r.route}</code> — ${r.nodes} nó(s)</summary>\n\n`;
  s += `| # | DOM (últimos 3 níveis) | Utility responsável | Ratio | Esperado | fg → bg |\n`;
  s += `|--:|---|---|--:|--:|---|\n`;
  details.forEach((d, i) => {
    const util = d.utility.length ? d.utility.map((u) => `\`${u}\``).join(' ') : '—';
    const ratio = d.contrastRatio ? d.contrastRatio.toFixed(2) : '—';
    const exp = d.expectedRatio ? d.expectedRatio.toFixed(2) : '—';
    const cols = d.fgColor && d.bgColor ? `\`${d.fgColor}\` → \`${d.bgColor}\`` : '—';
    s += `| ${i + 1} | \`${d.domSelector.slice(0, 120)}\` | ${util} | ${ratio} | ${exp} | ${cols} |\n`;
  });
  s += `\n</details>\n\n`;
}

fs.writeFileSync(path.join(REPORT_DIR, 'summary.md'), s);

// ---------- heatmap.md standalone ----------
let h = `# axe-core · color-contrast · heatmap\n\n`;
h += `Gerado em ${new Date().toISOString()}\n\n`;
h += `Classes causais (color/opacity) — as demais utilities aparecem apenas por co-ocorrência com o elemento falho.\n\n`;
h += `## Top classes causais\n\n`;
if (topCausal.length === 0) {
  h += `_Nenhuma._\n`;
} else {
  h += `| Classe | Categoria | Ocorrências | # Rotas | Rotas |\n|---|---|---:|---:|---|\n`;
  for (const b of topCausal) {
    h += `| <a id="hm-${anchor(b.key)}"></a>\`${b.key}\` | ${b.category} | ${b.count} | ${b.routes.size} | ${Array.from(b.routes).join(', ')} |\n`;
  }
}

h += `\n## Amostras HTML por classe (top 15)\n\n`;
for (const b of topCausal.slice(0, 15)) {
  h += `### \`${b.key}\` (${b.count}× · ${b.category})\n\n\`\`\`html\n${b.sample}\n\`\`\`\n\n`;
}

h += `\n## Detalhes por rota\n\n`;
for (const r of perRoute) {
  const details = perRouteDetail.get(r.route) ?? [];
  if (details.length === 0) continue;
  h += `### \`${r.route}\` — ${details.length} nó(s)\n\n`;
  h += `| # | DOM | Utility | Ratio | Esperado | fg → bg | HTML |\n`;
  h += `|--:|---|---|--:|--:|---|---|\n`;
  details.forEach((d, i) => {
    const util = d.utility.length ? d.utility.map((u) => `\`${u}\``).join(' ') : '—';
    const ratio = d.contrastRatio ? d.contrastRatio.toFixed(2) : '—';
    const exp = d.expectedRatio ? d.expectedRatio.toFixed(2) : '—';
    const cols = d.fgColor && d.bgColor ? `\`${d.fgColor}\` → \`${d.bgColor}\`` : '—';
    const htmlEsc = d.htmlSample.replace(/\|/g, '\\|').replace(/\n/g, ' ');
    h += `| ${i + 1} | \`${d.domSelector.slice(0, 100)}\` | ${util} | ${ratio} | ${exp} | ${cols} | \`${htmlEsc.slice(0, 100)}\` |\n`;
  });
  h += `\n`;
}

fs.writeFileSync(path.join(REPORT_DIR, 'heatmap.md'), h);

console.log(
  `[axe-contrast-heatmap] ${perRoute.length} rotas, ${totalNodes} nós — ` +
    `enforced falhando: ${enforcedFailing.length}, tracked dirty: ${trackedDirty.length}, ` +
    `tracked cleaned: ${trackedCleaned.length}`,
);
