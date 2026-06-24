#!/usr/bin/env -S deno run --allow-read
/**
 * Valida que reports/edge/trend.json publicado tem o formato esperado
 * antes de subir como artifact do workflow.
 *
 * Schema:
 *   trend: Array<{
 *     runId: string (non-empty),
 *     timestamp: string ISO-8601 parseable,
 *     counts: {
 *       unknown_abbrev: int >= 0,
 *       chapter_unavailable: int >= 0,
 *       invalid_payload: int >= 0,
 *       other: int >= 0,
 *     },
 *     success: int >= 0,
 *   }>
 *
 * Exit 0 = válido (ou arquivo ausente — tolerado em runs sem smoke).
 * Exit 1 = arquivo presente mas inválido (falha o job).
 */
import { z } from "https://esm.sh/zod@3.23.8";

const TREND_FILE = "reports/edge/trend.json";

const intGte0 = z.number().int().nonnegative();

const TrendEntrySchema = z.object({
  runId: z.string().min(1),
  timestamp: z.string().refine(
    (s) => !Number.isNaN(Date.parse(s)),
    { message: "timestamp não é ISO-8601 parseável" },
  ),
  counts: z.object({
    unknown_abbrev: intGte0,
    chapter_unavailable: intGte0,
    invalid_payload: intGte0,
    other: intGte0,
  }).strict(),
  success: intGte0,
}).strict();

const TrendSchema = z.array(TrendEntrySchema).max(1000);

let raw: string;
try {
  raw = await Deno.readTextFile(TREND_FILE);
} catch {
  console.log(`[validate-trend] ${TREND_FILE} ausente — pulando validação`);
  Deno.exit(0);
}

let data: unknown;
try {
  data = JSON.parse(raw);
} catch (e) {
  console.error(`[validate-trend] JSON inválido em ${TREND_FILE}: ${(e as Error).message}`);
  Deno.exit(1);
}

const result = TrendSchema.safeParse(data);
if (!result.success) {
  console.error(`[validate-trend] Schema inválido em ${TREND_FILE}:`);
  for (const issue of result.error.issues) {
    console.error(`  - ${issue.path.join(".") || "(root)"}: ${issue.message}`);
  }
  Deno.exit(1);
}

console.log(`[validate-trend] OK — ${result.data.length} entradas válidas em ${TREND_FILE}`);
