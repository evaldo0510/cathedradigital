// Sprint A / CAT-001 — Persistência de snapshot do cid-compliance-report
// Lê artifacts/cid-compliance-report.json e faz INSERT em
// public.cid_compliance_snapshots via SUPABASE_SERVICE_ROLE_KEY.
//
// Rodado no CI depois de generate-cid-compliance-report.ts.
// Skip silencioso se SERVICE_ROLE ausente.

const REPORT_PATH = 'artifacts/cid-compliance-report.json';

async function main() {
  const url = Deno.env.get('VITE_SUPABASE_URL') ?? Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) {
    console.warn('[cid-snapshot] SERVICE_ROLE ausente — persistência ignorada.');
    return;
  }

  let raw: string;
  try { raw = await Deno.readTextFile(REPORT_PATH); }
  catch { console.error(`[cid-snapshot] ${REPORT_PATH} ausente`); Deno.exit(0); }

  const doc = JSON.parse(raw) as { meta: Record<string, unknown>; rows: unknown[] };
  const meta = doc.meta as any;
  const rows = doc.rows as any[];
  const failing = rows.filter((r) => Array.isArray(r.failedSteps) && r.failedSteps.length > 0)
    .map((r) => ({ name: r.name, category: r.category, failed_steps: r.failedSteps }));

  const commit = Deno.env.get('GITHUB_SHA') ?? null;
  const branch = Deno.env.get('GITHUB_REF_NAME') ?? Deno.env.get('GITHUB_HEAD_REF') ?? null;

  const payload = {
    commit_sha: commit,
    branch,
    total_functions: meta.total_functions,
    coverage_ratio: meta.coverage_ratio,
    coverage_pct: meta.coverage_pct,
    cid_counts: meta.cid_counts,
    validation_counts: meta.validation_counts,
    http_counts: meta.http_counts,
    test_counts: meta.test_counts,
    by_category: meta.by_category,
    failing_functions: failing,
    passed: meta.passed,
  };

  const res = await fetch(`${url}/rest/v1/cid_compliance_snapshots`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    console.error(`[cid-snapshot] INSERT falhou: ${res.status} ${await res.text()}`);
    Deno.exit(0); // não bloqueia CI
  }
  console.log(`[cid-snapshot] snapshot persistido (sha=${commit?.slice(0,7)} branch=${branch})`);
}

if (import.meta.main) await main();
