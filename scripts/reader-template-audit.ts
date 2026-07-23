/**
 * reader-template-audit — mede aderência de cada módulo ao
 * Reader Template Master (ReaderShell → EditorialHero → ReaderContent
 * → ReferencePopover → NexusPanel → ReaderContinuation).
 *
 * Uso:
 *   bun scripts/reader-template-audit.ts            # tabela humana
 *   bun scripts/reader-template-audit.ts --json     # emite JSON
 *   bun scripts/reader-template-audit.ts --report   # grava reports/reader-template.json
 *
 * Retorna código != 0 quando qualquer módulo `blocking: true` estiver
 * abaixo do `targetScore`.
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { READER_MODULES, FORBIDDEN_IMPORTS, type ReaderModule } from '../src/config/reader-modules';

interface SignalResult {
  key: 'readerShell' | 'editorialHero' | 'nexusPanel' | 'continuation' | 'noForbidden';
  label: string;
  weight: number;
  passed: boolean;
  detail?: string;
}

interface ModuleReport {
  id: string;
  label: string;
  entry: string;
  score: number;
  targetScore: number;
  blocking: boolean;
  passed: boolean;
  signals: SignalResult[];
  forbidden: string[];
}

const ROOT = resolve(__dirname, '..');

function loadEntry(entry: string): string | null {
  const abs = resolve(ROOT, entry);
  if (!existsSync(abs)) return null;
  return readFileSync(abs, 'utf8');
}

const RE = {
  readerShell: /<ReaderShell[\s>]/,
  readerShellImport: /from\s+['"]@\/components\/reader['"]/,
  editorialHero: /<EditorialHero[\s>]/,
  nexusPanel: /<NexusPanel[\s>]/,
  nexusSkipped: /nexus=\{null\}|\/\*\s*reader-template:\s*no-nexus\s*\*\//,
  continuation: /<ReaderContinuation[\s>]|continuation=\{[^}]+\}/,
  continuationSkipped: /continuation=\{null\}|\/\*\s*reader-template:\s*no-continuation\s*\*\//,
} as const;

function scoreModule(mod: ReaderModule): ModuleReport {
  const source = loadEntry(mod.entry);
  const signals: SignalResult[] = [];

  if (!source) {
    return {
      id: mod.id,
      label: mod.label,
      entry: mod.entry,
      score: 0,
      targetScore: mod.targetScore,
      blocking: mod.blocking,
      passed: false,
      signals: [{ key: 'readerShell', label: 'Entry inexistente', weight: 0, passed: false }],
      forbidden: [],
    };
  }

  const hasShell = RE.readerShell.test(source) && RE.readerShellImport.test(source);
  signals.push({
    key: 'readerShell',
    label: 'ReaderShell importado e renderizado',
    weight: 30,
    passed: hasShell,
  });

  signals.push({
    key: 'editorialHero',
    label: 'EditorialHero no slot hero',
    weight: 20,
    passed: RE.editorialHero.test(source),
  });

  const optional = new Set(mod.optionalSlots ?? []);
  const hasNexus = RE.nexusPanel.test(source);
  const nexusSkipped = optional.has('nexus') || RE.nexusSkipped.test(source);
  signals.push({
    key: 'nexusPanel',
    label: 'NexusPanel presente (ou skip documentado)',
    weight: 20,
    passed: hasNexus || nexusSkipped,
    detail: nexusSkipped && !hasNexus ? 'skip declarado' : undefined,
  });

  const hasContinuation = RE.continuation.test(source);
  const contSkipped = optional.has('continuation') || RE.continuationSkipped.test(source);
  signals.push({
    key: 'continuation',
    label: 'ReaderContinuation no slot continuation',
    weight: 15,
    passed: hasContinuation || contSkipped,
    detail: contSkipped && !hasContinuation ? 'skip declarado' : undefined,
  });

  const forbidden: string[] = [];
  for (const rule of FORBIDDEN_IMPORTS) {
    if (rule.pattern.test(source)) forbidden.push(rule.label);
  }
  signals.push({
    key: 'noForbidden',
    label: 'Zero imports/símbolos proibidos',
    weight: 15,
    passed: forbidden.length === 0,
    detail: forbidden.length ? forbidden.join(', ') : undefined,
  });

  const score = signals.reduce((sum, s) => sum + (s.passed ? s.weight : 0), 0);
  const passed = score >= mod.targetScore;

  return {
    id: mod.id,
    label: mod.label,
    entry: mod.entry,
    score,
    targetScore: mod.targetScore,
    blocking: mod.blocking,
    passed,
    signals,
    forbidden,
  };
}

function renderTable(reports: ModuleReport[]): string {
  const rows = reports.map((r) => {
    const badge = r.passed ? '✅' : r.blocking ? '❌' : '⚠';
    const bar = renderBar(r.score);
    return `${badge}  ${r.label.padEnd(22)} ${bar} ${String(r.score).padStart(3)}/100  alvo ${String(r.targetScore).padStart(3)}  ${
      r.forbidden.length ? '· proibidos: ' + r.forbidden.join(', ') : ''
    }`;
  });
  return rows.join('\n');
}

function renderBar(score: number): string {
  const total = 20;
  const filled = Math.round((score / 100) * total);
  return '[' + '█'.repeat(filled) + '·'.repeat(total - filled) + ']';
}

function main() {
  const args = new Set(process.argv.slice(2));
  const asJson = args.has('--json');
  const writeReport = args.has('--report');

  const reports = READER_MODULES.map(scoreModule);
  const blockingFailed = reports.filter((r) => r.blocking && !r.passed);

  if (asJson) {
    process.stdout.write(JSON.stringify({ reports, blockingFailed: blockingFailed.map((r) => r.id) }, null, 2) + '\n');
  } else {
    console.log('━━━ Reader Template Master — Auditoria de Aderência ━━━');
    console.log(renderTable(reports));
    console.log('');
    if (blockingFailed.length) {
      console.log(`❌ ${blockingFailed.length} módulo(s) bloqueante(s) abaixo do alvo:`);
      for (const r of blockingFailed) {
        console.log(`   - ${r.label} (${r.score}/${r.targetScore})`);
        for (const s of r.signals.filter((x) => !x.passed)) {
          console.log(`       · ${s.label}${s.detail ? ` — ${s.detail}` : ''}`);
        }
      }
    } else {
      console.log('✅ Todos os módulos bloqueantes atingem o alvo.');
    }
  }

  if (writeReport) {
    const outPath = resolve(ROOT, 'reports/reader-template.json');
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), reports }, null, 2));
    console.log(`\n→ Relatório: ${outPath}`);
  }

  process.exit(blockingFailed.length ? 1 : 0);
}

main();
