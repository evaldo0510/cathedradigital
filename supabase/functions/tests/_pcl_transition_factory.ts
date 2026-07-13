// Sprint 1.14 — Factory de testes para transições PCL
// Reusada por E1–E6 (pcl-approve/activate/suspend/revoke/reactivate/expire).
// Cobre: 200 happy path, 403 sem admin, 400 payload inválido, 400 reason obrigatório,
// 404 source inexistente, 409 transição inválida, 405 método errado, correlation_id.
import { assertEquals, assert } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import {
  handleTransition,
  type TransitionDeps,
  type TransitionSpec,
} from '../_shared/pcl-transition.ts';
import { createMockClient, type MockConfig } from '../tests/_supabase_mock.ts';

interface FactoryOpts {
  spec: TransitionSpec;
  currentState: string; // estado retornado pelo pre-check
}

function makeDeps(opts: {
  mock?: MockConfig;
  isAdmin?: boolean;
  userId?: string | null;
} = {}) {
  const { client, calls } = createMockClient(opts.mock ?? {});
  const deps: TransitionDeps = {
    getClient: () => client,
    isAdmin: () => Promise.resolve(opts.isAdmin ?? true),
    getUserId: () => Promise.resolve(opts.userId ?? 'user-admin-uuid'),
  };
  return { deps, calls };
}

const req = (method: string, body?: unknown, headers: Record<string, string> = {}) =>
  new Request('http://x/', {
    method,
    headers: { 'content-type': 'application/json', ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

function mockTable(pclStatus: string): MockConfig {
  return {
    tables: {
      bible_translation_sources: (ctx) => {
        if (ctx.method === 'select') {
          return {
            data: { id: 'src-1', pcl_status: pclStatus },
            error: null,
          };
        }
        if (ctx.method === 'update') {
          const p = ctx.payload as Record<string, unknown>;
          return {
            data: {
              id: 'src-1',
              pcl_status: p.pcl_status,
              pcl_activated_by: p.pcl_activated_by ?? null,
              pcl_activated_at: p.pcl_activated_at ?? null,
            },
            error: null,
          };
        }
        return { data: null, error: { message: 'unexpected' } };
      },
    },
  };
}

export function registerTransitionTests(opts: FactoryOpts) {
  const { spec, currentState } = opts;
  const label = `[${spec.action}]`;

  Deno.test(`${label} OPTIONS → 200 com correlation_id`, async () => {
    const { deps } = makeDeps();
    const res = await handleTransition(req('OPTIONS'), spec, deps);
    assertEquals(res.status, 200);
    assert(res.headers.get('x-correlation-id'));
    await res.text();
  });

  Deno.test(`${label} GET → 405`, async () => {
    const { deps } = makeDeps();
    const res = await handleTransition(req('GET'), spec, deps);
    assertEquals(res.status, 405);
    await res.text();
  });

  Deno.test(`${label} sem admin → 403`, async () => {
    const { deps } = makeDeps({ isAdmin: false });
    const res = await handleTransition(
      req('POST', { source_id: '00000000-0000-0000-0000-000000000001' }),
      spec,
      deps,
    );
    assertEquals(res.status, 403);
    await res.text();
  });

  Deno.test(`${label} payload inválido (source_id ausente) → 400`, async () => {
    const { deps } = makeDeps();
    const res = await handleTransition(req('POST', {}), spec, deps);
    assertEquals(res.status, 400);
    assertEquals((await res.json()).error, 'invalid_payload');
  });

  if (spec.requiresReason) {
    Deno.test(`${label} reason obrigatório ausente → 400`, async () => {
      const { deps } = makeDeps({ mock: mockTable(currentState) });
      const res = await handleTransition(
        req('POST', { source_id: '00000000-0000-0000-0000-000000000001' }),
        spec,
        deps,
      );
      assertEquals(res.status, 400);
      assertEquals((await res.json()).error, 'reason_required');
    });
  }

  Deno.test(`${label} source inexistente → 404`, async () => {
    const { deps } = makeDeps({
      mock: {
        tables: {
          bible_translation_sources: (ctx) =>
            ctx.method === 'select'
              ? { data: null, error: null }
              : { data: null, error: { message: 'unreached' } },
        },
      },
    });
    const body: Record<string, unknown> = {
      source_id: '00000000-0000-0000-0000-000000000001',
    };
    if (spec.requiresReason) body.reason = 'teste';
    const res = await handleTransition(req('POST', body), spec, deps);
    assertEquals(res.status, 404);
    await res.text();
  });

  Deno.test(`${label} estado inválido → 409`, async () => {
    const { deps } = makeDeps({ mock: mockTable('draft') });
    const body: Record<string, unknown> = {
      source_id: '00000000-0000-0000-0000-000000000001',
    };
    if (spec.requiresReason) body.reason = 'teste';
    const res = await handleTransition(req('POST', body), spec, deps);
    // Se a matriz permitir 'draft', pula o teste (mas nenhuma das 6 permite draft).
    if (spec.from.includes('draft' as never)) {
      await res.text();
      return;
    }
    assertEquals(res.status, 409);
    const j = await res.json();
    assertEquals(j.error, 'invalid_transition');
    assertEquals(j.current_state, 'draft');
  });

  Deno.test(`${label} happy path → 200 + correlation_id ecoado`, async () => {
    const { deps, calls } = makeDeps({
      mock: mockTable(currentState),
      userId: 'admin-1',
    });
    const body: Record<string, unknown> = {
      source_id: '00000000-0000-0000-0000-000000000001',
    };
    if (spec.requiresReason) body.reason = 'motivo teste';
    const res = await handleTransition(
      req('POST', body, { 'x-correlation-id': 'cid-fixed-e2e' }),
      spec,
      deps,
    );
    assertEquals(res.status, 200);
    assertEquals(res.headers.get('x-correlation-id'), 'cid-fixed-e2e');
    const j = await res.json();
    assertEquals(j.ok, true);
    assertEquals(j.action, spec.action);
    assertEquals(j.to, spec.to);
    assertEquals(j.correlation_id, 'cid-fixed-e2e');

    // Verifica que houve UPDATE com pcl_status correto
    const updateCall = calls.find(
      (c) => c.table === 'bible_translation_sources' && c.method === 'update',
    );
    assert(updateCall, 'update call must happen');
    const patch = updateCall!.payload as Record<string, unknown>;
    assertEquals(patch.pcl_status, spec.to);
    if (spec.extras) {
      assertEquals(patch.pcl_activated_by, 'admin-1');
      assert(patch.pcl_activated_at);
    }
  });

  Deno.test(`${label} correlation_id gerado quando ausente`, async () => {
    const { deps } = makeDeps({ mock: mockTable(currentState) });
    const body: Record<string, unknown> = {
      source_id: '00000000-0000-0000-0000-000000000001',
    };
    if (spec.requiresReason) body.reason = 'teste';
    const res = await handleTransition(req('POST', body), spec, deps);
    assertEquals(res.status, 200);
    const cid = res.headers.get('x-correlation-id');
    assert(cid && cid.length > 0, 'x-correlation-id header deve existir');
    await res.text();
  });
}
