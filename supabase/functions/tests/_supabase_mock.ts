// Mock builder minimalista para o Supabase JS client, cobrindo apenas a superfície
// usada por nexus-relations e translation-lookup:
//   from(table).select().eq().maybeSingle() / .single() / await (thenable)
//   from(table).insert(row).select().single()
//   from(table).update(row).eq().select().single()
//   from(table).delete().eq()
//   from(table).select().limit().or()   (thenable)
//   from(table).select().eq().eq().maybeSingle()
//   supabase.rpc(name, args)
//
// A tabela é resolvida por (table, method), retornando um resultado plano
// { data, error }. Todas as chamadas são gravadas em `calls` para asserts.

export type MockResult<T = unknown> = { data: T | null; error: { message: string } | null };

type Handler = (ctx: {
  table: string;
  method: 'select' | 'insert' | 'update' | 'delete';
  filters: Array<{ op: string; args: unknown[] }>;
  payload?: unknown;
}) => MockResult;

export interface MockConfig {
  tables?: Record<string, Handler>;
  rpc?: Record<string, (args: unknown) => MockResult>;
}

export interface MockCall {
  kind: 'from' | 'rpc';
  table?: string;
  method?: string;
  filters?: Array<{ op: string; args: unknown[] }>;
  payload?: unknown;
  rpcName?: string;
  rpcArgs?: unknown;
}

export function createMockClient(cfg: MockConfig = {}) {
  const calls: MockCall[] = [];

  function makeQuery(table: string, method: 'select' | 'insert' | 'update' | 'delete', payload?: unknown) {
    const filters: Array<{ op: string; args: unknown[] }> = [];
    const handler = cfg.tables?.[table];

    const runResult = (): MockResult => {
      calls.push({ kind: 'from', table, method, filters: [...filters], payload });
      if (!handler) return { data: null, error: { message: `no_handler_for:${table}.${method}` } };
      return handler({ table, method, filters, payload });
    };

    const chain: Record<string, unknown> = {
      select: (_cols?: string) => chain,
      order: (_col: string, _opts?: unknown) => chain,
      limit: (_n: number) => chain,
      eq: (col: string, val: unknown) => { filters.push({ op: 'eq', args: [col, val] }); return chain; },
      or: (expr: string) => { filters.push({ op: 'or', args: [expr] }); return chain; },
      maybeSingle: () => Promise.resolve(runResult()),
      single: () => Promise.resolve(runResult()),
      then: (onOk: (r: MockResult) => unknown, onErr?: (e: unknown) => unknown) =>
        Promise.resolve(runResult()).then(onOk, onErr),
    };
    return chain;
  }

  const client = {
    from(table: string) {
      return {
        select: (_cols?: string) => makeQuery(table, 'select'),
        insert: (row: unknown) => makeQuery(table, 'insert', row),
        update: (row: unknown) => makeQuery(table, 'update', row),
        delete: () => makeQuery(table, 'delete'),
      };
    },
    rpc(name: string, args: unknown) {
      calls.push({ kind: 'rpc', rpcName: name, rpcArgs: args });
      const fn = cfg.rpc?.[name];
      if (!fn) return Promise.resolve({ data: null, error: { message: `no_rpc:${name}` } });
      return Promise.resolve(fn(args));
    },
  };

  return { client, calls };
}
