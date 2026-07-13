// Sprint A / CAT-001 — Testes do persist-cid-snapshot.ts
// Rodar: deno test -A scripts/persist-cid-snapshot.test.ts
//
// Estratégia:
//   - Mocka globalThis.fetch para não tocar em nenhuma rede.
//   - Substitui Deno.readTextFile para injetar um relatório sintético.
//   - Valida: skip silencioso sem SERVICE_ROLE, chamada correta com env,
//     payload derivado corretamente do meta/rows do relatório.
//
// Não requer SUPABASE_SERVICE_ROLE_KEY — o mock intercepta antes.

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SCRIPT = new URL("./persist-cid-snapshot.ts", import.meta.url).href;

type FetchCall = { url: string; init: RequestInit };

function makeReport() {
  return {
    meta: {
      total_functions: 3,
      coverage_ratio: 0.66,
      coverage_pct: "66.00%",
      cid_counts: { conforme: 2, herdado: 0, na: 0, ausente: 1 },
      validation_counts: { conforme: 2, herdado: 0, na: 1, ausente: 0 },
      http_counts: { conforme: 3, herdado: 0, na: 0, ausente: 0 },
      test_counts: { conforme: 1, herdado: 0, na: 2, ausente: 0 },
      by_category: { pcl: { total: 2, cidOk: 2, failed: 0 } },
      passed: true,
    },
    rows: [
      { name: "pcl-approve", category: "pcl", failedSteps: [] },
      { name: "sitemap", category: "misc", failedSteps: ["CID", "TEST"] },
    ],
  };
}

// Instala mocks reversíveis para cada teste
function installMocks(opts: {
  env: Record<string, string | undefined>;
  reportJson?: string | null; // null => arquivo ausente
}): { calls: FetchCall[]; restore: () => void } {
  const calls: FetchCall[] = [];

  const origFetch = globalThis.fetch;
  const origReadTextFile = Deno.readTextFile;
  const origEnvGet = Deno.env.get;
  const origExit = Deno.exit;

  // fetch mockado — sempre 201 salvo override
  // deno-lint-ignore no-explicit-any
  (globalThis as any).fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), init: init ?? {} });
    return Promise.resolve(new Response(null, { status: 201 }));
  };

  // env mockado
  Deno.env.get = ((k: string) => opts.env[k]) as typeof Deno.env.get;

  // readTextFile mockado
  Deno.readTextFile = ((_p: string | URL) => {
    if (opts.reportJson === null) return Promise.reject(new Error("ENOENT"));
    return Promise.resolve(opts.reportJson ?? JSON.stringify(makeReport()));
  }) as typeof Deno.readTextFile;

  // exit mockado — vira throw para não matar o test runner
  Deno.exit = ((code?: number) => {
    throw new Error(`__exit__:${code ?? 0}`);
  }) as typeof Deno.exit;

  return {
    calls,
    restore: () => {
      globalThis.fetch = origFetch;
      Deno.readTextFile = origReadTextFile;
      Deno.env.get = origEnvGet;
      Deno.exit = origExit;
    },
  };
}

// Reimport dinâmico com cache-buster para reexecutar main() a cada teste
async function runScript() {
  const mod = await import(`${SCRIPT}?t=${crypto.randomUUID()}`);
  await mod.main?.();
}

Deno.test("skip silencioso quando SUPABASE_SERVICE_ROLE_KEY ausente", async () => {
  const m = installMocks({
    env: { VITE_SUPABASE_URL: "https://x.supabase.co" }, // sem SERVICE_ROLE
  });
  try {
    await runScript();
    assertEquals(m.calls.length, 0, "não deve chamar fetch sem SERVICE_ROLE");
  } finally {
    m.restore();
  }
});

Deno.test("skip silencioso quando SUPABASE_URL ausente", async () => {
  const m = installMocks({
    env: { SUPABASE_SERVICE_ROLE_KEY: "sk-test" }, // sem URL
  });
  try {
    await runScript();
    assertEquals(m.calls.length, 0);
  } finally {
    m.restore();
  }
});

Deno.test("persiste snapshot com payload correto quando env presente", async () => {
  const m = installMocks({
    env: {
      SUPABASE_URL: "https://x.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "sk-test-123",
      GITHUB_SHA: "abcdef1234567890",
      GITHUB_REF_NAME: "main",
    },
  });
  try {
    await runScript();
    assertEquals(m.calls.length, 1, "deve fazer 1 POST");
    const call = m.calls[0];
    assertEquals(
      call.url,
      "https://x.supabase.co/rest/v1/cid_compliance_snapshots",
    );
    assertEquals(call.init.method, "POST");
    const headers = call.init.headers as Record<string, string>;
    assertEquals(headers.apikey, "sk-test-123");
    assertEquals(headers.Authorization, "Bearer sk-test-123");
    assertEquals(headers["Content-Type"], "application/json");
    assertEquals(headers.Prefer, "return=minimal");

    const body = JSON.parse(call.init.body as string);
    assertEquals(body.commit_sha, "abcdef1234567890");
    assertEquals(body.branch, "main");
    assertEquals(body.total_functions, 3);
    assertEquals(body.coverage_ratio, 0.66);
    assertEquals(body.coverage_pct, "66.00%");
    assertEquals(body.cid_counts.ausente, 1);
    assertEquals(body.passed, true);
    // failing_functions extrai apenas rows com failedSteps não-vazio
    assertEquals(body.failing_functions.length, 1);
    assertEquals(body.failing_functions[0].name, "sitemap");
    assertEquals(body.failing_functions[0].category, "misc");
    assertEquals(body.failing_functions[0].failed_steps, ["CID", "TEST"]);
  } finally {
    m.restore();
  }
});

Deno.test("não bloqueia CI quando INSERT falha (exit 0)", async () => {
  const m = installMocks({
    env: {
      SUPABASE_URL: "https://x.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "sk-test",
    },
  });
  // Override fetch pra devolver 500
  globalThis.fetch = () =>
    Promise.resolve(new Response("boom", { status: 500 }));
  try {
    let exited: string | null = null;
    try {
      await runScript();
    } catch (e) {
      exited = (e as Error).message;
    }
    // Deve ter chamado Deno.exit(0) (nosso mock vira throw __exit__:0)
    assertEquals(exited, "__exit__:0");
  } finally {
    m.restore();
  }
});

Deno.test("skip silencioso quando relatório ausente", async () => {
  const m = installMocks({
    env: {
      SUPABASE_URL: "https://x.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "sk-test",
    },
    reportJson: null,
  });
  try {
    let exited: string | null = null;
    try {
      await runScript();
    } catch (e) {
      exited = (e as Error).message;
    }
    assertEquals(m.calls.length, 0);
    assertEquals(exited, "__exit__:0");
  } finally {
    m.restore();
  }
});
