// Sprint 1.12 — Testes de translation-lookup (injeção de dependências)
// Cobre: query inválida, translation_id explícito × primária, gate PCL (423),
// 404 (translation/book/chapter), 503 (sem primária ativa), sucessos,
// rate limiting, CORS, method_not_allowed, db_error.
import { assertEquals, assert } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { handleRequest, type LookupDeps } from '../translation-lookup/index.ts';
import { createMockClient, type MockConfig, type MockCall } from '../tests/_supabase_mock.ts';

function makeDeps(opts: { mock?: MockConfig; rateLimit?: boolean } = {}) {
  const { client, calls } = createMockClient(opts.mock ?? {});
  const deps: LookupDeps = {
    getClient: () => client,
    checkRateLimit: () => opts.rateLimit ?? true,
  };
  return { deps, calls };
}

const req = (path = '/', method = 'GET') => new Request(`http://x${path}`, { method });

const T_ID = '11111111-1111-1111-1111-111111111111';
const activeTranslation = { id: T_ID, provider: 'bolls', pcl_status: 'active', code: 'nvi-pt' };
const book = { id: 'book-1', name: 'João', abbrev: 'Jo' };
const chap = { id: 'chap-1', number: 3 };
const verses = [{ number: 16, text: 'Porque Deus amou o mundo...' }];

function happyMock(overrides: Partial<MockConfig['tables']> = {}): MockConfig {
  return {
    tables: {
      bible_translation_sources: () => ({ data: activeTranslation, error: null }),
      bible_books: () => ({ data: book, error: null }),
      bible_chapters: () => ({ data: chap, error: null }),
      bible_verses: () => ({ data: verses, error: null }),
      ...overrides,
    },
    rpc: {
      bible_translation_readable: () => ({
        data: [{ readable: true, provider: 'bolls', pcl_status: 'active', reason: 'ok' }],
        error: null,
      }),
    },
  };
}

// ─── CORS / método ────────────────────────────────────────────────────────────

Deno.test('OPTIONS → 200 CORS', async () => {
  const { deps } = makeDeps();
  const res = await handleRequest(req('/', 'OPTIONS'), deps);
  assertEquals(res.status, 200);
  await res.text();
});

Deno.test('POST → 405', async () => {
  const { deps } = makeDeps();
  const res = await handleRequest(req('/', 'POST'), deps);
  assertEquals(res.status, 405);
  await res.text();
});

// ─── Rate limit ───────────────────────────────────────────────────────────────

Deno.test('rate limit → 429', async () => {
  const { deps } = makeDeps({ rateLimit: false });
  const res = await handleRequest(req('/?abbrev=Jo&chapter=3'), deps);
  assertEquals(res.status, 429);
});

// ─── Query validation ─────────────────────────────────────────────────────────

Deno.test('sem abbrev → 400', async () => {
  const { deps } = makeDeps();
  const res = await handleRequest(req('/?chapter=3'), deps);
  assertEquals(res.status, 400);
  assertEquals((await res.json()).error, 'invalid_query');
});

Deno.test('chapter não numérico → 400', async () => {
  const { deps } = makeDeps();
  const res = await handleRequest(req('/?abbrev=Jo&chapter=abc'), deps);
  assertEquals(res.status, 400);
});

Deno.test('translation_id não-uuid → 400', async () => {
  const { deps } = makeDeps();
  const res = await handleRequest(req('/?abbrev=Jo&chapter=3&translation_id=xxx'), deps);
  assertEquals(res.status, 400);
});

// ─── Happy paths ──────────────────────────────────────────────────────────────

Deno.test('happy path com primária → 200', async () => {
  const { deps } = makeDeps({ mock: happyMock() });
  const res = await handleRequest(req('/?abbrev=Jo&chapter=3&verse=16'), deps);
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.book.abbrev, 'Jo');
  assertEquals(body.verses.length, 1);
  assertEquals(body.translation.pcl_status, 'active');
});

Deno.test('happy path com translation_id explícito → 200', async () => {
  const { deps, calls } = makeDeps({ mock: happyMock() });
  const res = await handleRequest(req(`/?abbrev=Jo&chapter=3&translation_id=${T_ID}`), deps);
  assertEquals(res.status, 200);
  await res.json();
  const tCall = calls.find((c: MockCall) => c.table === 'bible_translation_sources');
  assert(tCall?.filters?.some((f: { op: string; args: unknown[] }) => f.op === 'eq' && f.args[0] === 'id' && f.args[1] === T_ID));
});

// ─── 404 chains ───────────────────────────────────────────────────────────────

Deno.test('translation_id inexistente → 404', async () => {
  const { deps } = makeDeps({
    mock: {
      tables: { bible_translation_sources: () => ({ data: null, error: null }) },
    },
  });
  const res = await handleRequest(req(`/?abbrev=Jo&chapter=3&translation_id=${T_ID}`), deps);
  assertEquals(res.status, 404);
  assertEquals((await res.json()).error, 'translation_not_found');
});

Deno.test('sem primária ativa → 503', async () => {
  const { deps } = makeDeps({
    mock: {
      tables: { bible_translation_sources: () => ({ data: null, error: null }) },
    },
  });
  const res = await handleRequest(req('/?abbrev=Jo&chapter=3'), deps);
  assertEquals(res.status, 503);
  assertEquals((await res.json()).error, 'no_active_primary_translation');
});

Deno.test('abbrev desconhecido → 404', async () => {
  const cfg = happyMock({ bible_books: () => ({ data: null, error: null }) });
  const { deps } = makeDeps({ mock: cfg });
  const res = await handleRequest(req('/?abbrev=Zz&chapter=3'), deps);
  assertEquals(res.status, 404);
  assertEquals((await res.json()).error, 'unknown_abbrev');
});

Deno.test('capítulo inexistente → 404', async () => {
  const cfg = happyMock({ bible_chapters: () => ({ data: null, error: null }) });
  const { deps } = makeDeps({ mock: cfg });
  const res = await handleRequest(req('/?abbrev=Jo&chapter=999'), deps);
  assertEquals(res.status, 404);
  assertEquals((await res.json()).error, 'chapter_not_found');
});

// ─── Gate PCL ────────────────────────────────────────────────────────────────

Deno.test('gate PCL bloqueado (draft) → 423 Locked', async () => {
  const cfg = happyMock({
    bible_translation_sources: () => ({
      data: { id: T_ID, provider: 'bolls', pcl_status: 'draft', code: 'nvi-pt' },
      error: null,
    }),
  });
  cfg.rpc = {
    bible_translation_readable: () => ({
      data: [{ readable: false, provider: 'bolls', pcl_status: 'draft', reason: 'pcl_blocked:draft' }],
      error: null,
    }),
  };
  const { deps } = makeDeps({ mock: cfg });
  const res = await handleRequest(req(`/?abbrev=Jo&chapter=3&translation_id=${T_ID}`), deps);
  assertEquals(res.status, 423);
  const body = await res.json();
  assertEquals(body.error, 'pcl_blocked');
  assertEquals(body.pcl_status, 'draft');
});

Deno.test('gate erro RPC → 500', async () => {
  const cfg = happyMock();
  cfg.rpc = {
    bible_translation_readable: () => ({ data: null, error: { message: 'rpc_fail' } }),
  };
  const { deps } = makeDeps({ mock: cfg });
  const res = await handleRequest(req('/?abbrev=Jo&chapter=3'), deps);
  assertEquals(res.status, 500);
  assertEquals((await res.json()).error, 'gate_error');
});

// ─── DB errors ────────────────────────────────────────────────────────────────

Deno.test('db_error ao buscar tradução → 500', async () => {
  const { deps } = makeDeps({
    mock: {
      tables: {
        bible_translation_sources: () => ({ data: null, error: { message: 'db down' } }),
      },
    },
  });
  const res = await handleRequest(req('/?abbrev=Jo&chapter=3'), deps);
  assertEquals(res.status, 500);
  assertEquals((await res.json()).error, 'db_error');
});
