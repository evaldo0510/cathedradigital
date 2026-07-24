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
 * Painel dev-only que mostra o diff entre texto original e normalizado.
 * Renderizado apenas quando `import.meta.env.DEV && report.changed`.
 */
export const CatechismNormalizationDiff: React.FC<Props> = ({ paragraph, original, report }) => {
  const [open, setOpen] = React.useState(false);

  if (!import.meta.env.DEV || !report.changed) return null;

  const diff = React.useMemo(() => lineDiff(original, report.text), [original, report.text]);
  const changeEntries = (Object.entries(report.changes) as Array<[keyof NormalizationChanges, number]>)
    .filter(([, v]) => v > 0);

  return (
    <details
      open={open}
      onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
      className="my-spacing-sm rounded-md border border-amber-500/40 bg-amber-50/60 dark:bg-amber-950/20 text-xs font-mono"
      data-testid={`catechism-normalization-diff-${paragraph}`}
    >
      <summary className="cursor-pointer select-none px-spacing-sm py-spacing-2xs text-amber-900 dark:text-amber-200">
        [DEV] Normalizador alterou §{paragraph} —{' '}
        {changeEntries.reduce((s, [, v]) => s + v, 0)} correções ·{' '}
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
