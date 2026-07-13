// Sprint A / CAT-001 — Relatório de conformidade CID
//
// Gera um relatório consolidado sobre `correlation_id` a partir de:
//   1. Parse da matriz `docs/EDGE-FUNCTIONS-COMPLIANCE-MATRIX.md`
//   2. Contagem de funções por status CID (✅ / ❌ / 🔒 / ➖)
//
// Saída:
//   - artifacts/cid-compliance-report.md  (humano)
//   - artifacts/cid-compliance-report.json (máquina)
//
// Uso local:
//   deno run -A scripts/generate-cid-compliance-report.ts
//
// CI: anexado como artefato do workflow edge-cid-smoke.

const MATRIX_PATH = "docs/EDGE-FUNCTIONS-COMPLIANCE-MATRIX.md";
const OUT_DIR = "artifacts";

type Row = {
  index: number;
  name: string;
  cid: string;
  status: string;
  cidClass: "conforme" | "herdado" | "na" | "ausente" | "desconhecido";
};

function classify(cid: string): Row["cidClass"] {
  const s = cid.trim();
  if (s.startsWith("✅")) return "conforme";
  if (s.startsWith("🔒")) return "herdado";
  if (s.startsWith("➖")) return "na";
  if (s.startsWith("❌")) return "ausente";
  return "desconhecido";
}

async function main() {
  const raw = await Deno.readTextFile(MATRIX_PATH);
  const lines = raw.split("\n");
  const rows: Row[] = [];

  for (const line of lines) {
    // Linha de dados: | 1 | bible-abbr-validate | ✅ A1.a | ... |
    if (!line.startsWith("| ")) continue;
    const cells = line.split("|").map((c) => c.trim());
    // ["", "#", "Função", "CID", "VAL", "AUTHN", "AUTHZ", "RATE", "HTTP", "TEST", "Status", ""]
    if (cells.length < 11) continue;
    const idx = Number(cells[1]);
    if (!Number.isFinite(idx)) continue;
    rows.push({
      index: idx,
      name: cells[2],
      cid: cells[3],
      status: cells[10],
      cidClass: classify(cells[3]),
    });
  }

  const total = rows.length;
  const counts = {
    conforme: rows.filter((r) => r.cidClass === "conforme").length,
    herdado: rows.filter((r) => r.cidClass === "herdado").length,
    na: rows.filter((r) => r.cidClass === "na").length,
    ausente: rows.filter((r) => r.cidClass === "ausente").length,
    desconhecido: rows.filter((r) => r.cidClass === "desconhecido").length,
  };
  const cobertura = total === 0 ? 0 : (counts.conforme + counts.herdado) / total;

  const meta = {
    generated_at: new Date().toISOString(),
    matrix_source: MATRIX_PATH,
    total_functions: total,
    counts,
    coverage_ratio: Number(cobertura.toFixed(4)),
    coverage_pct: `${(cobertura * 100).toFixed(1)}%`,
    goal: "100% CID (conforme + herdado)",
    passed: counts.ausente === 0 && counts.desconhecido === 0,
  };

  await Deno.mkdir(OUT_DIR, { recursive: true });

  const md: string[] = [];
  md.push(`# Relatório de conformidade CID — Edge Functions`);
  md.push("");
  md.push(`- Gerado em: \`${meta.generated_at}\``);
  md.push(`- Fonte: \`${MATRIX_PATH}\``);
  md.push(`- Total de funções: **${total}**`);
  md.push(`- Cobertura CID: **${meta.coverage_pct}** (meta ${meta.goal})`);
  md.push(`- Resultado: ${meta.passed ? "🟢 PASSOU" : "🔴 FALHOU"}`);
  md.push("");
  md.push(`## Contagem por classe`);
  md.push("");
  md.push(`| Classe | Qtde |`);
  md.push(`|---|---|`);
  md.push(`| ✅ conforme | ${counts.conforme} |`);
  md.push(`| 🔒 herdado (helper) | ${counts.herdado} |`);
  md.push(`| ➖ N/A justificado | ${counts.na} |`);
  md.push(`| ❌ ausente | ${counts.ausente} |`);
  md.push(`| ⚠️ indeterminado | ${counts.desconhecido} |`);
  md.push("");
  md.push(`## Detalhamento por função`);
  md.push("");
  md.push(`| # | Função | CID | Status |`);
  md.push(`|---|---|---|---|`);
  for (const r of rows) {
    md.push(`| ${r.index} | ${r.name} | ${r.cid} | ${r.status} |`);
  }
  md.push("");
  if (!meta.passed) {
    md.push(`## ⚠️ Itens em aberto`);
    md.push("");
    for (const r of rows.filter((x) => x.cidClass === "ausente" || x.cidClass === "desconhecido")) {
      md.push(`- **${r.name}** — CID: \`${r.cid}\``);
    }
  }

  await Deno.writeTextFile(`${OUT_DIR}/cid-compliance-report.md`, md.join("\n"));
  await Deno.writeTextFile(
    `${OUT_DIR}/cid-compliance-report.json`,
    JSON.stringify({ meta, rows }, null, 2),
  );

  console.log(`[cid-report] total=${total} conforme=${counts.conforme} herdado=${counts.herdado} ausente=${counts.ausente} cobertura=${meta.coverage_pct}`);
  if (!meta.passed) {
    console.error(`[cid-report] FAIL — há funções sem CID`);
    Deno.exit(1);
  }
}

if (import.meta.main) await main();
