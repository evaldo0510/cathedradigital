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
import { spawnSync } from 'child_process';
import { TOKEN_REGISTRY, ruleFor } from './axe-contrast-token-registry';

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
  // typography FIRST — evita que `text-[9px]`, `text-premium-xs`, `text-center`
  // sejam confundidos com utilitários de cor.
  if (
    cls === 'uppercase' ||
    cls === 'lowercase' ||
    cls === 'capitalize' ||
    cls === 'italic' ||
    cls === 'not-italic' ||
    /^font-/.test(cls) ||
    /^tracking-/.test(cls) ||
    /^leading-/.test(cls) ||
    /^text-\[/.test(cls) ||                                // arbitrary font-size, ex: text-[9px]
    /^text-(xs|sm|base|lg|xl|\dxl)$/.test(cls) ||
    /^text-premium-/.test(cls) ||                          // custom typography scale
    /^text-(left|center|right|justify|start|end)$/.test(cls)
  ) {
    return 'typography';
  }
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

// ---------- lookup arquivo:linha (best-effort via ripgrep) ----------
// Para cada classe causal, tenta localizar ocorrências em src/**. Retorna
// no máximo N matches por classe. Ripgrep é usado para não travar em repos
// grandes; se não estiver disponível, cai para retorno vazio.
type SrcMatch = { file: string; line: number; text: string };

function rgFindClass(cls: string, maxMatches = 20): SrcMatch[] {
  // Escape para regex: barra normal, colchete, ponto.
  const escaped = cls
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\//g, '\\/');
  // Match dentro de className/class atributos ou strings TS.
  const pattern = `(?:className|class)=["\`\\{][^"\`]*\\b${escaped}\\b|["\`\\s]${escaped}["\`\\s]`;
  const r = spawnSync(
    'rg',
    ['--json', '--max-count', String(maxMatches), '-t', 'typescript', pattern, 'src'],
    { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 },
  );
  if (r.status !== 0 && r.status !== 1) return [];
  const out: SrcMatch[] = [];
  for (const line of r.stdout.split('\n')) {
    if (!line.trim()) continue;
    try {
      const evt = JSON.parse(line);
      if (evt.type === 'match') {
        out.push({
          file: evt.data.path.text,
          line: evt.data.line_number,
          text: (evt.data.lines.text ?? '').trim().slice(0, 200),
        });
      }
    } catch {
      /* skip */
    }
  }
  return out;
}

const srcIndex = new Map<string, SrcMatch[]>();
for (const cls of new Set([...causalBuckets.keys(), ...Object.keys(TOKEN_REGISTRY)])) {
  srcIndex.set(cls, rgFindClass(cls));
}

// ---------- write summary.json ----------
const summaryPayload = {
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
  topCausalClasses: topCausal.map((b) => {
    const rule = ruleFor(b.key);
    return {
      class: b.key,
      category: b.category,
      count: b.count,
      routes: Array.from(b.routes),
      sample: b.sample,
      rule: rule
        ? {
            replacement: rule.replacement,
            reason: rule.reason,
            confidence: rule.confidence,
          }
        : null,
      srcMatches: srcIndex.get(b.key) ?? [],
    };
  }),
  perRouteDetail: Object.fromEntries(perRouteDetail),
};

fs.writeFileSync(
  path.join(REPORT_DIR, 'summary.json'),
  JSON.stringify(summaryPayload, null, 2),
);

// Também expõe para a página admin (buscada via fetch).
const PUBLIC_COPY = path.join(process.cwd(), 'public', 'reports', 'axe-contrast');
fs.mkdirSync(PUBLIC_COPY, { recursive: true });
fs.writeFileSync(
  path.join(PUBLIC_COPY, 'summary.json'),
  JSON.stringify(summaryPayload, null, 2),
);

// ---------- CSV exports (para download no admin) ----------
const EXPORT_DIR = path.join(PUBLIC_COPY, 'exports');
fs.mkdirSync(EXPORT_DIR, { recursive: true });

function csvEscape(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const cols = Object.keys(rows[0]);
  const head = cols.join(',');
  const body = rows.map((r) => cols.map((c) => csvEscape(r[c])).join(',')).join('\n');
  return `${head}\n${body}\n`;
}

// summary.csv — 1 linha por rota + top classes
const summaryCsvRows = perRoute.map((r) => {
  const details = perRouteDetail.get(r.route) ?? [];
  const utils = new Map<string, number>();
  for (const d of details) {
    if (d.utilityCategory === 'color' || d.utilityCategory === 'opacity') {
      for (const u of d.utility) utils.set(u, (utils.get(u) ?? 0) + 1);
    }
  }
  const top = Array.from(utils.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3);
  return {
    route: r.route,
    tier: r.tier,
    violations: r.violations,
    nodes: r.nodes,
    top_class_1: top[0]?.[0] ?? '',
    top_class_1_count: top[0]?.[1] ?? '',
    top_class_2: top[1]?.[0] ?? '',
    top_class_2_count: top[1]?.[1] ?? '',
    top_class_3: top[2]?.[0] ?? '',
    top_class_3_count: top[2]?.[1] ?? '',
    report_file: r.reportFile,
  };
});
fs.writeFileSync(path.join(EXPORT_DIR, 'summary.csv'), toCsv(summaryCsvRows));

// heatmap.csv — 1 linha por (rota, classe causal)
const heatmapCsvRows: Record<string, unknown>[] = [];
for (const [route, details] of perRouteDetail) {
  const utils = new Map<string, { count: number; cat: Category }>();
  for (const d of details) {
    if (d.utilityCategory !== 'color' && d.utilityCategory !== 'opacity') continue;
    for (const u of d.utility) {
      const cur = utils.get(u) ?? { count: 0, cat: d.utilityCategory };
      cur.count += 1;
      utils.set(u, cur);
    }
  }
  for (const [cls, info] of utils) {
    const rule = ruleFor(cls);
    heatmapCsvRows.push({
      route,
      utility_class: cls,
      category: info.cat,
      occurrences: info.count,
      suggested_replacement:
        rule?.replacement === null ? '(remove)' : rule?.replacement ?? '',
      confidence: rule?.confidence ?? '',
      files_matched: (srcIndex.get(cls) ?? []).length,
    });
  }
}
fs.writeFileSync(path.join(EXPORT_DIR, 'heatmap.csv'), toCsv(heatmapCsvRows));

// ---------- Snapshot histórico (para diff temporal) ----------
const HISTORY_DIR = path.join(PUBLIC_COPY, 'history');
fs.mkdirSync(HISTORY_DIR, { recursive: true });
const ts = new Date().toISOString().replace(/[:.]/g, '-');
const snapshot = {
  generatedAt: summaryPayload.generatedAt,
  totals: summaryPayload.totals,
  perRoute,
  topCausalClasses: summaryPayload.topCausalClasses.map((c) => ({
    class: c.class,
    category: c.category,
    count: c.count,
    routes: c.routes,
  })),
  perRouteTopUtils: Object.fromEntries(
    Array.from(perRouteDetail.entries()).map(([route, details]) => {
      const utils = new Map<string, number>();
      for (const d of details) {
        if (d.utilityCategory === 'color' || d.utilityCategory === 'opacity') {
          for (const u of d.utility) utils.set(u, (utils.get(u) ?? 0) + 1);
        }
      }
      return [route, Object.fromEntries(utils)];
    }),
  ),
};
const snapshotFile = `${ts}.json`;
fs.writeFileSync(path.join(HISTORY_DIR, snapshotFile), JSON.stringify(snapshot));

// Atualiza index.json mantendo até 20 snapshots.
const indexFile = path.join(HISTORY_DIR, 'index.json');
type HistIdx = { file: string; generatedAt: string; nodes: number; routes: number };
let history: HistIdx[] = [];
if (fs.existsSync(indexFile)) {
  try {
    history = JSON.parse(fs.readFileSync(indexFile, 'utf8'));
  } catch { /* reset */ }
}
history.push({
  file: snapshotFile,
  generatedAt: snapshot.generatedAt,
  nodes: snapshot.totals.nodes,
  routes: snapshot.totals.routes,
});
history.sort((a, b) => a.generatedAt.localeCompare(b.generatedAt));
if (history.length > 20) {
  const drop = history.slice(0, history.length - 20);
  for (const d of drop) {
    try { fs.unlinkSync(path.join(HISTORY_DIR, d.file)); } catch { /* skip */ }
  }
  history = history.slice(-20);
}
fs.writeFileSync(indexFile, JSON.stringify(history, null, 2));





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
if (ARTIFACT_HINT) {
  s += `📎 [Artifacts do run](${ARTIFACT_HINT}) — baixe \`axe-color-contrast-report.zip\` para acessar \`heatmap.md\` e os JSONs por rota.\n\n`;
}


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
  s += `| Classe | Categoria | Ocorrências | Rotas | Sugestão (registry) | Confidence |\n|---|---|---:|---|---|---|\n`;
  for (const b of topCausal) {
    const rule = ruleFor(b.key);
    const suggestion = rule
      ? rule.replacement === null
        ? '**remover**'
        : rule.replacement === undefined
          ? `_${rule.reason}_`
          : `→ \`${rule.replacement}\``
      : '—';
    const conf = rule ? rule.confidence : '—';
    s += `| <a id="hm-${anchor(b.key)}"></a>\`${b.key}\` | ${b.category} | ${b.count} | ${Array.from(b.routes).map((r) => `\`${r}\``).join(', ')} | ${suggestion} | ${conf} |\n`;
  }
}

// Diff sugerido por arquivo (ripgrep matches × registry)
s += `\n## Diff sugerido (dry-run)\n\n`;
s += `Execute \`bun run axe:contrast:autofix -- --apply\` para aplicar as regras marcadas como \`safe\`. As \`review\` exigem inspeção manual.\n\n`;
const suggestedByFile = new Map<string, Array<{ cls: string; rule: import('./axe-contrast-token-registry').TokenRule; line: number; text: string }>>();
for (const b of topCausal) {
  const rule = ruleFor(b.key);
  if (!rule) continue;
  const matches = srcIndex.get(b.key) ?? [];
  for (const m of matches) {
    const arr = suggestedByFile.get(m.file) ?? [];
    arr.push({ cls: b.key, rule, line: m.line, text: m.text });
    suggestedByFile.set(m.file, arr);
  }
}
if (suggestedByFile.size === 0) {
  s += `_Nenhuma ocorrência encontrada em \`src/\` para as classes causais._\n`;
} else {
  for (const [file, items] of Array.from(suggestedByFile.entries()).sort()) {
    s += `<details><summary><code>${file}</code> — ${items.length} ocorrência(s)</summary>\n\n`;
    for (const it of items.sort((a, b) => a.line - b.line)) {
      const target = it.rule.replacement === null ? '(remover classe)' : it.rule.replacement === undefined ? '(revisar)' : `→ \`${it.rule.replacement}\``;
      s += `- **L${it.line}** \`${it.cls}\` ${target} · _${it.rule.reason}_ · ${it.rule.confidence}\n`;
      s += `  \`${it.text.slice(0, 160)}\`\n`;
    }
    s += `\n</details>\n\n`;
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
