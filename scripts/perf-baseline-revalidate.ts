/**
 * Sprint B — Revalidação de baseline
 * ---------------------------------------------------------------
 * Compara uma captura nova (mesmo formato de perf-baseline-snapshot)
 * com `docs/perf-baselines/latest.json` e reporta drift.
 *
 * Drift é considerado significativo quando:
 *   - assinatura de plano mudou (índice/sort/tipo de nó), OU
 *   - custo total variou > DRIFT_COST_PCT (default 30 %), OU
 *   - execution_ms variou > DRIFT_TIME_PCT (default 50 %).
 *
 * Uso típico após mudança de schema / ANALYZE:
 *   PG_URL=... PERF_BASELINE=1 bunx tsx scripts/perf-baseline-snapshot.ts
 *   bunx tsx scripts/perf-baseline-revalidate.ts
 *
 * Sai com código 1 quando há drift — plugável em CI.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dir = join(process.cwd(), 'docs', 'perf-baselines');
const latestPath = join(dir, 'latest.json');
if (!existsSync(latestPath)) {
  console.error('[revalidate] docs/perf-baselines/latest.json ausente.');
  process.exit(2);
}

const COST_PCT = Number(process.env.DRIFT_COST_PCT ?? 30);
const TIME_PCT = Number(process.env.DRIFT_TIME_PCT ?? 50);

const latest = JSON.parse(readFileSync(latestPath, 'utf8'));
const prevPath = process.argv[2] ?? join(dir, 'previous.json');
if (!existsSync(prevPath)) {
  console.log(
    `[revalidate] sem baseline anterior em ${prevPath}; nada a comparar.`,
  );
  process.exit(0);
}
const prev = JSON.parse(readFileSync(prevPath, 'utf8'));

const prevMap = new Map<string, any>(prev.entries.map((e: any) => [e.name, e]));
const drifts: string[] = [];

for (const cur of latest.entries) {
  const p = prevMap.get(cur.name);
  if (!p) {
    drifts.push(`+ novo: ${cur.name}`);
    continue;
  }
  if (p.signature !== cur.signature) {
    drifts.push(
      `~ plano ${cur.name}\n    antes:  ${p.signature}\n    depois: ${cur.signature}`,
    );
  }
  const costDelta = ((cur.total_cost - p.total_cost) / Math.max(1, p.total_cost)) * 100;
  if (Math.abs(costDelta) > COST_PCT) {
    drifts.push(
      `~ custo ${cur.name}: ${p.total_cost} → ${cur.total_cost} (${costDelta.toFixed(1)} %)`,
    );
  }
  const timeDelta = ((cur.execution_ms - p.execution_ms) / Math.max(0.1, p.execution_ms)) * 100;
  if (Math.abs(timeDelta) > TIME_PCT) {
    drifts.push(
      `~ tempo ${cur.name}: ${p.execution_ms.toFixed(2)}ms → ${cur.execution_ms.toFixed(2)}ms (${timeDelta.toFixed(1)} %)`,
    );
  }
}

if (drifts.length === 0) {
  console.log('[revalidate] nenhum drift acima dos limiares.');
  process.exit(0);
}

console.error(`[revalidate] DRIFT detectado (${drifts.length}):`);
for (const d of drifts) console.error('  ' + d);
process.exit(1);
