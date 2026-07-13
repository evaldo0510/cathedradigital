// Sprint A / CAT-001 — Relatório de conformidade CID (v2)
//
// Parseia `docs/EDGE-FUNCTIONS-COMPLIANCE-MATRIX.md` e agrega:
//   - Total por função com status de CID / VAL / HTTP / TEST
//   - Contagem por classe de conformidade (conforme, herdado, N/A, ausente)
//   - Contagem por CATEGORIA inferida do prefixo do nome
//   - Etapas que FALHARAM por função (CID gerado, propagado, validação Zod,
//     resposta padronizada, testes E2E)
//
// Saída:
//   artifacts/cid-compliance-report.md   (humano — usado no PR comment)
//   artifacts/cid-compliance-report.json (máquina — usado por CI/dashboards)
//
// Uso local:
//   deno run -A scripts/generate-cid-compliance-report.ts

const MATRIX_PATH = "docs/EDGE-FUNCTIONS-COMPLIANCE-MATRIX.md";
const OUT_DIR = "artifacts";

type CellClass = "conforme" | "herdado" | "na" | "ausente" | "desconhecido";

type Row = {
  index: number;
  name: string;
  category: string;
  cid: string;
  val: string;
  http: string;
  test: string;
  status: string;
  cidClass: CellClass;
  valClass: CellClass;
  httpClass: CellClass;
  testClass: CellClass;
  failedSteps: string[];
};

function classify(cell: string): CellClass {
  const s = cell.trim();
  if (s.startsWith("✅")) return "conforme";
  if (s.startsWith("🔒")) return "herdado";
  if (s.startsWith("➖")) return "na";
  if (s.startsWith("❌")) return "ausente";
  return "desconhecido";
}

function categoryOf(name: string): string {
  if (name.startsWith("bible-")) return "bible";
  if (name.startsWith("pcl-")) return "pcl";
  if (name.startsWith("mercadopago") || name.startsWith("mercado-pago")) return "mercadopago";
  if (name.startsWith("nexus-")) return "nexus";
  if (name === "colloquium" || name.startsWith("logos-") || name === "spiritual-continuity") return "ai";
  if (name.includes("notif") || name === "send-push" || name === "daily-streak-push") return "notifications";
  if (
    name === "sitemap" || name === "saint-of-the-day" || name === "search-saint" ||
    name === "catechism-text" || name === "liturgical-calendar" || name === "vatican-document" ||
    name === "elevenlabs-tts" || name === "translation-lookup" || name === "validate-coupon"
  ) return "content";
  return "misc";
}

async function main() {
  const raw = await Deno.readTextFile(MATRIX_PATH);
  const rows: Row[] = [];

  for (const line of raw.split("\n")) {
    if (!line.startsWith("| ")) continue;
    const cells = line.split("|").map((c) => c.trim());
    if (cells.length < 11) continue;
    const idx = Number(cells[1]);
    if (!Number.isFinite(idx)) continue;

    const name = cells[2];
    const cid = cells[3];
    const val = cells[4];
    const http = cells[8];
    const test = cells[9];
    const status = cells[10];

    const cidClass = classify(cid);
    const valClass = classify(val);
    const httpClass = classify(http);
    const testClass = classify(test);

    const failedSteps: string[] = [];
    if (cidClass === "ausente" || cidClass === "desconhecido")
      failedSteps.push("CID gerado/propagado");
    if (valClass === "ausente")
      failedSteps.push("Validação Zod");
    if (httpClass === "ausente")
      failedSteps.push("Resposta HTTP padronizada");
    if (testClass === "ausente")
      failedSteps.push("Cobertura E2E");

    rows.push({
      index: idx,
      name,
      category: categoryOf(name),
      cid, val, http, test, status,
      cidClass, valClass, httpClass, testClass,
      failedSteps,
    });
  }

  const total = rows.length;
  const byClass = (getter: (r: Row) => CellClass) => ({
    conforme: rows.filter((r) => getter(r) === "conforme").length,
    herdado: rows.filter((r) => getter(r) === "herdado").length,
    na: rows.filter((r) => getter(r) === "na").length,
    ausente: rows.filter((r) => getter(r) === "ausente").length,
    desconhecido: rows.filter((r) => getter(r) === "desconhecido").length,
  });

  const cidCounts = byClass((r) => r.cidClass);
  const valCounts = byClass((r) => r.valClass);
  const httpCounts = byClass((r) => r.httpClass);
  const testCounts = byClass((r) => r.testClass);

  const byCategory: Record<string, { total: number; cidOk: number; failed: number }> = {};
  for (const r of rows) {
    const c = (byCategory[r.category] ??= { total: 0, cidOk: 0, failed: 0 });
    c.total++;
    if (r.cidClass === "conforme" || r.cidClass === "herdado") c.cidOk++;
    if (r.failedSteps.length > 0) c.failed++;
  }

  const cidCoverage = total === 0 ? 0 : (cidCounts.conforme + cidCounts.herdado) / total;
  const passed = cidCounts.ausente === 0 && cidCounts.desconhecido === 0;

  const meta = {
    generated_at: new Date().toISOString(),
    matrix_source: MATRIX_PATH,
    total_functions: total,
    cid_counts: cidCounts,
    validation_counts: valCounts,
    http_counts: httpCounts,
    test_counts: testCounts,
    by_category: byCategory,
    coverage_ratio: Number(cidCoverage.toFixed(4)),
    coverage_pct: `${(cidCoverage * 100).toFixed(1)}%`,
    passed,
  };

  await Deno.mkdir(OUT_DIR, { recursive: true });

  const md: string[] = [];
  md.push(`# Relatório de conformidade CID — Edge Functions`);
  md.push("");
  md.push(`- **Gerado em:** \`${meta.generated_at}\``);
  md.push(`- **Fonte:** \`${MATRIX_PATH}\``);
  md.push(`- **Total de funções:** **${total}**`);
  md.push(`- **Cobertura CID:** **${meta.coverage_pct}**`);
  md.push(`- **Resultado:** ${passed ? "🟢 PASSOU" : "🔴 FALHOU"}`);
  md.push("");

  md.push(`## Contagem por dimensão`);
  md.push("");
  md.push(`| Dimensão | ✅ conforme | 🔒 herdado | ➖ N/A | ❌ ausente | ⚠️ ? |`);
  md.push(`|---|---:|---:|---:|---:|---:|`);
  const line = (label: string, c: ReturnType<typeof byClass>) =>
    `| ${label} | ${c.conforme} | ${c.herdado} | ${c.na} | ${c.ausente} | ${c.desconhecido} |`;
  md.push(line("CID (CAT-001)", cidCounts));
  md.push(line("Validação Zod (CAT-002)", valCounts));
  md.push(line("HTTP padronizado (CAT-008)", httpCounts));
  md.push(line("Cobertura E2E", testCounts));
  md.push("");

  md.push(`## Contagem por categoria`);
  md.push("");
  md.push(`| Categoria | Total | CID OK | Com falha |`);
  md.push(`|---|---:|---:|---:|`);
  for (const [cat, c] of Object.entries(byCategory).sort()) {
    md.push(`| ${cat} | ${c.total} | ${c.cidOk} | ${c.failed} |`);
  }
  md.push("");

  const failing = rows.filter((r) => r.failedSteps.length > 0);
  if (failing.length > 0) {
    md.push(`## ⚠️ Funções com etapas em falha (${failing.length})`);
    md.push("");
    md.push(`| Função | Categoria | Etapas em falha |`);
    md.push(`|---|---|---|`);
    for (const r of failing) {
      md.push(`| \`${r.name}\` | ${r.category} | ${r.failedSteps.join(", ")} |`);
    }
    md.push("");
  } else {
    md.push(`> ✅ Nenhuma função com etapas em falha detectadas na matriz.`);
    md.push("");
  }

  md.push(`## Detalhamento por função`);
  md.push("");
  md.push(`| # | Função | Cat | CID | VAL | HTTP | TEST | Status |`);
  md.push(`|---|---|---|---|---|---|---|---|`);
  for (const r of rows) {
    md.push(`| ${r.index} | ${r.name} | ${r.category} | ${r.cid} | ${r.val} | ${r.http} | ${r.test} | ${r.status} |`);
  }
  md.push("");

  await Deno.writeTextFile(`${OUT_DIR}/cid-compliance-report.md`, md.join("\n"));
  await Deno.writeTextFile(
    `${OUT_DIR}/cid-compliance-report.json`,
    JSON.stringify({ meta, rows }, null, 2),
  );

  // Resumo curto para o PR comment (primeiras seções apenas)
  const summary: string[] = [];
  summary.push(`### Relatório CID — ${passed ? "🟢 PASSOU" : "🔴 FALHOU"}`);
  summary.push("");
  summary.push(`Cobertura CID: **${meta.coverage_pct}** · Funções: **${total}** · Etapas em falha: **${failing.length}**`);
  summary.push("");
  summary.push(`| Dim | ✅ | 🔒 | ➖ | ❌ |`);
  summary.push(`|---|---:|---:|---:|---:|`);
  summary.push(`| CID | ${cidCounts.conforme} | ${cidCounts.herdado} | ${cidCounts.na} | ${cidCounts.ausente} |`);
  summary.push(`| VAL | ${valCounts.conforme} | ${valCounts.herdado} | ${valCounts.na} | ${valCounts.ausente} |`);
  summary.push(`| HTTP | ${httpCounts.conforme} | ${httpCounts.herdado} | ${httpCounts.na} | ${httpCounts.ausente} |`);
  summary.push(`| TEST | ${testCounts.conforme} | ${testCounts.herdado} | ${testCounts.na} | ${testCounts.ausente} |`);
  summary.push("");
  if (failing.length > 0) {
    summary.push(`<details><summary>⚠️ ${failing.length} funções com etapas em falha</summary>`);
    summary.push("");
    for (const r of failing.slice(0, 20)) {
      summary.push(`- \`${r.name}\` (${r.category}): ${r.failedSteps.join(", ")}`);
    }
    if (failing.length > 20) summary.push(`- … +${failing.length - 20}`);
    summary.push("");
    summary.push(`</details>`);
  }
  summary.push("");
  summary.push(`> Relatório completo anexado como artefato \`cid-compliance-report\`.`);

  await Deno.writeTextFile(`${OUT_DIR}/cid-compliance-summary.md`, summary.join("\n"));

  console.log(
    `[cid-report] total=${total} cid_ok=${cidCounts.conforme + cidCounts.herdado} ausente=${cidCounts.ausente} falhas_por_função=${failing.length} cobertura=${meta.coverage_pct}`,
  );

  // Modo estrito (--strict ou env CID_STRICT=1): exit 1 se CID ausente
  // ou funções com etapas em falha. Usado como GATE no workflow, DEPOIS
  // que o artefato/summary já foram escritos.
  const strict = Deno.args.includes('--strict') || Deno.env.get('CID_STRICT') === '1';
  if (!passed || failing.length > 0) {
    console.error(`::error::[cid-report] CID ausente=${cidCounts.ausente} · funções em falha=${failing.length}`);
    for (const r of failing.slice(0, 50)) {
      console.error(`::error file=${MATRIX_PATH}::${r.name} (${r.category}) — ${r.failedSteps.join(', ')}`);
    }
    if (strict) Deno.exit(1);
  }
}

if (import.meta.main) await main();
