/**
 * scripts/migrate-editorial-closure.core.ts
 *
 * Núcleo testável do CLI de migração / rollback de `editorial_closure`.
 * Toda I/O externa (Supabase, prompt, filesystem, console) é injetável.
 */

export type EntityTable = 'glossary' | 'saints' | 'catechism_official' | 'prayers' | 'saint_works';

export const ALL_TABLES: EntityTable[] = [
  'glossary',
  'saints',
  'catechism_official',
  'prayers',
  'saint_works',
];

export type MigrationRow = {
  entity_table: string;
  scanned: number;
  normalized: number;
  unchanged: number;
  discarded: number;
  run_id: string;
};

export type RollbackRow = {
  entity_table: string;
  restored: number;
  conflicted: number;
  skipped: number;
};

export type LogRow = {
  entity_table: string;
  entity_id: string;
  strategy: string;
  warnings: unknown[] | null;
  before_value: unknown;
  after_value: unknown;
  dry_run: boolean;
  run_id: string | null;
  created_at: string;
};

export interface CliArgs {
  yes: boolean;
  dryRunOnly: boolean;
  json: boolean;
  tables: EntityTable[] | null;   // null = todas
  ids: string[] | null;
  since: string | null;           // ISO
  rollback: string | null;        // run_id
  reportDir: string;
  emitMd: boolean;
  emitHtml: boolean;
  help: boolean;
}

const ENTITY_FLAGS: Record<string, EntityTable> = {
  '--glossary': 'glossary',
  '--saints': 'saints',
  '--catechism': 'catechism_official',
  '--catechism-official': 'catechism_official',
  '--prayers': 'prayers',
  '--saint-works': 'saint_works',
};

export function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    yes: false,
    dryRunOnly: false,
    json: false,
    tables: null,
    ids: null,
    since: null,
    rollback: null,
    reportDir: 'REPORTS/editorial-closure',
    emitMd: true,
    emitHtml: true,
    help: false,
  };
  const selected = new Set<EntityTable>();

  for (const raw of argv) {
    const a = raw.trim();
    if (a === '--help' || a === '-h') args.help = true;
    else if (a === '--yes' || a === '-y') args.yes = true;
    else if (a === '--dry-run-only') args.dryRunOnly = true;
    else if (a === '--json') args.json = true;
    else if (a === '--no-md') args.emitMd = false;
    else if (a === '--no-html') args.emitHtml = false;
    else if (a.startsWith('--tables=')) {
      const list = a.slice('--tables='.length).split(',').map((s) => s.trim()).filter(Boolean);
      for (const t of list) {
        if (!(ALL_TABLES as string[]).includes(t)) {
          throw new Error(`tabela inválida: ${t}. Válidas: ${ALL_TABLES.join(', ')}`);
        }
        selected.add(t as EntityTable);
      }
    } else if (a.startsWith('--ids=')) {
      args.ids = a.slice('--ids='.length).split(',').map((s) => s.trim()).filter(Boolean);
    } else if (a.startsWith('--since=')) {
      const v = a.slice('--since='.length);
      const d = new Date(v);
      if (Number.isNaN(d.getTime())) throw new Error(`--since inválido: ${v}`);
      args.since = d.toISOString();
    } else if (a.startsWith('--rollback=')) {
      args.rollback = a.slice('--rollback='.length).trim();
      if (!/^[0-9a-f-]{36}$/i.test(args.rollback)) {
        throw new Error(`--rollback exige UUID válido, recebido: ${args.rollback}`);
      }
    } else if (a.startsWith('--report-dir=')) {
      args.reportDir = a.slice('--report-dir='.length).trim() || args.reportDir;
    } else if (ENTITY_FLAGS[a]) {
      selected.add(ENTITY_FLAGS[a]);
    } else if (a.startsWith('-')) {
      throw new Error(`flag desconhecida: ${a}`);
    }
  }

  if (selected.size > 0) args.tables = Array.from(selected);
  return args;
}

/* ═══════════════════ Interfaces injetáveis ═══════════════════ */

export interface RpcResult<T> { data: T | null; error: { message: string } | null; }

export interface SupabaseLike {
  auth: {
    signInWithPassword(c: { email: string; password: string }): Promise<{ error: { message: string } | null }>;
  };
  rpc(fn: string, params?: Record<string, unknown>): Promise<RpcResult<unknown>>;
  from(table: string): {
    select(cols: string): {
      eq(col: string, val: unknown): {
        order(col: string, o: { ascending: boolean }): {
          limit(n: number): Promise<RpcResult<LogRow[]>>;
        };
      };
    };
  };
}

export interface CliDeps {
  supabase: SupabaseLike;
  prompt: (q: string) => Promise<string>;
  writeFile: (path: string, contents: string) => Promise<void>;
  mkdirp: (path: string) => Promise<void>;
  log: (msg: string) => void;
  now?: () => Date;
}

export interface AuthCreds { email: string; password: string; }

/* ═══════════════════ Relatórios ═══════════════════ */

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]!));
}

export function buildJsonReport(input: {
  phase: 'dry-run' | 'apply' | 'rollback';
  runId: string | null;
  args: CliArgs;
  rows: MigrationRow[] | RollbackRow[];
  logSample: LogRow[];
  generatedAt: string;
}): string {
  return JSON.stringify(input, null, 2);
}

export function buildMarkdownReport(input: {
  phase: string;
  runId: string | null;
  rows: Array<Record<string, unknown>>;
  logSample: LogRow[];
  generatedAt: string;
}): string {
  const { phase, runId, rows, logSample, generatedAt } = input;
  const lines: string[] = [];
  lines.push(`# Relatório de ${phase} — editorial_closure`);
  lines.push(`- **run_id:** \`${runId ?? '—'}\``);
  lines.push(`- **gerado em:** ${generatedAt}`);
  lines.push('');
  if (rows.length > 0) {
    const cols = Object.keys(rows[0]);
    lines.push('## Resumo por entidade');
    lines.push('');
    lines.push(`| ${cols.join(' | ')} |`);
    lines.push(`| ${cols.map(() => '---').join(' | ')} |`);
    for (const r of rows) lines.push(`| ${cols.map((c) => String(r[c] ?? '')).join(' | ')} |`);
    lines.push('');
  }
  if (logSample.length > 0) {
    lines.push('## Amostra de diffs (até 50)');
    lines.push('');
    for (const l of logSample.slice(0, 50)) {
      const warn = Array.isArray(l.warnings) ? l.warnings.join(' · ') : '';
      lines.push(`### ${l.entity_table}/${l.entity_id.slice(0, 8)} — \`${l.strategy}\``);
      if (warn) lines.push(`> ${warn}`);
      lines.push('');
      lines.push('```json');
      lines.push(JSON.stringify({ before: l.before_value, after: l.after_value }, null, 2));
      lines.push('```');
      lines.push('');
    }
  }
  return lines.join('\n');
}

export function buildHtmlReport(input: {
  phase: string;
  runId: string | null;
  rows: Array<Record<string, unknown>>;
  logSample: LogRow[];
  generatedAt: string;
}): string {
  const { phase, runId, rows, logSample, generatedAt } = input;
  const tableHtml = rows.length
    ? `<table><thead><tr>${Object.keys(rows[0]).map((c) => `<th>${escapeHtml(c)}</th>`).join('')}</tr></thead><tbody>${
        rows.map((r) => `<tr>${Object.keys(rows[0]).map((c) => `<td>${escapeHtml(String(r[c] ?? ''))}</td>`).join('')}</tr>`).join('')
      }</tbody></table>`
    : '<p><em>Sem alterações.</em></p>';

  const diffs = logSample.slice(0, 50).map((l) => `
    <details><summary><code>${escapeHtml(l.entity_table)}/${escapeHtml(l.entity_id.slice(0, 8))}</code> — <b>${escapeHtml(l.strategy)}</b></summary>
      <div class="diff">
        <div><h4>antes</h4><pre>${escapeHtml(JSON.stringify(l.before_value, null, 2))}</pre></div>
        <div><h4>depois</h4><pre>${escapeHtml(JSON.stringify(l.after_value, null, 2))}</pre></div>
      </div>
    </details>`).join('');

  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>editorial_closure — ${escapeHtml(phase)}</title>
<style>
  body{font:14px/1.5 -apple-system,system-ui,sans-serif;max-width:1100px;margin:32px auto;padding:0 16px;color:#0B1F3A}
  h1{border-bottom:2px solid #C8A96A;padding-bottom:8px}
  table{border-collapse:collapse;width:100%;margin:16px 0}
  th,td{border:1px solid #ddd;padding:6px 10px;text-align:left}
  th{background:#f5f0e0}
  details{margin:8px 0;background:#fafafa;border:1px solid #eee;border-radius:6px;padding:6px 12px}
  summary{cursor:pointer}
  .diff{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  pre{background:#0B1F3A;color:#f5f0e0;padding:10px;border-radius:6px;overflow:auto;max-height:400px;font-size:12px}
  .meta{color:#666;font-size:12px}
</style></head><body>
<h1>Relatório de ${escapeHtml(phase)}</h1>
<p class="meta"><b>run_id:</b> <code>${escapeHtml(runId ?? '—')}</code> · <b>gerado:</b> ${escapeHtml(generatedAt)}</p>
<h2>Resumo por entidade</h2>${tableHtml}
<h2>Amostra de diffs</h2>${diffs || '<p><em>Nenhum diff registrado.</em></p>'}
</body></html>`;
}

/* ═══════════════════ Fluxos ═══════════════════ */

export async function ensureAuth(deps: CliDeps, creds: AuthCreds): Promise<void> {
  const { error } = await deps.supabase.auth.signInWithPassword(creds);
  if (error) throw new Error(`auth: ${error.message}`);
}

export function totals(rows: MigrationRow[]) {
  return rows.reduce((acc, r) => ({
    scanned: acc.scanned + r.scanned,
    normalized: acc.normalized + r.normalized,
    unchanged: acc.unchanged + r.unchanged,
    discarded: acc.discarded + r.discarded,
  }), { scanned: 0, normalized: 0, unchanged: 0, discarded: 0 });
}

async function fetchLogSample(deps: CliDeps, runId: string, dryRun: boolean): Promise<LogRow[]> {
  const q = deps.supabase.from('editorial_closure_migration_log')
    .select('entity_table, entity_id, strategy, warnings, before_value, after_value, dry_run, run_id, created_at')
    .eq('run_id', runId)
    .order('created_at', { ascending: true })
    .limit(200);
  const res = await q;
  if (res.error || !res.data) return [];
  return res.data.filter((r) => r.dry_run === dryRun);
}

async function emitReports(
  deps: CliDeps,
  args: CliArgs,
  phase: 'dry-run' | 'apply' | 'rollback',
  runId: string | null,
  rows: Array<Record<string, unknown>>,
  logSample: LogRow[],
): Promise<string[]> {
  const generatedAt = (deps.now?.() ?? new Date()).toISOString();
  const stem = `${args.reportDir}/${runId ?? 'noid'}-${phase}`;
  await deps.mkdirp(args.reportDir);
  const paths: string[] = [];

  const json = buildJsonReport({ phase, runId, args, rows: rows as MigrationRow[], logSample, generatedAt });
  await deps.writeFile(`${stem}.json`, json);
  paths.push(`${stem}.json`);

  if (args.emitMd) {
    await deps.writeFile(`${stem}.md`, buildMarkdownReport({ phase, runId, rows, logSample, generatedAt }));
    paths.push(`${stem}.md`);
  }
  if (args.emitHtml) {
    await deps.writeFile(`${stem}.html`, buildHtmlReport({ phase, runId, rows, logSample, generatedAt }));
    paths.push(`${stem}.html`);
  }
  return paths;
}

export async function runRollback(deps: CliDeps, args: CliArgs): Promise<{ rows: RollbackRow[]; reports: string[] }> {
  if (!args.rollback) throw new Error('runRollback exige --rollback=<uuid>');
  deps.log(`→ Rollback do run_id ${args.rollback}...`);
  const res = await deps.supabase.rpc('rollback_editorial_closure_migration', { _run_id: args.rollback });
  if (res.error) throw new Error(`rollback: ${res.error.message}`);
  const rows = (res.data ?? []) as RollbackRow[];
  const conflicted = rows.reduce((n, r) => n + r.conflicted, 0);
  const restored = rows.reduce((n, r) => n + r.restored, 0);
  deps.log(`  restauradas: ${restored} · conflitos: ${conflicted}`);
  const logSample = await fetchLogSample(deps, args.rollback, false);
  const reports = await emitReports(deps, args, 'rollback', args.rollback, rows as unknown as Array<Record<string, unknown>>, logSample);
  return { rows, reports };
}

export async function runMigration(deps: CliDeps, args: CliArgs): Promise<{
  runId: string | null;
  dryRows: MigrationRow[];
  appliedRows: MigrationRow[] | null;
  reports: string[];
  cancelled: boolean;
}> {
  const params = {
    _dry_run: true,
    _tables: args.tables,
    _ids: args.ids,
    _since: args.since,
  };

  deps.log('→ Executando dry-run...');
  const dry = await deps.supabase.rpc('migrate_editorial_closure_legacy', params);
  if (dry.error) throw new Error(`dry-run: ${dry.error.message}`);
  const dryRows = (dry.data ?? []) as MigrationRow[];
  const runId = dryRows[0]?.run_id ?? null;
  const t = totals(dryRows);
  deps.log(`  scanned=${t.scanned} normalized=${t.normalized} unchanged=${t.unchanged} discarded=${t.discarded}`);

  const drySample = runId ? await fetchLogSample(deps, runId, true) : [];
  const reports: string[] = [];
  reports.push(...await emitReports(deps, args, 'dry-run', runId, dryRows as unknown as Array<Record<string, unknown>>, drySample));

  if (t.normalized === 0 && t.discarded === 0) {
    deps.log('✅ Nada a migrar.');
    return { runId, dryRows, appliedRows: null, reports, cancelled: false };
  }

  if (args.dryRunOnly) {
    deps.log('(dry-run-only) nenhuma alteração aplicada.');
    return { runId, dryRows, appliedRows: null, reports, cancelled: false };
  }

  if (!args.yes) {
    const answer = (await deps.prompt('Aplicar migração? [digite "APLICAR"] ')).trim();
    if (answer !== 'APLICAR') {
      deps.log('Cancelado.');
      return { runId, dryRows, appliedRows: null, reports, cancelled: true };
    }
  }

  deps.log('→ Aplicando migração...');
  const apply = await deps.supabase.rpc('migrate_editorial_closure_legacy', { ...params, _dry_run: false });
  if (apply.error) throw new Error(`apply: ${apply.error.message}`);
  const appliedRows = (apply.data ?? []) as MigrationRow[];
  const applyRunId = appliedRows[0]?.run_id ?? null;
  const applySample = applyRunId ? await fetchLogSample(deps, applyRunId, false) : [];
  reports.push(...await emitReports(deps, args, 'apply', applyRunId, appliedRows as unknown as Array<Record<string, unknown>>, applySample));
  deps.log('✅ Migração concluída.');
  return { runId: applyRunId, dryRows, appliedRows, reports, cancelled: false };
}

export const HELP = `
migrate-editorial-closure — CLI

Uso:
  bun scripts/migrate-editorial-closure.ts [flags]

Filtros de escopo:
  --glossary --saints --catechism --prayers --saint-works
  --tables=glossary,saints
  --ids=<uuid>,<uuid>
  --since=YYYY-MM-DD              (updated_at >= data)

Execução:
  --dry-run-only                  só dry-run
  --yes / -y                      pula confirmação "APLICAR"
  --json                          imprime JSON no stdout ao final

Rollback:
  --rollback=<run_id>             restaura linhas do run (aborta em conflito)

Relatórios:
  --report-dir=REPORTS/editorial-closure
  --no-md --no-html               (JSON sempre é gerado)
`;
