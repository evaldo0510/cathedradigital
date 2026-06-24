#!/usr/bin/env node
/**
 * Aggregate WCAG contrast results from the Playwright JSON report into:
 *   - playwright-report/contrast-summary.json
 *   - playwright-report/contrast-summary.md
 *
 * It scans every attachment named `contrast-*.json` produced by the contrast
 * specs, plus the per-element PNG/HTML attachments that accompany failures,
 * and produces a Markdown table with one row per failing (route, theme, target)
 * including the WCAG ratio, the required threshold, the failing text snippet,
 * the offending Tailwind class list, and links to the screenshot/HTML artifacts.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';

type Attachment = { name: string; path?: string; contentType?: string };
type Measurement = {
  found: boolean;
  ratio?: number;
  isLarge?: boolean;
  text?: string;
  classes?: string;
  color?: string;
  background?: string;
};
type ContrastPayload = {
  route: string;
  theme: string;
  url: string;
  measurements: Array<{ target: string; selector: string; rows: Measurement[] }>;
  failures: Array<{
    route: string;
    theme: string;
    target: string;
    selector: string;
    ratio: number;
    required: number;
    text: string;
    classes?: string;
    color?: string;
    background?: string;
  }>;
};

type TestSpec = {
  title: string;
  results?: Array<{ status: string; attachments?: Attachment[] }>;
};
type Suite = { specs?: TestSpec[]; suites?: Suite[] };
type Report = { suites?: Suite[] };

function* walkSpecs(suites: Suite[] = []): Generator<TestSpec> {
  for (const s of suites) {
    for (const sp of s.specs ?? []) yield sp;
    yield* walkSpecs(s.suites ?? []);
  }
}

function loadReport(path: string): Report {
  if (!existsSync(path)) {
    console.error(`Playwright JSON report not found at ${path}`);
    return {};
  }
  return JSON.parse(readFileSync(path, 'utf8'));
}

function findAttachmentsRecursively(dir: string, pattern: RegExp): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...findAttachmentsRecursively(full, pattern));
    else if (pattern.test(entry)) out.push(full);
  }
  return out;
}

function collectPayloads(reportPath: string, fallbackDir: string): ContrastPayload[] {
  const report = loadReport(reportPath);
  const payloads: ContrastPayload[] = [];
  const seenPaths = new Set<string>();

  for (const spec of walkSpecs(report.suites)) {
    for (const result of spec.results ?? []) {
      for (const att of result.attachments ?? []) {
        if (!att.name?.startsWith('contrast-') || !att.name.endsWith('.json')) continue;
        if (!att.path || !existsSync(att.path)) continue;
        try {
          payloads.push(JSON.parse(readFileSync(att.path, 'utf8')));
          seenPaths.add(att.path);
        } catch {
          /* ignore unparseable */
        }
      }
    }
  }

  // Fallback: scan test-results directly in case the JSON report is missing.
  for (const file of findAttachmentsRecursively(fallbackDir, /^contrast-.*\.json$/)) {
    if (seenPaths.has(file)) continue;
    try {
      payloads.push(JSON.parse(readFileSync(file, 'utf8')));
    } catch {
      /* skip */
    }
  }
  return payloads;
}

function relForReport(p: string, reportDir: string) {
  try { return relative(reportDir, p); } catch { return p; }
}

function findRelatedAttachments(
  report: Report,
  route: string,
  theme: string,
  target: string,
  reportDir: string,
): { html?: string; png?: string; pagePng?: string } {
  const safeRoute = route.replace(/[^a-z0-9]+/gi, '_') || 'root';
  const safeTarget = target.replace(/[^a-z0-9]+/gi, '-');
  const pngName = `element-${safeRoute}-${safeTarget}-${theme}.png`;
  const htmlName = `element-${safeRoute}-${safeTarget}-${theme}.html`;
  const pageName = `page-${safeRoute}-${theme}.png`;

  const result: { html?: string; png?: string; pagePng?: string } = {};
  for (const spec of walkSpecs(report.suites)) {
    for (const r of spec.results ?? []) {
      for (const a of r.attachments ?? []) {
        if (!a.path) continue;
        if (a.name === pngName) result.png = relForReport(a.path, reportDir);
        else if (a.name === htmlName) result.html = relForReport(a.path, reportDir);
        else if (a.name === pageName) result.pagePng = relForReport(a.path, reportDir);
      }
    }
  }
  return result;
}

function renderMarkdown(payloads: ContrastPayload[], report: Report, reportDir: string): string {
  const allFailures = payloads.flatMap((p) => p.failures ?? []);
  const totalChecks = payloads.reduce(
    (acc, p) => acc + p.measurements.reduce((a, m) => a + (m.rows?.length || 0), 0),
    0,
  );
  const routes = new Set(payloads.map((p) => p.route));
  const themes = new Set(payloads.map((p) => p.theme));

  const lines: string[] = [];
  lines.push('# WCAG Contrast Report');
  lines.push('');
  lines.push(`- Routes covered: **${routes.size}** (${[...routes].join(', ') || '—'})`);
  lines.push(`- Themes: **${[...themes].join(' / ') || '—'}**`);
  lines.push(`- Targets measured: **${totalChecks}**`);
  lines.push(`- Failures (below WCAG AA): **${allFailures.length}**`);
  lines.push('');

  if (allFailures.length === 0) {
    lines.push('All measured targets meet WCAG AA in light and dark mode.');
    return lines.join('\n');
  }

  // Group by route + theme.
  const grouped = new Map<string, typeof allFailures>();
  for (const f of allFailures) {
    const key = `${f.route} · ${f.theme}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(f);
  }

  for (const [key, rows] of [...grouped.entries()].sort()) {
    lines.push(`## ${key}`);
    lines.push('');
    lines.push('| Target | Ratio | Required | Text | Classes | Color → BG | Element | Page |');
    lines.push('| --- | --- | --- | --- | --- | --- | --- | --- |');
    for (const r of rows) {
      const a = findRelatedAttachments(report, r.route, r.theme, r.target, reportDir);
      const text = (r.text || '').replace(/\|/g, '\\|').slice(0, 60) || '—';
      const cls = (r.classes || '').replace(/\|/g, '\\|').slice(0, 80) || '—';
      const colorCell = `${r.color || '—'} → ${r.background || '—'}`.replace(/\|/g, '\\|');
      const elLink = a.png ? `[png](${a.png})${a.html ? ` · [html](${a.html})` : ''}` : a.html ? `[html](${a.html})` : '—';
      const pageLink = a.pagePng ? `[png](${a.pagePng})` : '—';
      lines.push(
        `| ${r.target} | **${r.ratio}:1** | ${r.required}:1 | ${text} | \`${cls}\` | ${colorCell} | ${elLink} | ${pageLink} |`,
      );
    }
    lines.push('');
  }
  return lines.join('\n');
}

// ---------- baseline diff ----------
type FailureKey = string;
function keyOf(f: ContrastPayload['failures'][number]): FailureKey {
  return `${f.route}|${f.theme}|${f.target}|${(f.text || '').trim().slice(0, 40)}`;
}
type Delta = {
  regressions: Array<{ key: FailureKey; current: number; previous: number | null; required: number; route: string; theme: string; target: string; text: string }>;
  fixed: Array<{ key: FailureKey; previous: number; required: number; route: string; theme: string; target: string; text: string }>;
  worsened: Array<{ key: FailureKey; current: number; previous: number; delta: number; route: string; theme: string; target: string; text: string }>;
  improved: Array<{ key: FailureKey; current: number; previous: number; delta: number; route: string; theme: string; target: string; text: string }>;
};

function diffAgainstBaseline(
  current: ContrastPayload[],
  baseline: ContrastPayload[] | null,
): Delta {
  const delta: Delta = { regressions: [], fixed: [], worsened: [], improved: [] };
  if (!baseline) {
    // No baseline → every current failure counts as a regression (first run).
    for (const p of current) {
      for (const f of p.failures || []) {
        delta.regressions.push({
          key: keyOf(f), current: f.ratio, previous: null, required: f.required,
          route: f.route, theme: f.theme, target: f.target, text: f.text,
        });
      }
    }
    return delta;
  }
  const baseMap = new Map<FailureKey, ContrastPayload['failures'][number]>();
  for (const p of baseline) for (const f of p.failures || []) baseMap.set(keyOf(f), f);
  const curMap = new Map<FailureKey, ContrastPayload['failures'][number]>();
  for (const p of current) for (const f of p.failures || []) curMap.set(keyOf(f), f);

  for (const [k, f] of curMap) {
    const prev = baseMap.get(k);
    if (!prev) {
      delta.regressions.push({
        key: k, current: f.ratio, previous: null, required: f.required,
        route: f.route, theme: f.theme, target: f.target, text: f.text,
      });
    } else if (f.ratio < prev.ratio - 0.01) {
      delta.worsened.push({
        key: k, current: f.ratio, previous: prev.ratio, delta: Math.round((f.ratio - prev.ratio) * 100) / 100,
        route: f.route, theme: f.theme, target: f.target, text: f.text,
      });
    } else if (f.ratio > prev.ratio + 0.01) {
      delta.improved.push({
        key: k, current: f.ratio, previous: prev.ratio, delta: Math.round((f.ratio - prev.ratio) * 100) / 100,
        route: f.route, theme: f.theme, target: f.target, text: f.text,
      });
    }
  }
  for (const [k, prev] of baseMap) {
    if (!curMap.has(k)) {
      delta.fixed.push({
        key: k, previous: prev.ratio, required: prev.required,
        route: prev.route, theme: prev.theme, target: prev.target, text: prev.text,
      });
    }
  }
  return delta;
}

function renderDeltaSection(delta: Delta, hasBaseline: boolean): string {
  const lines: string[] = [];
  lines.push('## Baseline comparison');
  lines.push('');
  if (!hasBaseline) {
    lines.push('_No baseline found — every current failure is treated as a regression for this run._');
    lines.push('');
    return lines.join('\n');
  }
  lines.push(
    `- New regressions: **${delta.regressions.length}** · Worsened: **${delta.worsened.length}** · Fixed: **${delta.fixed.length}** · Improved: **${delta.improved.length}**`,
  );
  lines.push('');
  if (delta.regressions.length) {
    lines.push('### ❌ New regressions');
    lines.push('| Route | Theme | Target | Ratio | Required | Text |');
    lines.push('| --- | --- | --- | --- | --- | --- |');
    for (const r of delta.regressions) {
      lines.push(`| ${r.route} | ${r.theme} | ${r.target} | **${r.current}:1** | ${r.required}:1 | ${(r.text || '').replace(/\|/g, '\\|').slice(0, 60)} |`);
    }
    lines.push('');
  }
  if (delta.worsened.length) {
    lines.push('### ⚠️ Worsened (still above threshold or already failing)');
    lines.push('| Route | Theme | Target | Was | Now | Δ |');
    lines.push('| --- | --- | --- | --- | --- | --- |');
    for (const r of delta.worsened) lines.push(`| ${r.route} | ${r.theme} | ${r.target} | ${r.previous}:1 | ${r.current}:1 | ${r.delta} |`);
    lines.push('');
  }
  if (delta.fixed.length) {
    lines.push('### ✅ Fixed since baseline');
    lines.push('| Route | Theme | Target | Was |');
    lines.push('| --- | --- | --- | --- |');
    for (const r of delta.fixed) lines.push(`| ${r.route} | ${r.theme} | ${r.target} | ${r.previous}:1 |`);
    lines.push('');
  }
  return lines.join('\n');
}

function loadBaseline(path: string): ContrastPayload[] | null {
  if (!path || !existsSync(path)) return null;
  try {
    const raw = JSON.parse(readFileSync(path, 'utf8'));
    return raw.payloads ?? null;
  } catch {
    return null;
  }
}

// ---------- main ----------
function main() {
  const reportDir = process.env.PLAYWRIGHT_REPORT_DIR || 'playwright-report';
  const jsonPath = process.env.PLAYWRIGHT_JSON_REPORT || join(reportDir, 'results.json');
  const fallbackDir = process.env.PLAYWRIGHT_TEST_RESULTS_DIR || 'test-results';
  const baselinePath = process.env.CONTRAST_BASELINE || '';
  const failMode = (process.env.CONTRAST_REPORT_FAIL_MODE ?? 'regressions').toLowerCase(); // 'regressions' | 'any' | 'never'

  const payloads = collectPayloads(jsonPath, fallbackDir);
  const report = loadReport(jsonPath);
  const baseline = loadBaseline(baselinePath);
  const delta = diffAgainstBaseline(payloads, baseline);

  if (!existsSync(reportDir)) mkdirSync(reportDir, { recursive: true });

  const summaryJson = {
    generatedAt: new Date().toISOString(),
    baselineUsed: Boolean(baseline),
    baselinePath: baseline ? baselinePath : null,
    payloads,
    delta,
    totals: {
      routes: new Set(payloads.map((p) => p.route)).size,
      themes: [...new Set(payloads.map((p) => p.theme))],
      measurements: payloads.reduce(
        (acc, p) => acc + p.measurements.reduce((a, m) => a + (m.rows?.length || 0), 0),
        0,
      ),
      failures: payloads.reduce((acc, p) => acc + (p.failures?.length || 0), 0),
      regressions: delta.regressions.length,
      worsened: delta.worsened.length,
      fixed: delta.fixed.length,
    },
  };
  writeFileSync(join(reportDir, 'contrast-summary.json'), JSON.stringify(summaryJson, null, 2));

  const md = renderDeltaSection(delta, Boolean(baseline)) + '\n' + renderMarkdown(payloads, report, reportDir);
  writeFileSync(join(reportDir, 'contrast-summary.md'), md);

  console.log(
    `[contrast-report] failures=${summaryJson.totals.failures} regressions=${delta.regressions.length} worsened=${delta.worsened.length} fixed=${delta.fixed.length} baseline=${Boolean(baseline)}`,
  );

  const shouldFail =
    failMode === 'any' ? summaryJson.totals.failures > 0
    : failMode === 'never' ? false
    : delta.regressions.length > 0 || delta.worsened.length > 0; // 'regressions'
  if (shouldFail) process.exitCode = 1;
}

main();
void dirname;

