/**
 * Benchmark headless do normalizador do Catecismo para uso em CI.
 *
 * Falha (exit 1) se algum budget for excedido.
 *
 * Budgets padrão:
 *  - PER_PARAGRAPH_MS = 2   (média por parágrafo)
 *  - BATCH_50_MS      = 100 (lote de 50 parágrafos — janela do Reader)
 *
 * Overrides via env: NORM_BUDGET_PER_MS, NORM_BUDGET_BATCH_MS, NORM_ITERATIONS
 */
import {
  normalizeCatechismText,
  normalizeCatechismTextWithReport,
} from '../src/lib/catechismTextNormalizer';

const PER_MS = Number(process.env.NORM_BUDGET_PER_MS ?? 2);
const BATCH_MS = Number(process.env.NORM_BUDGET_BATCH_MS ?? 100);
const ITERATIONS = Number(process.env.NORM_ITERATIONS ?? 200);

const SAMPLE = (
  '\uFEFFA Igreja12 é sagrada.Ela ensina  a fé.\r\n\r\n\r\n' +
  'Os sinais são: – primeiro; – segundo; – terceiro. ' +
  'Cristo\u00A0Senhor  reina , eternamente .\n\n' +
  '"Bendito seja Deus", diz o salmo.'
).repeat(20);

function bench(label: string, fn: () => void, iters: number) {
  for (let i = 0; i < 10; i++) fn(); // warmup
  const t0 = performance.now();
  for (let i = 0; i < iters; i++) fn();
  const total = performance.now() - t0;
  const avg = total / iters;
  console.log(
    `[bench] ${label}: avg=${avg.toFixed(3)}ms  total=${total.toFixed(1)}ms  iters=${iters}`
  );
  return { avg, total };
}

const perParagraph = bench('normalize (per §)', () => normalizeCatechismText(SAMPLE), ITERATIONS);
const perParagraphReport = bench(
  'normalize+report (per §)',
  () => normalizeCatechismTextWithReport(SAMPLE),
  ITERATIONS
);
const batch = bench(
  'normalize x50 (batch)',
  () => {
    for (let i = 0; i < 50; i++) normalizeCatechismText(SAMPLE);
  },
  Math.max(10, Math.floor(ITERATIONS / 10))
);

const failures: string[] = [];
if (perParagraph.avg > PER_MS)
  failures.push(`per-paragraph ${perParagraph.avg.toFixed(3)}ms > budget ${PER_MS}ms`);
if (perParagraphReport.avg > PER_MS * 2.5)
  failures.push(
    `per-paragraph+report ${perParagraphReport.avg.toFixed(3)}ms > budget ${(PER_MS * 2.5).toFixed(2)}ms`
  );
if (batch.avg > BATCH_MS)
  failures.push(`batch(50) ${batch.avg.toFixed(3)}ms > budget ${BATCH_MS}ms`);

if (failures.length > 0) {
  console.error('\n❌ Benchmark do normalizador estourou o budget:');
  for (const f of failures) console.error('  - ' + f);
  process.exit(1);
}

console.log(`\n✅ Normalizador dentro do budget (${PER_MS}ms/§, ${BATCH_MS}ms/lote-50).`);
