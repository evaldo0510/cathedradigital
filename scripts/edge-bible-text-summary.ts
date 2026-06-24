#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env
/**
 * Lê todos os JSONs em reports/edge/ e gera:
 *  - resumo Markdown (contagem por tipo + link para artifacts)
 *  - gráfico ASCII de tendência por execução (timestamp embutido no nome do arquivo)
 *  - verificação de regressão (falha o job se erros críticos passarem do limite)
 *
 * Saída: reports/edge/SUMMARY.md e $GITHUB_STEP_SUMMARY.
 * Persiste também reports/edge/trend.json acumulando contagens por run.
 *
 * Env vars (opcionais):
 *   BIBLE_TEXT_MAX_UNKNOWN_ABBREV       (default 0)
 *   BIBLE_TEXT_MAX_CHAPTER_UNAVAILABLE  (default 0)
 *   BIBLE_TEXT_MAX_INVALID_PAYLOAD      (default 0)
 *   BIBLE_TEXT_MAX_OTHER                (default 0)
 *   GITHUB_RUN_ID, GITHUB_REPOSITORY, GITHUB_SERVER_URL
 */
import { classifyError } from "../supabase/functions/_shared/bibleTextSchema.factory.ts";

const REPORT_DIR = "reports/edge";
const TREND_FILE = `${REPORT_DIR}/trend.json`;
const CHART_HEIGHT = 6;
const TREND_KEEP = 20;

type ErrKind = "unknown_abbrev" | "chapter_unavailable" | "invalid_payload" | "other";
type Counter = Record<ErrKind, number>;

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
      else if (entry.name.endsWith(".json") && entry.name !== "trend.json") yield full;
    }
  } catch (_) { /* dir missing */ }
}

for await (const file of walk(REPORT_DIR)) {
  try {
    const raw = await Deno.readTextFile(file);
    const data = JSON.parse(raw);
    if (data?.error && !data?.book) {
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

// -------- Trend persistence --------
type TrendEntry = {
  runId: string;
  timestamp: string;
  counts: Counter;
  success: number;
};

let trend: TrendEntry[] = [];
try {
  trend = JSON.parse(await Deno.readTextFile(TREND_FILE));
  if (!Array.isArray(trend)) trend = [];
} catch (_) { trend = []; }

const runId = Deno.env.get("GITHUB_RUN_ID") ?? `local-${Date.now()}`;
const repo = Deno.env.get("GITHUB_REPOSITORY");
const server = Deno.env.get("GITHUB_SERVER_URL") ?? "https://github.com";
const artifactLink = Deno.env.get("GITHUB_RUN_ID") && repo
  ? `${server}/${repo}/actions/runs/${runId}#artifacts`
  : "(local run — sem link de artifact)";

const current: TrendEntry = {
  runId,
  timestamp: new Date().toISOString(),
  counts: { ...errorCounts },
  success: successCount,
};
trend.push(current);
trend = trend.slice(-TREND_KEEP);
await Deno.mkdir(REPORT_DIR, { recursive: true }).catch(() => {});
await Deno.writeTextFile(TREND_FILE, JSON.stringify(trend, null, 2));

// -------- ASCII chart --------
function chart(series: number[], label: string): string {
  if (series.length === 0) return `${label}: (sem dados)`;
  const max = Math.max(1, ...series);
  const lines: string[] = [];
  for (let row = CHART_HEIGHT; row >= 1; row--) {
    const threshold = (max * row) / CHART_HEIGHT;
    const line = series.map((v) => (v >= threshold ? "█" : " ")).join(" ");
    const axis = row === CHART_HEIGHT ? String(max).padStart(3) : "   ";
    lines.push(`${axis} │ ${line}`);
  }
  lines.push(`    └${"──".repeat(series.length)}`);
  lines.push(`      ${series.map((v) => String(v).padStart(1)).join(" ")}`);
  return ["```text", `${label} (últimas ${series.length} runs, máx=${max})`, ...lines, "```"].join("\n");
}

const seriesUnknown = trend.map((t) => t.counts.unknown_abbrev ?? 0);
const seriesChapter = trend.map((t) => t.counts.chapter_unavailable ?? 0);
const seriesInvalid = trend.map((t) => t.counts.invalid_payload ?? 0);
const seriesOther = trend.map((t) => t.counts.other ?? 0);

// -------- SVG chart (publicado como artifact junto do SUMMARY.md) --------
function buildSvg(): string {
  const W = 720, H = 280, PAD = 36;
  const N = trend.length || 1;
  const series: Array<{ name: string; color: string; data: number[] }> = [
    { name: "unknown_abbrev", color: "#C8A96A", data: seriesUnknown },
    { name: "chapter_unavailable", color: "#0B1F3A", data: seriesChapter },
    { name: "invalid_payload", color: "#a23b3b", data: seriesInvalid },
    { name: "other", color: "#6b7280", data: seriesOther },
  ];
  const maxY = Math.max(1, ...series.flatMap((s) => s.data));
  const xStep = (W - PAD * 2) / Math.max(1, N - 1);
  const yScale = (v: number) => H - PAD - (v / maxY) * (H - PAD * 2);
  const xPos = (i: number) => PAD + i * xStep;
  const paths = series.map((s) => {
    const d = s.data.length === 0
      ? ""
      : s.data.map((v, i) => `${i === 0 ? "M" : "L"}${xPos(i).toFixed(1)},${yScale(v).toFixed(1)}`).join(" ");
    return `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="2"/>`;
  }).join("");
  const legend = series.map((s, i) =>
    `<g transform="translate(${PAD + i * 160},${H - 10})"><rect width="10" height="10" fill="${s.color}"/><text x="14" y="9" font-size="11" font-family="sans-serif">${s.name}</text></g>`
  ).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <rect width="100%" height="100%" fill="#ffffff"/>
  <text x="${PAD}" y="20" font-family="sans-serif" font-size="13" fill="#0B1F3A">bible-text — erros por tipo (últimas ${N} runs, máx=${maxY})</text>
  <line x1="${PAD}" y1="${H - PAD}" x2="${W - PAD}" y2="${H - PAD}" stroke="#999"/>
  <line x1="${PAD}" y1="${PAD}" x2="${PAD}" y2="${H - PAD}" stroke="#999"/>
  ${paths}
  ${legend}
</svg>`;
}
await Deno.writeTextFile(`${REPORT_DIR}/trend-chart.svg`, buildSvg());

// -------- Regression check --------
const limits = {
  unknown_abbrev: Number(Deno.env.get("BIBLE_TEXT_MAX_UNKNOWN_ABBREV") ?? 0),
  chapter_unavailable: Number(Deno.env.get("BIBLE_TEXT_MAX_CHAPTER_UNAVAILABLE") ?? 0),
  invalid_payload: Number(Deno.env.get("BIBLE_TEXT_MAX_INVALID_PAYLOAD") ?? 0),
  other: Number(Deno.env.get("BIBLE_TEXT_MAX_OTHER") ?? 0),
};
const regressions: string[] = [];
(Object.keys(limits) as ErrKind[]).forEach((k) => {
  if (errorCounts[k] > limits[k]) {
    regressions.push(`- **${k}**: ${errorCounts[k]} > limite ${limits[k]}`);
  }
});
const regressed = regressions.length > 0;

const md = `## Edge \`bible-text\` — resumo da execução

**Sucessos:** ${successCount}
**Erros por tipo:**

| Tipo | Contagem | Limite | Status |
| --- | --- | --- | --- |
| Abreviação desconhecida | ${errorCounts.unknown_abbrev} | ${limits.unknown_abbrev} | ${errorCounts.unknown_abbrev > limits.unknown_abbrev ? "🚨 REGRESSÃO" : "✅"} |
| Capítulo indisponível | ${errorCounts.chapter_unavailable} | ${limits.chapter_unavailable} | ${errorCounts.chapter_unavailable > limits.chapter_unavailable ? "🚨 REGRESSÃO" : "✅"} |
| Payload inválido | ${errorCounts.invalid_payload} | ${limits.invalid_payload} | ${errorCounts.invalid_payload > limits.invalid_payload ? "🚨 REGRESSÃO" : "✅"} |
| Outros | ${errorCounts.other} | ${limits.other} | ${errorCounts.other > limits.other ? "🚨 REGRESSÃO" : "✅"} |

**Artifacts da run:** ${artifactLink}

> Gráfico SVG: \`reports/edge/trend-chart.svg\` (publicado como artifact \`edge-bible-text-chart-svg\`).

### Tendência (histórico acumulado em \`reports/edge/trend.json\`)

${chart(seriesUnknown, "unknown_abbrev")}

${chart(seriesChapter, "chapter_unavailable")}

${chart(seriesInvalid, "invalid_payload")}

${chart(seriesOther, "other")}

${regressed
  ? `### 🚨 Regressão detectada\n\n${regressions.join("\n")}\n\nAjuste \`BIBLE_TEXT_MAX_*\` no workflow ou corrija a origem dos erros.`
  : "### ✅ Sem regressão nos erros críticos"}

<details><summary>Detalhe por arquivo (${rows.length})</summary>

| Arquivo | Status | received_abbrev | bollsId | chapter | correlationId |
| --- | --- | --- | --- | --- | --- |
${rows.join("\n") || "| _nenhum_ | — | — | — | — | — |"}

</details>
`;

await Deno.writeTextFile(`${REPORT_DIR}/SUMMARY.md`, md);

const stepSummary = Deno.env.get("GITHUB_STEP_SUMMARY");
if (stepSummary) {
  await Deno.writeTextFile(stepSummary, md, { append: true });
  console.log("[summary] wrote GITHUB_STEP_SUMMARY");
} else {
  console.log(md);
}

if (regressed) {
  console.error(`[summary] regressão detectada:\n${regressions.join("\n")}`);
  Deno.exit(2);
}
