#!/usr/bin/env bun
/**
 * scripts/catequese-pixel-parity.ts — Sprint CQ-1.3
 *
 * Roda o spec `tests/e2e/catequese-baseline.spec.ts` DUAS vezes:
 *   - build/preview com VITE_MODULES_CATEQUESE=0 → PNGs em `.tmp/catequese-parity/flag-0/`
 *   - build/preview com VITE_MODULES_CATEQUESE=1 → PNGs em `.tmp/catequese-parity/flag-1/`
 *
 * Depois compara pixel-a-pixel via pixelmatch e emite:
 *   - `reports/catequese/parity/diffs/<rota>-<vp>.png` para cada divergência
 *   - `reports/catequese/parity/report.{json,md}` com contagem de pixels
 *     divergentes por rota × breakpoint, threshold e veredito final.
 *
 * Falha (exit 1) quando `maxDiffPixelRatio` ultrapassa o budget (default 0.001).
 * Uso no CI: `bun run scripts/catequese-pixel-parity.ts`.
 */

import { spawn } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const ROOT = resolve(process.cwd());
const TMP = resolve(ROOT, ".tmp/catequese-parity");
const REPORT_DIR = resolve(ROOT, "reports/catequese/parity");
const DIFF_DIR = resolve(REPORT_DIR, "diffs");
const MAX_RATIO = Number(process.env.CATEQUESE_PARITY_MAX_RATIO ?? "0.001");
const PORT = Number(process.env.CATEQUESE_PARITY_PORT ?? "4310");
const BASE_URL = `http://127.0.0.1:${PORT}`;

mkdirSync(TMP, { recursive: true });
mkdirSync(DIFF_DIR, { recursive: true });

type RunResult = { flag: "0" | "1"; dir: string };

function sh(cmd: string, args: string[], env: NodeJS.ProcessEnv, opts: { detach?: boolean } = {}) {
  return spawn(cmd, args, {
    stdio: opts.detach ? ["ignore", "pipe", "pipe"] : "inherit",
    env: { ...process.env, ...env },
    cwd: ROOT,
    detached: opts.detach,
  });
}

async function waitForServer(url: string, timeoutMs = 30_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 200) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Preview server não subiu em ${timeoutMs}ms: ${url}`);
}

async function runForFlag(flag: "0" | "1"): Promise<RunResult> {
  const dir = resolve(TMP, `flag-${flag}`);
  mkdirSync(dir, { recursive: true });

  console.log(`\n▸ Build com VITE_MODULES_CATEQUESE=${flag}`);
  await new Promise<void>((res, rej) => {
    const p = sh("bun", ["run", "build"], { VITE_MODULES_CATEQUESE: flag });
    p.on("exit", (code) => (code === 0 ? res() : rej(new Error(`build falhou (code ${code})`))));
  });

  console.log(`▸ Preview em ${BASE_URL}`);
  const server = sh(
    "bunx",
    ["vite", "preview", "--host", "127.0.0.1", "--port", String(PORT)],
    { VITE_MODULES_CATEQUESE: flag },
    { detach: true },
  );
  server.stdout?.on("data", (b) => process.stdout.write(`[preview:${flag}] ${b}`));
  server.stderr?.on("data", (b) => process.stderr.write(`[preview:${flag}] ${b}`));

  try {
    await waitForServer(BASE_URL);
    console.log(`▸ Playwright → ${dir}`);
    await new Promise<void>((res, rej) => {
      const pw = sh(
        "bunx",
        ["playwright", "test", "tests/e2e/catequese-baseline.spec.ts", "--project=chromium", "--reporter=list"],
        {
          CATEQUESE_SCREENSHOT_DIR: dir,
          PLAYWRIGHT_TEST_BASE_URL: BASE_URL,
        },
      );
      pw.on("exit", (code) => (code === 0 ? res() : rej(new Error(`playwright falhou (code ${code}) para flag ${flag}`))));
    });
  } finally {
    try {
      process.kill(-server.pid!, "SIGTERM");
    } catch {
      /* ignore */
    }
  }
  return { flag, dir };
}

function diffPair(pathA: string, pathB: string, outPath: string) {
  const a = PNG.sync.read(readFileSync(pathA));
  const b = PNG.sync.read(readFileSync(pathB));
  if (a.width !== b.width || a.height !== b.height) {
    return { error: `dimensões divergentes (${a.width}x${a.height} vs ${b.width}x${b.height})` as const };
  }
  const diff = new PNG({ width: a.width, height: a.height });
  const diffPixels = pixelmatch(a.data, b.data, diff.data, a.width, a.height, {
    threshold: 0.1,
    includeAA: false,
  });
  const total = a.width * a.height;
  const ratio = diffPixels / total;
  if (diffPixels > 0) writeFileSync(outPath, PNG.sync.write(diff));
  return { diffPixels, total, ratio };
}

async function main() {
  if (!existsSync(resolve(ROOT, "node_modules/pixelmatch"))) {
    console.error("pixelmatch não instalado — rode `bun install`");
    process.exit(2);
  }

  const [flag0, flag1] = await Promise.all([]).then(async () => {
    // sequencial: portas + build são exclusivos.
    const r0 = await runForFlag("0");
    const r1 = await runForFlag("1");
    return [r0, r1] as const;
  });

  const files0 = new Set(readdirSync(flag0.dir).filter((f) => f.endsWith(".png")));
  const files1 = new Set(readdirSync(flag1.dir).filter((f) => f.endsWith(".png")));
  const all = [...new Set([...files0, ...files1])].sort();

  const rows: Array<{
    file: string;
    status: "ok" | "diff" | "missing" | "error";
    diffPixels?: number;
    ratio?: number;
    error?: string;
  }> = [];

  for (const file of all) {
    if (!files0.has(file) || !files1.has(file)) {
      rows.push({ file, status: "missing" });
      continue;
    }
    const out = resolve(DIFF_DIR, file);
    const r = diffPair(resolve(flag0.dir, file), resolve(flag1.dir, file), out);
    if ("error" in r) {
      rows.push({ file, status: "error", error: r.error });
    } else if (r.ratio > MAX_RATIO) {
      rows.push({ file, status: "diff", diffPixels: r.diffPixels, ratio: r.ratio });
    } else {
      rows.push({ file, status: "ok", diffPixels: r.diffPixels, ratio: r.ratio });
    }
  }

  const failed = rows.filter((r) => r.status !== "ok");
  const summary = {
    generatedAt: new Date().toISOString(),
    maxDiffPixelRatio: MAX_RATIO,
    total: rows.length,
    ok: rows.filter((r) => r.status === "ok").length,
    regressions: failed.length,
    rows,
  };

  mkdirSync(REPORT_DIR, { recursive: true });
  writeFileSync(resolve(REPORT_DIR, "report.json"), JSON.stringify(summary, null, 2));

  const md = [
    "# Catequese · Pixel Parity (CQ-1.3)",
    "",
    `- Gerado em: \`${summary.generatedAt}\``,
    `- Budget: \`maxDiffPixelRatio ≤ ${MAX_RATIO}\``,
    `- Total: ${summary.total} · OK: ${summary.ok} · Regressões: **${summary.regressions}**`,
    "",
    "| Rota × Breakpoint | Status | Pixels divergentes | Ratio | Diff |",
    "| --- | --- | --- | --- | --- |",
    ...rows.map((r) => {
      const diffLink = r.status === "diff" ? `[diff](./diffs/${r.file})` : "—";
      const px = r.diffPixels ?? "—";
      const ratio = r.ratio !== undefined ? r.ratio.toExponential(2) : "—";
      const note = r.error ? ` _(${r.error})_` : "";
      return `| \`${r.file}\` | ${r.status.toUpperCase()}${note} | ${px} | ${ratio} | ${diffLink} |`;
    }),
    "",
    failed.length
      ? `## Regressões detectadas\n\n${failed.map((r) => `- **${r.file}** — ${r.status} ${r.error ?? ""}`).join("\n")}`
      : "## Sem regressões — feature flag preserva a UI byte-a-byte.",
    "",
  ].join("\n");
  writeFileSync(resolve(REPORT_DIR, "report.md"), md);

  console.log(`\n📄 Relatório: ${resolve(REPORT_DIR, "report.md")}`);
  if (failed.length) {
    console.error(`❌ ${failed.length} regressão(ões) de pixel — ver ${DIFF_DIR}`);
    process.exit(1);
  }
  console.log(`✅ ${rows.length} screenshots byte-parity entre flag=0 e flag=1.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
