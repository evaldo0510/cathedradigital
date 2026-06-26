/**
 * Pós-verificação automática de integridade do cânon após import/warmup.
 *
 * Dispara `bible-canon-diagnose?action=run` via `x-cron-secret` (não exige
 * sessão admin), conta achados bloqueantes (missing_book, missing_chapter,
 * empty_chapter) e registra a execução em `bible_audit_action_logs`.
 *
 * Nunca lança: retorna `passed=false` + `error` para o caller decidir o
 * comportamento (responder 200 com aviso ou falhar com 422).
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

export const BLOCKING_FINDING_TYPES = [
  "missing_book",
  "missing_chapter",
  "empty_chapter",
] as const;
export type BlockingFindingType = typeof BLOCKING_FINDING_TYPES[number];

export interface PostRunVerifyResult {
  ran: boolean;
  passed: boolean;
  run_id: string | null;
  duration_ms: number;
  total_findings: number;
  blocking: Record<BlockingFindingType, number>;
  error?: string;
}

export interface PostRunVerifyContext {
  trigger: "import" | "warmup" | "manual";
  metadata?: Record<string, unknown>;
}

const ZERO_BLOCKING: Record<BlockingFindingType, number> = {
  missing_book: 0,
  missing_chapter: 0,
  empty_chapter: 0,
};

function fail(reason: string, startedAt: number, runId: string | null = null, total = 0): PostRunVerifyResult {
  return {
    ran: runId !== null,
    passed: false,
    run_id: runId,
    duration_ms: Date.now() - startedAt,
    total_findings: total,
    blocking: { ...ZERO_BLOCKING },
    error: reason,
  };
}

export async function runPostRunVerify(ctx: PostRunVerifyContext): Promise<PostRunVerifyResult> {
  const t0 = Date.now();
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? SERVICE_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY || !CRON_SECRET) return fail("missing env", t0);

  try {
    const resp = await fetch(`${SUPABASE_URL}/functions/v1/bible-canon-diagnose`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cron-secret": CRON_SECRET,
        apikey: SERVICE_KEY,
      },
      body: JSON.stringify({ action: "run" }),
    });
    const payload = await resp.json().catch(() => ({} as Record<string, unknown>));
    const runId = typeof payload?.run_id === "string" ? (payload.run_id as string) : null;
    if (!resp.ok || !runId) {
      return fail(String(payload?.error ?? `diagnose http ${resp.status}`), t0, runId);
    }
    const totalFindings = Number(payload?.total_findings ?? 0);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data, error } = await admin
      .from("bible_diagnostic_findings")
      .select("finding_type")
      .eq("run_id", runId)
      .in("finding_type", BLOCKING_FINDING_TYPES as unknown as string[]);
    if (error) return fail(error.message, t0, runId, totalFindings);

    const blocking = { ...ZERO_BLOCKING };
    for (const row of (data ?? []) as Array<{ finding_type: BlockingFindingType }>) {
      blocking[row.finding_type] = (blocking[row.finding_type] ?? 0) + 1;
    }
    const passed = Object.values(blocking).every((n) => n === 0);
    const result: PostRunVerifyResult = {
      ran: true,
      passed,
      run_id: runId,
      duration_ms: Date.now() - t0,
      total_findings: totalFindings,
      blocking,
    };

    // Best-effort log (não bloqueia resposta em caso de erro RLS/insert)
    await admin
      .from("bible_audit_action_logs")
      .insert({
        action: "post_run_verify",
        entity_type: ctx.trigger,
        entity_id: runId,
        metadata: { ...result, ...(ctx.metadata ?? {}) },
      })
      .then(() => {}, () => {});

    return result;
  } catch (e) {
    return fail((e as Error).message ?? "unknown error", t0);
  }
}
