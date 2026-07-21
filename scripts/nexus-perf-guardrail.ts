/**
 * nexus-perf-guardrail — falha o CI se a performance dos adapters do
 * Nexus (glossaryAutoNexus / journeyAutoNexus) regredir além dos
 * limites configurados em relação ao baseline versionado.
 *
 * Cenário reproduzível:
 *   • N verbetes sintéticos passam pelo `resolveAutoNexus`.
 *   • M jornadas sintéticas passam pelo `resolveJourneyAutoNexus`.
 *   • Cada input é resolvido REP vezes → 1 miss + (REP-1) hits por input.
 *
 * Métricas monitoradas por adapter:
 *   • hitRate ∈ [0,1]  — queda máx: NEXUS_PERF_HIT_RATE_TOLERANCE (default 5pp)
 *   • avgMs            — piora máx: NEXUS_PERF_AVG_MS_TOLERANCE_PCT (default 20%)
 *
 * Uso:
 *   bun scripts/nexus-perf-guardrail.ts            # verifica vs. baseline
 *   bun scripts/nexus-perf-guardrail.ts --update   # regrava baseline
 *
 * Baseline: `.nexus-perf-baseline.json` na raiz.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  resolveAutoNexus,
  clearAutoNexusCache,
  type GlossaryLike,
} from '../src/core/knowledge/adapters/glossaryAutoNexus';
import {
  resolveJourneyAutoNexus,
  clearJourneyAutoNexusCache,
  type JourneyLike,
} from '../src/core/knowledge/adapters/journeyAutoNexus';
import {
  getNexusMetricsSnapshot,
  resetNexusMetrics,
  hitRate,
  type AdapterMetrics,
} from '../src/core/knowledge/adapters/nexusMetrics';

/* ----------------------------- config ----------------------------- */

const BASELINE_PATH = resolve(process.cwd(), '.nexus-perf-baseline.json');
const N_GLOSSARY = Number(process.env.NEXUS_PERF_N_GLOSSARY ?? 20);
const N_JOURNEY = Number(process.env.NEXUS_PERF_N_JOURNEY ?? 20);
const REPETITIONS = Number(process.env.NEXUS_PERF_REPS ?? 5);
const HIT_RATE_TOLERANCE_PP = Number(
  process.env.NEXUS_PERF_HIT_RATE_TOLERANCE ?? 5,
);
const AVG_MS_TOLERANCE_PCT = Number(
  process.env.NEXUS_PERF_AVG_MS_TOLERANCE_PCT ?? 20,
);

interface AdapterReport {
  hits: number;
  misses: number;
  hitRate: number;
  avgMs: number;
  lastMs: number;
}

interface Baseline {
  generatedAt: string;
  config: {
    nGlossary: number;
    nJourney: number;
    repetitions: number;
  };
  adapters: {
    glossary: AdapterReport;
    journey: AdapterReport;
  };
}

/* ---------------------------- scenarios --------------------------- */

function synthesizeGlossaries(n: number): GlossaryLike[] {
  const out: GlossaryLike[] = [];
  for (let i = 0; i < n; i++) {
    out.push({
      slug: `verbete-${i}`,
      term: `Verbete ${i}`,
      short_definition: `Definição sintética ${i}`,
      bible_verses: [`Gn ${i + 1},1`, `Sl ${i + 2},3`],
      catechism_references: [String(1000 + i), String(2000 + i)],
      magisterium_references: [],
      saints_refs: [`santo-${i}`],
      fathers_refs: [],
      liturgy_refs: [],
      prayer_refs: [],
      journey_refs: [],
      nexus_refs: [{ kind: 'catechism', target: String(1500 + i) }],
    });
  }
  return out;
}

function synthesizeJourneys(n: number): JourneyLike[] {
  const out: JourneyLike[] = [];
  for (let i = 0; i < n; i++) {
    out.push({
      id: `jrn-${i}`,
      title: `Jornada ${i}`,
      subtitle: `Introdução ${i}`,
      category: i % 2 === 0 ? 'espiritualidade' : 'doutrina',
      tags: [`tag-${i}`, `tema-${i % 5}`],
    });
  }
  return out;
}

function toReport(m: AdapterMetrics): AdapterReport {
  return {
    hits: m.hits,
    misses: m.misses,
    hitRate: Number(hitRate(m).toFixed(4)),
    avgMs: Number(m.avgMs.toFixed(4)),
    lastMs: Number(m.lastMs.toFixed(4)),
  };
}

function runScenario(): Baseline {
  clearAutoNexusCache();
  clearJourneyAutoNexusCache();
  resetNexusMetrics();

  const glossaries = synthesizeGlossaries(N_GLOSSARY);
  const journeys = synthesizeJourneys(N_JOURNEY);

  for (let r = 0; r < REPETITIONS; r++) {
    for (const g of glossaries) resolveAutoNexus(g);
    for (const j of journeys) resolveJourneyAutoNexus(j);
  }

  const snap = getNexusMetricsSnapshot();
  return {
    generatedAt: new Date().toISOString(),
    config: {
      nGlossary: N_GLOSSARY,
      nJourney: N_JOURNEY,
      repetitions: REPETITIONS,
    },
    adapters: {
      glossary: toReport(snap.glossary),
      journey: toReport(snap.journey),
    },
  };
}

/* ----------------------------- guardrail -------------------------- */

interface Violation {
  adapter: 'glossary' | 'journey';
  metric: 'hitRate' | 'avgMs';
  baseline: number;
  current: number;
  toleranceHint: string;
}

function compare(current: AdapterReport, base: AdapterReport, adapter: 'glossary' | 'journey'): Violation[] {
  const violations: Violation[] = [];

  const hitDrop = (base.hitRate - current.hitRate) * 100; // em pontos percentuais
  if (hitDrop > HIT_RATE_TOLERANCE_PP) {
    violations.push({
      adapter,
      metric: 'hitRate',
      baseline: base.hitRate,
      current: current.hitRate,
      toleranceHint: `queda de ${hitDrop.toFixed(2)}pp excede ${HIT_RATE_TOLERANCE_PP}pp`,
    });
  }

  // Só compara avgMs se o baseline for mensurável (evita divisão instável quando ~0ms).
  const MIN_BASELINE_MS = 0.05;
  if (base.avgMs >= MIN_BASELINE_MS) {
    const growthPct = ((current.avgMs - base.avgMs) / base.avgMs) * 100;
    if (growthPct > AVG_MS_TOLERANCE_PCT) {
      violations.push({
        adapter,
        metric: 'avgMs',
        baseline: base.avgMs,
        current: current.avgMs,
        toleranceHint: `crescimento de ${growthPct.toFixed(1)}% excede ${AVG_MS_TOLERANCE_PCT}%`,
      });
    }
  }

  return violations;
}

/* -------------------------------- main ---------------------------- */

const args = process.argv.slice(2);
const shouldUpdate = args.includes('--update');

const current = runScenario();

if (shouldUpdate) {
  writeFileSync(BASELINE_PATH, JSON.stringify(current, null, 2) + '\n', 'utf8');
  console.log(`[nexus-perf] baseline regravado em ${BASELINE_PATH}`);
  console.log(JSON.stringify(current, null, 2));
  process.exit(0);
}

if (!existsSync(BASELINE_PATH)) {
  console.warn(
    `[nexus-perf] baseline ausente em ${BASELINE_PATH}. Rode com --update para criar. Passando este build.`,
  );
  console.log(JSON.stringify(current, null, 2));
  process.exit(0);
}

const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8')) as Baseline;

const violations = [
  ...compare(current.adapters.glossary, baseline.adapters.glossary, 'glossary'),
  ...compare(current.adapters.journey, baseline.adapters.journey, 'journey'),
];

console.log('[nexus-perf] baseline:', JSON.stringify(baseline.adapters, null, 2));
console.log('[nexus-perf] current :', JSON.stringify(current.adapters, null, 2));

if (violations.length > 0) {
  console.error('\n❌ Regressão de performance do Nexus detectada:');
  for (const v of violations) {
    console.error(
      `  • ${v.adapter}.${v.metric}: baseline=${v.baseline} → atual=${v.current} — ${v.toleranceHint}`,
    );
  }
  console.error(
    '\nSe a regressão for esperada e aceitável, regrave o baseline: bun scripts/nexus-perf-guardrail.ts --update',
  );
  process.exit(1);
}

console.log('\n✔ Nexus dentro dos limites de performance.');
