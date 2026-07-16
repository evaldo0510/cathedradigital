/**
 * Agrega os relatórios por-rota gravados por
 * tests/e2e/axe-color-contrast-regression.spec.ts em:
 *
 * - reports/axe-contrast/summary.json  — dado bruto para automações (issues, dashboards)
 * - reports/axe-contrast/summary.md    — comentário sticky do PR (tabela por rota)
 * - reports/axe-contrast/heatmap.md    — top classes/seletores recorrentes cross-rota
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
  tier: 'enforced' | 'tracked';
  timestamp: string;
  totalNodes: number;
  violations: ViolationReport[];
};

const REPORT_DIR = path.join(process.cwd(), 'reports', 'axe-contrast');
const ARTIFACT_BASE_URL = process.env.ARTIFACT_BASE_URL ?? '';

if (!fs.existsSync(REPORT_DIR)) {
  console.error(`[axe-contrast-heatmap] no reports at ${REPORT_DIR}`);
  process.exit(0);
}

const files = fs.readdirSync(REPORT_DIR).filter((f) => f.endsWith('.json') && f !== 'summary.json');

const reports: RouteReport[] = files
  .map((f) => JSON.parse(fs.readFileSync(path.join(REPORT_DIR, f), 'utf8')))
  .sort((a, b) => a.route.localeCompare(b.route));

// ---- heatmap por classe CSS ----
type Bucket = { key: string; count: number; routes: Set<string>; sample: string };
const classBuckets = new Map<string, Bucket>();
const selectorBuckets = new Map<string, Bucket>();

function bump(map: Map<string, Bucket>, key: string, route: string, sample: string) {
  const b = map.get(key) ?? { key, count: 0, routes: new Set<string>(), sample };
  b.count += 1;
  b.routes.add(route);
  map.set(key, b);
}

for (const r of reports) {
  for (const v of r.violations) {
    for (const n of v.nodes) {
      const sel = n.target.join(' ');
      bump(selectorBuckets, sel, r.route, n.html?.slice(0, 200) ?? '');
      // extract classes from html attribute
      const classMatches = (n.html ?? '').match(/class="([^"]+)"/g) ?? [];
      const classes = new Set<string>();
      for (const m of classMatches) {
        const raw = m.slice(7, -1);
        for (const c of raw.split(/\s+/)) {
          if (c && c.length < 60) classes.add(c);
        }
      }
      for (const c of classes) {
        bump(classBuckets, c, r.route, n.html?.slice(0, 200) ?? '');
      }
    }
  }
}

const topClasses = Array.from(classBuckets.values())
  .filter((b) => b.count >= 2)
  .sort((a, b) => b.count - a.count || b.routes.size - a.routes.size)
  .slice(0, 30);

const topSelectors = Array.from(selectorBuckets.values())
  .sort((a, b) => b.count - a.count || b.routes.size - a.routes.size)
  .slice(0, 20);

// ---- summary por rota ----
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

// ---- write summary.json ----
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
      topClasses: topClasses.map((b) => ({
        class: b.key,
        count: b.count,
        routes: Array.from(b.routes),
        sample: b.sample,
      })),
      topSelectors: topSelectors.map((b) => ({
        selector: b.key,
        count: b.count,
        routes: Array.from(b.routes),
        sample: b.sample,
      })),
    },
    null,
    2,
  ),
);

// ---- write summary.md (PR sticky comment) ----
function linkReport(file: string) {
  return ARTIFACT_BASE_URL ? `[JSON](${ARTIFACT_BASE_URL}/${file})` : `\`${file}\``;
}

const rows = perRoute
  .sort((a, b) => b.nodes - a.nodes || a.route.localeCompare(b.route))
  .map(
    (r) =>
      `| \`${r.route}\` | ${r.tier} | ${r.violations} | ${r.nodes} | ${linkReport(r.reportFile)} |`,
  )
  .join('\n');

let summaryMd = `## axe-core · color-contrast · resumo por rota\n\n`;
summaryMd += `**Totais:** ${perRoute.length} rotas · ${totalNodes} nó(s) · `;
summaryMd += `${enforcedFailing.length} enforced falhando · ${trackedDirty.length} tracked com violações · `;
summaryMd += `${trackedCleaned.length} tracked prontas para promoção\n\n`;

if (enforcedFailing.length > 0) {
  summaryMd += `> ❌ **Regressão em rota enforced:** ${enforcedFailing.map((r) => `\`${r.route}\``).join(', ')}\n\n`;
}
if (trackedCleaned.length > 0) {
  summaryMd += `> ✅ **Promover para ENFORCED_ROUTES:** ${trackedCleaned.map((r) => `\`${r.route}\``).join(', ')}\n\n`;
}

summaryMd += `| Rota | Tier | Violations | Nós | Report |\n`;
summaryMd += `|---|---|---:|---:|---|\n`;
summaryMd += rows + '\n';

// heatmap section
summaryMd += `\n## Heatmap · classes CSS mais recorrentes\n\n`;
if (topClasses.length === 0) {
  summaryMd += `_Nenhuma classe se repetiu 2+ vezes._\n`;
} else {
  summaryMd += `| Classe | Ocorrências | Rotas afetadas |\n|---|---:|---|\n`;
  summaryMd += topClasses
    .map(
      (b) =>
        `| \`${b.key}\` | ${b.count} | ${Array.from(b.routes)
          .map((r) => `\`${r}\``)
          .join(', ')} |`,
    )
    .join('\n');
  summaryMd += '\n';
}

summaryMd += `\n## Top seletores axe\n\n`;
summaryMd += `| Seletor | Ocorrências | Rotas |\n|---|---:|---|\n`;
summaryMd += topSelectors
  .map(
    (b) =>
      `| \`${b.key.slice(0, 120)}\` | ${b.count} | ${Array.from(b.routes)
        .map((r) => `\`${r}\``)
        .join(', ')} |`,
  )
  .join('\n');
summaryMd += '\n';

fs.writeFileSync(path.join(REPORT_DIR, 'summary.md'), summaryMd);

// ---- write heatmap.md (standalone) ----
let heatmapMd = `# axe-core · color-contrast · heatmap\n\n`;
heatmapMd += `Gerado em ${new Date().toISOString()}\n\n`;
heatmapMd += `## Componentes/classes mais recorrentes\n\n`;
if (topClasses.length === 0) {
  heatmapMd += `_Nenhuma classe se repetiu 2+ vezes._\n`;
} else {
  heatmapMd += `| Classe | Ocorrências | # Rotas | Rotas |\n|---|---:|---:|---|\n`;
  heatmapMd += topClasses
    .map(
      (b) =>
        `| \`${b.key}\` | ${b.count} | ${b.routes.size} | ${Array.from(b.routes).join(', ')} |`,
    )
    .join('\n');
}
heatmapMd += `\n\n## Amostras HTML (top 10 classes)\n\n`;
for (const b of topClasses.slice(0, 10)) {
  heatmapMd += `### \`${b.key}\` (${b.count}×)\n\n\`\`\`html\n${b.sample}\n\`\`\`\n\n`;
}
fs.writeFileSync(path.join(REPORT_DIR, 'heatmap.md'), heatmapMd);

console.log(`[axe-contrast-heatmap] wrote summary for ${perRoute.length} routes, ${totalNodes} nodes`);
console.log(`  - enforced failing: ${enforcedFailing.length}`);
console.log(`  - tracked dirty:    ${trackedDirty.length}`);
console.log(`  - tracked cleaned:  ${trackedCleaned.length}`);
