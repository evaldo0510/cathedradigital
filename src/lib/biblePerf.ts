/**
 * Bible chapter load performance instrumentation.
 *
 * Mede as fases do fluxo de carregamento de capítulo:
 *   cache:check → text → connections → render → progress
 *
 * Cada execução produz uma entrada com durações por fase.
 * Acessível em runtime via `window.__biblePerf` e `window.__biblePerf.print()`.
 */

export type BiblePerfPhase =
  | 'cache:check'
  | 'cache:hit'
  | 'text:start'
  | 'text:end'
  | 'connections:start'
  | 'connections:end'
  | 'render'
  | 'progress:start'
  | 'progress:end'
  | 'end';

export interface BiblePerfRun {
  id: string;
  abbr: string;
  chapter: number;
  startedAt: number;
  marks: Partial<Record<BiblePerfPhase, number>>;
  source?: string;
  versesCount?: number;
  connectionsCount?: number;
  cacheHit?: boolean;
  status?: 'ok' | 'error' | '400' | '404' | '304' | 'empty';
}

const MAX_RUNS = 50;
const runs: BiblePerfRun[] = [];

function now(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

function ensureGlobal() {
  if (typeof window === 'undefined') return;
  const w = window as any;
  if (!w.__biblePerf) {
    w.__biblePerf = {
      runs,
      print: printTable,
      summary: summary,
      clear: () => {
        runs.length = 0;
      },
    };
  }
}

export function start(id: string, abbr: string, chapter: number): BiblePerfRun {
  ensureGlobal();
  const run: BiblePerfRun = {
    id,
    abbr,
    chapter,
    startedAt: now(),
    marks: {},
  };
  runs.unshift(run);
  if (runs.length > MAX_RUNS) runs.length = MAX_RUNS;
  try {
    performance.mark?.(`bible:${id}:start`);
  } catch {}
  return run;
}

export function mark(id: string, phase: BiblePerfPhase) {
  const run = runs.find((r) => r.id === id);
  if (!run) return;
  run.marks[phase] = now() - run.startedAt;
  try {
    performance.mark?.(`bible:${id}:${phase}`);
  } catch {}
}

export function end(id: string, patch?: Partial<BiblePerfRun>) {
  const run = runs.find((r) => r.id === id);
  if (!run) return;
  run.marks.end = now() - run.startedAt;
  if (patch) Object.assign(run, patch);
  logRun(run);
}

function durationsOf(run: BiblePerfRun) {
  const m = run.marks;
  const v = (a?: number, b?: number) =>
    typeof a === 'number' && typeof b === 'number' ? Math.round(b - a) : undefined;
  return {
    cache_ms: v(0, m['cache:check']),
    text_ms: v(m['text:start'], m['text:end']),
    connections_ms: v(m['connections:start'], m['connections:end']),
    render_ms: v(m['text:end'], m.render),
    progress_ms: v(m['progress:start'], m['progress:end']),
    total_ms: Math.round(m.end ?? 0),
  };
}

function logRun(run: BiblePerfRun) {
  const d = durationsOf(run);
  // Pretty console group for the run.
  /* eslint-disable no-console */
  const label = `🕮 Bible perf · ${run.abbr} ${run.chapter} · ${d.total_ms}ms${run.cacheHit ? ' (cache)' : ''}`;
  try {
    console.groupCollapsed(label);
    console.table({
      'Capítulo (total)': { ms: d.total_ms ?? '—' },
      'Cache check': { ms: d.cache_ms ?? '—' },
      'Busca texto': { ms: d.text_ms ?? '—' },
      'Busca conexões': { ms: d.connections_ms ?? '—' },
      'Renderiza': { ms: d.render_ms ?? '—' },
      'Salva progresso': { ms: d.progress_ms ?? '—' },
    });
    console.log('Status:', run.status, '· Source:', run.source, '· Versículos:', run.versesCount, '· Conexões:', run.connectionsCount);
    console.groupEnd();
  } catch {
    console.log(label, d);
  }
  /* eslint-enable no-console */
}

export function printTable() {
  /* eslint-disable no-console */
  const rows = runs.map((r) => ({
    livro: `${r.abbr} ${r.chapter}`,
    status: r.status ?? '—',
    ...durationsOf(r),
    source: r.source ?? '—',
  }));
  console.table(rows);
  /* eslint-enable no-console */
  return rows;
}

export function summary() {
  const completed = runs.filter((r) => r.marks.end != null);
  if (!completed.length) return { count: 0 };
  const ds = completed.map(durationsOf);
  const avg = (k: keyof ReturnType<typeof durationsOf>) => {
    const vals = ds.map((d) => d[k]).filter((v): v is number => typeof v === 'number');
    return vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : 0;
  };
  return {
    count: completed.length,
    avg_total_ms: avg('total_ms'),
    avg_text_ms: avg('text_ms'),
    avg_connections_ms: avg('connections_ms'),
    avg_render_ms: avg('render_ms'),
    avg_progress_ms: avg('progress_ms'),
    cache_hit_rate: Math.round(
      (completed.filter((r) => r.cacheHit).length / completed.length) * 100
    ),
  };
}

export function getRuns(): BiblePerfRun[] {
  return runs.slice();
}

export function getDurations(run: BiblePerfRun) {
  return durationsOf(run);
}

export const biblePerf = { start, mark, end, printTable, summary, getRuns, getDurations };
export default biblePerf;
