import React from 'react';
import type { NormalizationReport, NormalizationChanges } from '@/lib/catechismTextNormalizer';

interface Props {
  paragraph: number;
  original: string;
  report: NormalizationReport;
}

const LABELS: Record<keyof NormalizationChanges, string> = {
  invisibleCharsRemoved: 'Invisíveis removidos',
  nbspReplaced: 'NBSP → espaço',
  multiSpacesCollapsed: 'Espaços múltiplos',
  crlfReplaced: 'CRLF → LF',
  excessBreaksCollapsed: 'Quebras excessivas',
  bulletsExtracted: 'Marcadores extraídos',
  numberedExtracted: 'Numerados extraídos',
  missingSpacesAfterPunct: 'Espaço após pontuação',
  spacesBeforePunctRemoved: 'Espaço antes de pontuação',
  footnotesSeparated: 'Notas de rodapé',
  quotesConverted: 'Aspas convertidas',
};

/** Diff linha-a-linha simples (LCS-lite baseado em índice). */
function lineDiff(a: string, b: string): Array<{ kind: 'same' | 'del' | 'add'; text: string }> {
  const aLines = a.split('\n');
  const bLines = b.split('\n');
  const out: Array<{ kind: 'same' | 'del' | 'add'; text: string }> = [];
  const max = Math.max(aLines.length, bLines.length);
  for (let i = 0; i < max; i++) {
    const al = aLines[i];
    const bl = bLines[i];
    if (al === bl) {
      if (al !== undefined) out.push({ kind: 'same', text: al });
    } else {
      if (al !== undefined) out.push({ kind: 'del', text: al });
      if (bl !== undefined) out.push({ kind: 'add', text: bl });
    }
  }
  return out;
}

/**
 * Habilitado quando:
 *  - `import.meta.env.DEV`, OU
 *  - a URL contém `?debug=normalizer` (permite ativar em produção sem recompilar).
 */
function isDebugEnabled(): boolean {
  if (import.meta.env.DEV) return true;
  if (typeof window === 'undefined') return false;
  try {
    const params = new URLSearchParams(window.location.search);
    const v = params.get('debug');
    return v === 'normalizer' || v === 'all' || v === '1';
  } catch {
    return false;
  }
}

function downloadBlob(filename: string, mime: string, content: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function buildJsonReport(paragraph: number, original: string, report: NormalizationReport) {
  return JSON.stringify(
    {
      paragraph,
      generatedAt: new Date().toISOString(),
      durationMs: Number(report.durationMs.toFixed(4)),
      changed: report.changed,
      totalChanges: Object.values(report.changes).reduce((s, v) => s + v, 0),
      originalLength: report.originalLength,
      normalizedLength: report.normalizedLength,
      changes: report.changes,
      original,
      normalized: report.text,
    },
    null,
    2
  );
}

function buildCsvReport(paragraph: number, report: NormalizationReport): string {
  const header = [
    'paragraph',
    'generated_at',
    'duration_ms',
    'changed',
    'original_length',
    'normalized_length',
    ...Object.keys(report.changes),
  ];
  const row = [
    paragraph,
    new Date().toISOString(),
    report.durationMs.toFixed(4),
    report.changed ? 'true' : 'false',
    report.originalLength,
    report.normalizedLength,
    ...Object.values(report.changes),
  ];
  return `${header.join(',')}\n${row.join(',')}`;
}

export const CatechismNormalizationDiff: React.FC<Props> = ({ paragraph, original, report }) => {
  const enabled = React.useMemo(() => isDebugEnabled(), []);
  const [open, setOpen] = React.useState(false);

  const diff = React.useMemo(
    () => (enabled && report.changed ? lineDiff(original, report.text) : []),
    [enabled, original, report.text, report.changed]
  );

  if (!enabled || !report.changed) return null;

  const changeEntries = (Object.entries(report.changes) as Array<[keyof NormalizationChanges, number]>)
    .filter(([, v]) => v > 0);
  const total = changeEntries.reduce((s, [, v]) => s + v, 0);

  return (
    <details
      open={open}
      onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
      className="my-spacing-sm rounded-md border border-amber-500/40 bg-amber-50/60 dark:bg-amber-950/20 text-xs font-mono"
      data-testid={`catechism-normalization-diff-${paragraph}`}
    >
      <summary className="cursor-pointer select-none px-spacing-sm py-spacing-2xs text-amber-900 dark:text-amber-200">
        [DEBUG] Normalizador alterou §{paragraph} — {total} correções ·{' '}
        {report.durationMs.toFixed(2)}ms · {report.originalLength}→{report.normalizedLength} chars
      </summary>

      <div className="px-spacing-sm py-spacing-2xs space-y-spacing-2xs">
        <div className="flex flex-wrap gap-1">
          {changeEntries.map(([k, v]) => (
            <span
              key={k}
              className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-900 dark:text-amber-200"
            >
              {LABELS[k]}: {v}
            </span>
          ))}
        </div>

        <div className="flex gap-1 pt-1">
          <button
            type="button"
            onClick={() =>
              downloadBlob(
                `catechism-normalizer-${paragraph}.json`,
                'application/json',
                buildJsonReport(paragraph, original, report)
              )
            }
            className="rounded border border-amber-500/40 px-2 py-0.5 text-[10px] hover:bg-amber-500/10"
            data-testid={`catechism-normalization-export-json-${paragraph}`}
          >
            Exportar JSON
          </button>
          <button
            type="button"
            onClick={() =>
              downloadBlob(
                `catechism-normalizer-${paragraph}.csv`,
                'text/csv',
                buildCsvReport(paragraph, report)
              )
            }
            className="rounded border border-amber-500/40 px-2 py-0.5 text-[10px] hover:bg-amber-500/10"
            data-testid={`catechism-normalization-export-csv-${paragraph}`}
          >
            Exportar CSV
          </button>
        </div>

        <div className="max-h-64 overflow-auto rounded border border-amber-500/20 bg-background/60">
          {diff.map((d, i) => (
            <div
              key={i}
              className={
                d.kind === 'del'
                  ? 'bg-red-500/10 text-red-700 dark:text-red-300 px-2'
                  : d.kind === 'add'
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2'
                    : 'text-muted-foreground px-2'
              }
            >
              <span className="opacity-50 mr-2">
                {d.kind === 'del' ? '-' : d.kind === 'add' ? '+' : ' '}
              </span>
              {d.text || '\u00A0'}
            </div>
          ))}
        </div>
      </div>
    </details>
  );
};

export default CatechismNormalizationDiff;
