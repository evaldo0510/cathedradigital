import { describe, it, expect, vi } from 'vitest';
import {
  parseArgs,
  runMigration,
  runRollback,
  ensureAuth,
  buildJsonReport,
  buildMarkdownReport,
  buildHtmlReport,
  totals,
  type CliDeps,
  type MigrationRow,
  type SupabaseLike,
  type LogRow,
} from './migrate-editorial-closure.core';

/* ═══════════════ helpers de mock ═══════════════ */

function makeSupabase(overrides: Partial<{
  signInError: string | null;
  rpc: (fn: string, params: unknown) => { data: unknown; error: { message: string } | null };
  logRows: LogRow[];
}> = {}): SupabaseLike {
  return {
    auth: {
      signInWithPassword: vi.fn(async () => ({
        error: overrides.signInError ? { message: overrides.signInError } : null,
      })),
    },
    rpc: vi.fn(async (fn: string, params?: Record<string, unknown>) => {
      return overrides.rpc ? overrides.rpc(fn, params) : { data: [], error: null };
    }),
    from: vi.fn(() => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: async () => ({ data: overrides.logRows ?? [], error: null }),
          }),
        }),
      }),
    })),
  } as unknown as SupabaseLike;
}

function makeDeps(sb: SupabaseLike, prompt = vi.fn(async () => '')): CliDeps & {
  writes: Array<{ path: string; contents: string }>;
  logs: string[];
} {
  const writes: Array<{ path: string; contents: string }> = [];
  const logs: string[] = [];
  return {
    supabase: sb,
    prompt,
    writeFile: async (path, contents) => { writes.push({ path, contents }); },
    mkdirp: async () => {},
    log: (m) => { logs.push(m); },
    now: () => new Date('2026-07-24T00:00:00Z'),
    writes,
    logs,
  };
}

const ROW = (over: Partial<MigrationRow> = {}): MigrationRow => ({
  entity_table: 'glossary',
  scanned: 5,
  normalized: 2,
  unchanged: 3,
  discarded: 0,
  run_id: '00000000-0000-0000-0000-000000000001',
  ...over,
});

/* ═══════════════ parseArgs ═══════════════ */

describe('parseArgs', () => {
  it('defaults', () => {
    const a = parseArgs([]);
    expect(a.yes).toBe(false);
    expect(a.dryRunOnly).toBe(false);
    expect(a.json).toBe(false);
    expect(a.tables).toBeNull();
    expect(a.emitMd).toBe(true);
    expect(a.emitHtml).toBe(true);
  });

  it('booleanos e --json/--yes/--dry-run-only', () => {
    const a = parseArgs(['--yes', '--json', '--dry-run-only', '--no-md', '--no-html']);
    expect(a.yes).toBe(true);
    expect(a.json).toBe(true);
    expect(a.dryRunOnly).toBe(true);
    expect(a.emitMd).toBe(false);
    expect(a.emitHtml).toBe(false);
  });

  it('entidades via flags dedicadas', () => {
    const a = parseArgs(['--glossary', '--catechism', '--saint-works']);
    expect(a.tables?.sort()).toEqual(['catechism_official', 'glossary', 'saint_works'].sort());
  });

  it('entidades via --tables=csv', () => {
    const a = parseArgs(['--tables=saints,prayers']);
    expect(a.tables).toEqual(['saints', 'prayers']);
  });

  it('rejeita tabela inválida', () => {
    expect(() => parseArgs(['--tables=foo'])).toThrow(/tabela inválida/);
  });

  it('--ids e --since', () => {
    const a = parseArgs(['--ids=a,b,c', '--since=2026-01-15']);
    expect(a.ids).toEqual(['a', 'b', 'c']);
    expect(a.since).toMatch(/^2026-01-15T/);
  });

  it('--since inválido lança', () => {
    expect(() => parseArgs(['--since=nope'])).toThrow(/--since inválido/);
  });

  it('--rollback exige UUID', () => {
    expect(() => parseArgs(['--rollback=abc'])).toThrow(/UUID/);
    const a = parseArgs(['--rollback=11111111-1111-1111-1111-111111111111']);
    expect(a.rollback).toBe('11111111-1111-1111-1111-111111111111');
  });

  it('flag desconhecida lança', () => {
    expect(() => parseArgs(['--foo'])).toThrow(/desconhecida/);
  });
});

/* ═══════════════ ensureAuth ═══════════════ */

describe('ensureAuth', () => {
  it('sucesso não lança', async () => {
    const deps = makeDeps(makeSupabase());
    await expect(ensureAuth(deps, { email: 'a', password: 'b' })).resolves.toBeUndefined();
  });

  it('falha propaga mensagem', async () => {
    const deps = makeDeps(makeSupabase({ signInError: 'invalid creds' }));
    await expect(ensureAuth(deps, { email: 'a', password: 'b' })).rejects.toThrow(/invalid creds/);
  });
});

/* ═══════════════ runMigration ═══════════════ */

describe('runMigration', () => {
  it('--dry-run-only não chama apply nem prompt', async () => {
    const rpc = vi.fn((_fn: string, _p: unknown) => ({ data: [ROW()], error: null }));
    const prompt = vi.fn(async () => 'APLICAR');
    const sb = makeSupabase({ rpc });
    const deps = makeDeps(sb, prompt);
    const args = parseArgs(['--dry-run-only']);
    const r = await runMigration(deps, args);
    expect(prompt).not.toHaveBeenCalled();
    expect(r.appliedRows).toBeNull();
    // 1 chamada apenas (dry-run)
    expect(rpc).toHaveBeenCalledTimes(1);
    // relatórios: json + md + html
    expect(deps.writes.map((w) => w.path.split('.').pop())).toEqual(['json', 'md', 'html']);
  });

  it('confirmação: qualquer resposta ≠ "APLICAR" cancela', async () => {
    const rpc = vi.fn(() => ({ data: [ROW()], error: null }));
    const prompt = vi.fn(async () => 'sim');
    const deps = makeDeps(makeSupabase({ rpc }), prompt);
    const r = await runMigration(deps, parseArgs([]));
    expect(prompt).toHaveBeenCalledOnce();
    expect(r.cancelled).toBe(true);
    expect(rpc).toHaveBeenCalledTimes(1); // não aplicou
  });

  it('confirmação: "APLICAR" chama apply', async () => {
    const rpc = vi.fn(() => ({ data: [ROW()], error: null }));
    const prompt = vi.fn(async () => 'APLICAR');
    const deps = makeDeps(makeSupabase({ rpc }), prompt);
    const r = await runMigration(deps, parseArgs([]));
    expect(r.cancelled).toBe(false);
    expect(r.appliedRows).not.toBeNull();
    expect(rpc).toHaveBeenCalledTimes(2);
    expect((rpc.mock.calls[1][1] as any)._dry_run).toBe(false);
  });

  it('--yes pula prompt e aplica', async () => {
    const rpc = vi.fn(() => ({ data: [ROW()], error: null }));
    const prompt = vi.fn(async () => 'APLICAR');
    const deps = makeDeps(makeSupabase({ rpc }), prompt);
    await runMigration(deps, parseArgs(['--yes']));
    expect(prompt).not.toHaveBeenCalled();
    expect(rpc).toHaveBeenCalledTimes(2);
  });

  it('nada a migrar → não pede confirmação', async () => {
    const rpc = vi.fn(() => ({
      data: [ROW({ normalized: 0, discarded: 0 })],
      error: null,
    }));
    const prompt = vi.fn(async () => 'APLICAR');
    const deps = makeDeps(makeSupabase({ rpc }), prompt);
    const r = await runMigration(deps, parseArgs([]));
    expect(prompt).not.toHaveBeenCalled();
    expect(r.appliedRows).toBeNull();
  });

  it('propaga erro do RPC', async () => {
    const rpc = vi.fn(() => ({ data: null, error: { message: 'forbidden' } }));
    const deps = makeDeps(makeSupabase({ rpc }));
    await expect(runMigration(deps, parseArgs(['--yes']))).rejects.toThrow(/forbidden/);
  });

  it('encaminha filtros (tables, ids, since) para o RPC', async () => {
    const rpc = vi.fn(() => ({ data: [ROW({ normalized: 0, discarded: 0 })], error: null }));
    const deps = makeDeps(makeSupabase({ rpc }));
    const args = parseArgs(['--glossary', '--ids=x,y', '--since=2026-06-01', '--dry-run-only']);
    await runMigration(deps, args);
    const params = rpc.mock.calls[0][1] as any;
    expect(params._tables).toEqual(['glossary']);
    expect(params._ids).toEqual(['x', 'y']);
    expect(params._since).toMatch(/^2026-06-01/);
  });

  it('--no-md e --no-html geram só JSON', async () => {
    const rpc = vi.fn(() => ({ data: [ROW({ normalized: 0, discarded: 0 })], error: null }));
    const deps = makeDeps(makeSupabase({ rpc }));
    await runMigration(deps, parseArgs(['--no-md', '--no-html', '--dry-run-only']));
    expect(deps.writes.map((w) => w.path.split('.').pop())).toEqual(['json']);
  });
});

/* ═══════════════ runRollback ═══════════════ */

describe('runRollback', () => {
  it('chama RPC rollback e emite relatórios', async () => {
    const rpc = vi.fn((fn) => ({
      data: fn === 'rollback_editorial_closure_migration'
        ? [{ entity_table: 'glossary', restored: 3, conflicted: 1, skipped: 0 }]
        : [],
      error: null,
    }));
    const deps = makeDeps(makeSupabase({ rpc }));
    const args = parseArgs(['--rollback=11111111-1111-1111-1111-111111111111']);
    const r = await runRollback(deps, args);
    expect(r.rows[0].restored).toBe(3);
    expect(r.rows[0].conflicted).toBe(1);
    expect(rpc).toHaveBeenCalledWith('rollback_editorial_closure_migration', {
      _run_id: '11111111-1111-1111-1111-111111111111',
    });
    expect(r.reports.length).toBe(3); // json + md + html
  });

  it('propaga erro do RPC', async () => {
    const rpc = vi.fn(() => ({ data: null, error: { message: 'no run' } }));
    const deps = makeDeps(makeSupabase({ rpc }));
    const args = parseArgs(['--rollback=11111111-1111-1111-1111-111111111111']);
    await expect(runRollback(deps, args)).rejects.toThrow(/no run/);
  });
});

/* ═══════════════ Relatórios ═══════════════ */

describe('relatórios', () => {
  const rows = [{ entity_table: 'glossary', scanned: 5, normalized: 2, unchanged: 3, discarded: 0 }];
  const logSample: LogRow[] = [{
    entity_table: 'glossary',
    entity_id: 'aaaaaaaa-1111-2222-3333-444444444444',
    strategy: 'string-to-object',
    warnings: ['closure era string pura — virou reflection'],
    before_value: 'texto solto',
    after_value: { reflection: 'texto solto' },
    dry_run: true,
    run_id: 'r1',
    created_at: '2026-07-24T00:00:00Z',
  }];

  it('JSON é parseável e contém phase/runId', () => {
    const s = buildJsonReport({
      phase: 'dry-run', runId: 'r1', args: parseArgs([]),
      rows: rows as any, logSample, generatedAt: 't',
    });
    const parsed = JSON.parse(s);
    expect(parsed.phase).toBe('dry-run');
    expect(parsed.runId).toBe('r1');
  });

  it('Markdown contém tabela e diff', () => {
    const md = buildMarkdownReport({ phase: 'dry-run', runId: 'r1', rows, logSample, generatedAt: 't' });
    expect(md).toContain('| entity_table |');
    expect(md).toContain('string-to-object');
    expect(md).toContain('"reflection"');
  });

  it('HTML escapa e contém runId', () => {
    const html = buildHtmlReport({ phase: 'dry-run', runId: 'r<1>', rows, logSample, generatedAt: 't' });
    expect(html).toContain('r&lt;1&gt;');
    expect(html).toContain('<table>');
  });
});

describe('totals', () => {
  it('soma linhas', () => {
    expect(totals([ROW({ scanned: 5, normalized: 2 }), ROW({ scanned: 3, normalized: 1 })]))
      .toEqual({ scanned: 8, normalized: 3, unchanged: 6, discarded: 0 });
  });
});
