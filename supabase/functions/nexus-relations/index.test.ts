// Sprint 1.12 — Testes de nexus-relations (injeção de dependências)
// Cobre: GET (bible/ccc, felizes e erros), POST/PATCH/DELETE (admin × não-admin),
// rate limiting, CORS/OPTIONS, method_not_allowed e erros de DB.
import { assertEquals, assert } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { handleRequest, type NexusDeps } from '../nexus-relations/index.ts';
import { createMockClient, type MockConfig, type MockCall } from '../tests/_supabase_mock.ts';

function makeDeps(opts: {
  mock?: MockConfig;
  isAdmin?: boolean;
  rateLimit?: boolean;
} = {}) {
  const { client, calls } = createMockClient(opts.mock ?? {});
  const deps: NexusDeps = {
    getClient: () => client,
    checkRateLimit: () => opts.rateLimit ?? true,
    isAdmin: () => Promise.resolve(opts.isAdmin ?? false),
  };
  return { deps, calls };
}

const req = (method: string, path = '/', body?: unknown, headers: Record<string, string> = {}) =>
  new Request(`http://x${path}`, {
    method,
    headers: { 'content-type': 'application/json', ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

// ─── CORS / método ────────────────────────────────────────────────────────────

Deno.test('OPTIONS → 200 com CORS', async () => {
  const { deps } = makeDeps();
  const res = await handleRequest(req('OPTIONS'), deps);
  assertEquals(res.status, 200);
  assertEquals(res.headers.get('access-control-allow-origin'), '*');
  await res.text();
});

Deno.test('PUT → 405 method_not_allowed', async () => {
  const { deps } = makeDeps({ isAdmin: true });
  const res = await handleRequest(req('PUT'), deps);
  assertEquals(res.status, 405);
  await res.text();
});

// ─── Rate limiting ────────────────────────────────────────────────────────────

Deno.test('GET bloqueado por rate limit → 429', async () => {
  const { deps } = makeDeps({ rateLimit: false });
  const res = await handleRequest(req('GET', '/?kind=bible_verse&abbrev=Jo&chapter=3'), deps);
  assertEquals(res.status, 429);
  assertEquals((await res.json()).error, 'rate_limited');
});

// ─── GET bible_verse ──────────────────────────────────────────────────────────

Deno.test('GET bible_verse feliz → items', async () => {
  const items = [{ id: 'r1', relation_type: 'paralelo' }];
  const { deps, calls } = makeDeps({
    mock: { tables: { nexus_relations: () => ({ data: items, error: null }) } },
  });
  const res = await handleRequest(req('GET', '/?kind=bible_verse&abbrev=Jo&chapter=3&verse=16'), deps);
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.items, items);
  const call = calls.find((c) => c.table === 'nexus_relations');
  assert(call?.filters?.some((f) => f.op === 'or'));
});

Deno.test('GET bible_verse sem abbrev → 400', async () => {
  const { deps } = makeDeps();
  const res = await handleRequest(req('GET', '/?kind=bible_verse&chapter=3'), deps);
  assertEquals(res.status, 400);
  assertEquals((await res.json()).error, 'invalid_bible_ref');
});

Deno.test('GET kind inválido → 400', async () => {
  const { deps } = makeDeps();
  const res = await handleRequest(req('GET', '/?kind=xyz'), deps);
  assertEquals(res.status, 400);
  assertEquals((await res.json()).error, 'invalid_kind');
});

Deno.test('GET kind ausente → 400', async () => {
  const { deps } = makeDeps();
  const res = await handleRequest(req('GET', '/'), deps);
  assertEquals(res.status, 400);
  assertEquals((await res.json()).error, 'invalid_kind');
});

// ─── GET catechism_paragraph ──────────────────────────────────────────────────

Deno.test('GET catechism_paragraph feliz', async () => {
  const { deps } = makeDeps({
    mock: { tables: { nexus_relations: () => ({ data: [], error: null }) } },
  });
  const res = await handleRequest(req('GET', '/?kind=catechism_paragraph&paragraph=460'), deps);
  assertEquals(res.status, 200);
  assertEquals((await res.json()).items, []);
});

Deno.test('GET catechism_paragraph sem paragraph → 400', async () => {
  const { deps } = makeDeps();
  const res = await handleRequest(req('GET', '/?kind=catechism_paragraph'), deps);
  assertEquals(res.status, 400);
  assertEquals((await res.json()).error, 'invalid_ccc_ref');
});

Deno.test('GET kind não suportado ainda → 400', async () => {
  const { deps } = makeDeps();
  const res = await handleRequest(req('GET', '/?kind=patristic'), deps);
  assertEquals(res.status, 400);
  assertEquals((await res.json()).error, 'kind_not_supported_yet');
});

Deno.test('GET db_error → 500', async () => {
  const { deps } = makeDeps({
    mock: { tables: { nexus_relations: () => ({ data: null, error: { message: 'boom' } }) } },
  });
  const res = await handleRequest(req('GET', '/?kind=bible_verse&abbrev=Jo&chapter=3'), deps);
  assertEquals(res.status, 500);
  assertEquals((await res.json()).error, 'db_error');
});

// ─── POST admin gate ──────────────────────────────────────────────────────────

const validRel = {
  relation_type: 'paralelo',
  source_kind: 'bible_verse',
  source_ref: { abbrev: 'Jo', chapter: 3, verse: 16 },
  target_kind: 'catechism_paragraph',
  target_ref: { paragraph: 460 },
};

Deno.test('POST sem admin → 403', async () => {
  const { deps } = makeDeps({ isAdmin: false });
  const res = await handleRequest(req('POST', '/', validRel), deps);
  assertEquals(res.status, 403);
  assertEquals((await res.json()).error, 'forbidden');
});

Deno.test('POST admin + payload válido → 201', async () => {
  const inserted = { id: 'new-id', ...validRel };
  const { deps, calls } = makeDeps({
    isAdmin: true,
    mock: { tables: { nexus_relations: ({ method }) => method === 'insert'
      ? { data: inserted, error: null } : { data: null, error: { message: 'x' } } } },
  });
  const res = await handleRequest(req('POST', '/', validRel), deps);
  assertEquals(res.status, 201);
  assertEquals((await res.json()).item.id, 'new-id');
  assert(calls.some((c) => c.method === 'insert' && c.table === 'nexus_relations'));
});

Deno.test('POST admin + payload inválido → 400', async () => {
  const { deps } = makeDeps({ isAdmin: true });
  const res = await handleRequest(req('POST', '/', { relation_type: '' }), deps);
  assertEquals(res.status, 400);
  assertEquals((await res.json()).error, 'invalid_payload');
});

Deno.test('POST admin + JSON malformado → 400', async () => {
  const { deps } = makeDeps({ isAdmin: true });
  const r = new Request('http://x/', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: 'not-json',
  });
  const res = await handleRequest(r, deps);
  assertEquals(res.status, 400);
});

// ─── PATCH ────────────────────────────────────────────────────────────────────

Deno.test('PATCH sem id → 400', async () => {
  const { deps } = makeDeps({ isAdmin: true });
  const res = await handleRequest(req('PATCH', '/', { note: 'x' }), deps);
  assertEquals(res.status, 400);
  assertEquals((await res.json()).error, 'missing_id');
});

Deno.test('PATCH sem admin → 403', async () => {
  const { deps } = makeDeps({ isAdmin: false });
  const res = await handleRequest(req('PATCH', '/?id=abc', { note: 'x' }), deps);
  assertEquals(res.status, 403);
});

Deno.test('PATCH admin → 200', async () => {
  const { deps } = makeDeps({
    isAdmin: true,
    mock: { tables: { nexus_relations: () => ({ data: { id: 'abc', note: 'x' }, error: null }) } },
  });
  const res = await handleRequest(req('PATCH', '/?id=abc', { note: 'x' }), deps);
  assertEquals(res.status, 200);
});

// ─── DELETE ───────────────────────────────────────────────────────────────────

Deno.test('DELETE sem admin → 403', async () => {
  const { deps } = makeDeps({ isAdmin: false });
  const res = await handleRequest(req('DELETE', '/?id=abc'), deps);
  assertEquals(res.status, 403);
});

Deno.test('DELETE admin sem id → 400', async () => {
  const { deps } = makeDeps({ isAdmin: true });
  const res = await handleRequest(req('DELETE', '/'), deps);
  assertEquals(res.status, 400);
});

Deno.test('DELETE admin → 200 ok', async () => {
  const { deps } = makeDeps({
    isAdmin: true,
    mock: { tables: { nexus_relations: () => ({ data: null, error: null }) } },
  });
  const res = await handleRequest(req('DELETE', '/?id=abc'), deps);
  assertEquals(res.status, 200);
  assertEquals((await res.json()).ok, true);
});
