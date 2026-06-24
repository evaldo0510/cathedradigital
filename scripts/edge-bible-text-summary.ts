#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env
/**
 * Lê todos os JSONs em reports/edge/ e gera um resumo Markdown
 * (contagem de erros por tipo + link para artifacts da run) que é
 * escrito em $GITHUB_STEP_SUMMARY e em reports/edge/SUMMARY.md.
 */
import { classifyError } from "../supabase/functions/_shared/bibleTextSchema.ts";

const REPORT_DIR = "reports/edge";

type Counter = Record<string, number>;
const errorCounts: Counter = {
  unknown_abbrev: 0,
  chapter_unavailable: 0,
  invalid_payload: 0,
  other: 0,
};
let successCount = 0;
const rows: string[] = [];

async function* walk(dir: string): AsyncGenerator<string> {
  try {
    for await (const entry of Deno.readDir(dir)) {
      const full = `${dir}/${entry.name}`;
      if (entry.isDirectory) yield* walk(full);
      else if (entry.name.endsWith(".json")) yield full;
    }
  } catch (_) { /* dir missing */ }
}

for await (const file of walk(REPORT_DIR)) {
  try {
    const raw = await Deno.readTextFile(file);
    const data = JSON.parse(raw);
    if (data?.error) {
      const kind = classifyError(data.reason);
      errorCounts[kind]++;
      rows.push(`| \`${file}\` | ❌ ${kind} | ${data.received_abbrev ?? "?"} | ${data.bollsId ?? "—"} | ${data.chapter ?? "?"} | ${data.correlationId ?? ""} |`);
    } else if (data?.book && Array.isArray(data?.verses)) {
      successCount++;
      rows.push(`| \`${file}\` | ✅ ok | ${data.metadata?.received_abbrev ?? "?"} | ${data.metadata?.bollsId ?? "—"} | ${data.chapter} | ${data.metadata?.correlationId ?? ""} |`);
    }
  } catch (e) {
    rows.push(`| \`${file}\` | ⚠️ parse_error | — | — | — | ${(e as Error).message} |`);
  }
}

const runId = Deno.env.get("GITHUB_RUN_ID");
const repo = Deno.env.get("GITHUB_REPOSITORY");
const server = Deno.env.get("GITHUB_SERVER_URL") ?? "https://github.com";
const artifactLink = runId && repo
  ? `${server}/${repo}/actions/runs/${runId}#artifacts`
  : "(local run — sem link de artifact)";

const md = `## Edge \`bible-text\` — resumo da execução

**Sucessos:** ${successCount}
**Erros por tipo:**

| Tipo | Contagem |
| --- | --- |
| Abreviação desconhecida | ${errorCounts.unknown_abbrev} |
| Capítulo indisponível | ${errorCounts.chapter_unavailable} |
| Payload inválido | ${errorCounts.invalid_payload} |
| Outros | ${errorCounts.other} |

**Artifacts da run:** ${artifactLink}

<details><summary>Detalhe por arquivo (${rows.length})</summary>

| Arquivo | Status | received_abbrev | bollsId | chapter | correlationId |
| --- | --- | --- | --- | --- | --- |
${rows.join("\n") || "| _nenhum_ | — | — | — | — | — |"}

</details>
`;

await Deno.mkdir(REPORT_DIR, { recursive: true }).catch(() => {});
await Deno.writeTextFile(`${REPORT_DIR}/SUMMARY.md`, md);

const stepSummary = Deno.env.get("GITHUB_STEP_SUMMARY");
if (stepSummary) {
  await Deno.writeTextFile(stepSummary, md, { append: true });
  console.log("[summary] wrote GITHUB_STEP_SUMMARY");
} else {
  console.log(md);
}
