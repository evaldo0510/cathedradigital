/**
 * Gera PDF de resumo da suíte E2E a partir do JSON reporter do Playwright.
 * Entrada:  playwright-report/results.json
 * Saída:    playwright-report/e2e-summary.pdf
 *
 * Uso: bun run scripts/generate-e2e-report.ts
 */
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type PWTestResult = {
  status: string;
  attachments?: Array<{ name: string; path?: string; contentType?: string }>;
  errors?: Array<{ message?: string }>;
  stdout?: Array<{ text?: string }>;
};
type PWTest = { title: string; results: PWTestResult[] };
type PWSpec = { title: string; file: string; tests: PWTest[] };
type PWSuite = { title?: string; file?: string; specs?: PWSpec[]; suites?: PWSuite[] };
type PWReport = { suites: PWSuite[]; stats?: { expected: number; unexpected: number; skipped: number; flaky: number; duration: number } };

const REPORT = resolve('playwright-report/results.json');
const OUT = resolve('playwright-report/e2e-summary.pdf');

if (!existsSync(REPORT)) {
  console.error(`[e2e-report] arquivo não encontrado: ${REPORT}`);
  console.error('  Rode a suíte antes: bunx playwright test');
  process.exit(1);
}

const data = JSON.parse(readFileSync(REPORT, 'utf-8')) as PWReport;

function flatten(suites: PWSuite[] = []): PWSpec[] {
  const out: PWSpec[] = [];
  for (const s of suites) {
    if (s.specs) out.push(...s.specs);
    if (s.suites) out.push(...flatten(s.suites));
  }
  return out;
}

const specs = flatten(data.suites);
type Row = {
  spec: string; file: string; status: 'passed' | 'failed' | 'skipped' | 'flaky';
  finalUrl: string; screenshot: string; error: string;
};
const rows: Row[] = [];
const finalUrlRe = /final url[:\s]+(\S+)/i;

for (const spec of specs) {
  for (const test of spec.tests || []) {
    const last = test.results?.[test.results.length - 1];
    if (!last) continue;
    const status = (last.status === 'passed' || last.status === 'failed' || last.status === 'skipped') ? last.status : 'flaky';
    const shot = (last.attachments || []).find(a => a.contentType?.startsWith('image/') || a.name === 'screenshot');
    const stdout = (last.stdout || []).map(s => s.text || '').join('\n');
    const urlMatch = stdout.match(finalUrlRe);
    rows.push({
      spec: `${spec.title} › ${test.title}`,
      file: spec.file,
      status: status as Row['status'],
      finalUrl: urlMatch?.[1] || '—',
      screenshot: shot?.path || '—',
      error: (last.errors?.[0]?.message || '').replace(/\u001b\[[0-9;]*m/g, '').slice(0, 240),
    });
  }
}

const stats = data.stats || { expected: 0, unexpected: 0, skipped: 0, flaky: 0, duration: 0 };
const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

doc.setFontSize(16); doc.text('Cathedra — Relatório E2E', 40, 40);
doc.setFontSize(10); doc.setTextColor(90);
doc.text(`Gerado: ${new Date().toISOString()}`, 40, 58);
doc.text(
  `Passou: ${stats.expected}   Falhou: ${stats.unexpected}   Flaky: ${stats.flaky}   Skipped: ${stats.skipped}   Duração: ${(stats.duration / 1000).toFixed(1)}s`,
  40, 74,
);

autoTable(doc, {
  startY: 90,
  head: [['Status', 'Spec', 'Arquivo', 'URL final', 'Screenshot', 'Erro']],
  body: rows.map(r => [r.status, r.spec, r.file, r.finalUrl, r.screenshot, r.error || '—']),
  styles: { fontSize: 8, cellPadding: 4, overflow: 'linebreak' },
  columnStyles: {
    0: { cellWidth: 50 }, 1: { cellWidth: 200 }, 2: { cellWidth: 140 },
    3: { cellWidth: 140 }, 4: { cellWidth: 140 }, 5: { cellWidth: 'auto' },
  },
  didParseCell: (hook) => {
    if (hook.section === 'body' && hook.column.index === 0) {
      const s = String(hook.cell.raw);
      if (s === 'failed') hook.cell.styles.fillColor = [255, 220, 220];
      else if (s === 'passed') hook.cell.styles.fillColor = [220, 245, 220];
      else if (s === 'flaky') hook.cell.styles.fillColor = [255, 240, 200];
    }
  },
});

writeFileSync(OUT, Buffer.from(doc.output('arraybuffer')));
console.log(`[e2e-report] PDF gerado em ${OUT} (${rows.length} testes)`);
