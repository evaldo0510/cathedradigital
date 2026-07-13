// Sprint A / CAT-001 — Export CSV client-side do dashboard /cid-compliance
// Sem dependência nova: monta CSV em memória e dispara download via Blob.
// Escapa aspas duplas e envolve campos com vírgula/quebra de linha.

type Counts = { conforme: number; herdado: number; na: number; ausente: number; desconhecido?: number };
type Category = { total: number; cidOk: number; failed: number };
type Snapshot = {
  captured_at: string;
  commit_sha: string | null;
  branch: string | null;
  coverage_ratio: number;
  coverage_pct: string;
  total_functions: number;
  cid_counts: Counts;
  validation_counts: Counts;
  http_counts: Counts;
  test_counts: Counts;
  by_category: Record<string, Category>;
  failing_functions: { name: string; category: string; failed_steps: string[] }[];
};
type TrendPoint = {
  t: string;
  coverage_ratio: number;
  total: number;
  ausente: number;
  failing: number;
  sha: string | null;
};

function esc(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows: (string | number | null | undefined)[][]): string {
  return rows.map((r) => r.map(esc).join(',')).join('\r\n');
}

function download(filename: string, csv: string) {
  // BOM UTF-8 para Excel abrir acentos corretamente
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function stamp(iso: string | undefined): string {
  const d = iso ? new Date(iso) : new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

/** Snapshot atual: por dimensão e por categoria em um único arquivo. */
export function downloadSnapshotCsv(s: Snapshot) {
  const rows: (string | number | null | undefined)[][] = [];
  rows.push(['# Snapshot CID Compliance']);
  rows.push(['captured_at', s.captured_at]);
  rows.push(['commit_sha', s.commit_sha ?? '']);
  rows.push(['branch', s.branch ?? '']);
  rows.push(['total_functions', s.total_functions]);
  rows.push(['coverage_pct', s.coverage_pct]);
  rows.push([]);
  rows.push(['# Contagem por dimensão']);
  rows.push(['dimensao', 'conforme', 'herdado', 'na', 'ausente']);
  const dims: [string, Counts][] = [
    ['CID', s.cid_counts],
    ['VAL', s.validation_counts],
    ['HTTP', s.http_counts],
    ['TEST', s.test_counts],
  ];
  for (const [name, c] of dims) {
    rows.push([name, c.conforme, c.herdado, c.na, c.ausente]);
  }
  rows.push([]);
  rows.push(['# Contagem por categoria']);
  rows.push(['categoria', 'total', 'cid_ok', 'em_falha']);
  for (const [cat, c] of Object.entries(s.by_category)) {
    rows.push([cat, c.total, c.cidOk, c.failed]);
  }
  download(`cid-snapshot-${stamp(s.captured_at)}.csv`, toCsv(rows));
}

/** Série temporal (tendência) — 1 linha por snapshot. */
export function downloadTrendCsv(points: TrendPoint[], windowDays: number) {
  const rows: (string | number | null | undefined)[][] = [];
  rows.push([`# Tendência CID Compliance (${windowDays} dias, ${points.length} snapshots)`]);
  rows.push(['captured_at', 'coverage_ratio', 'total', 'ausente', 'failing', 'commit_sha']);
  for (const p of points) {
    rows.push([p.t, p.coverage_ratio, p.total, p.ausente, p.failing, p.sha ?? '']);
  }
  download(`cid-trend-${windowDays}d-${stamp(undefined)}.csv`, toCsv(rows));
}

/** Funções em falha do snapshot atual — 1 linha por (função, etapa). */
export function downloadFailingCsv(s: Snapshot) {
  const rows: (string | number | null | undefined)[][] = [];
  rows.push(['# Funções em falha']);
  rows.push(['captured_at', s.captured_at]);
  rows.push([]);
  rows.push(['funcao', 'categoria', 'etapas_falhadas']);
  for (const f of s.failing_functions) {
    rows.push([f.name, f.category, f.failed_steps.join(' · ')]);
  }
  download(`cid-failing-${stamp(s.captured_at)}.csv`, toCsv(rows));
}
