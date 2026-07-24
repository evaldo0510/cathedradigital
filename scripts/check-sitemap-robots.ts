/**
 * Verifica se /sitemap.xml e /robots.txt estão acessíveis no domínio publicado
 * e valida os links listados no sitemap. Gera relatório JSON + Markdown.
 *
 * Uso:
 *   bun run scripts/check-sitemap-robots.ts
 *   bun run scripts/check-sitemap-robots.ts --base=https://www.cathedradigital.com.br
 *   bun run scripts/check-sitemap-robots.ts --max=50   # limita nº de URLs verificadas
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

type CheckResult = {
  url: string;
  status: number | null;
  ok: boolean;
  error?: string;
  ms?: number;
};

const args = process.argv.slice(2);
const arg = (name: string, fallback?: string) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=")[1] : fallback;
};

const BASE = (arg("base", "https://www.cathedradigital.com.br") || "").replace(/\/$/, "");
const MAX = Number(arg("max", "200"));
const TIMEOUT_MS = Number(arg("timeout", "10000"));
const CONCURRENCY = Number(arg("concurrency", "8"));

async function head(url: string): Promise<CheckResult> {
  const started = Date.now();
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    // Alguns hosts (Lovable) respondem 405/403 a HEAD → cai para GET.
    let res = await fetch(url, { method: "HEAD", redirect: "follow", signal: controller.signal });
    if (res.status === 405 || res.status === 403 || res.status === 501) {
      res = await fetch(url, { method: "GET", redirect: "follow", signal: controller.signal });
    }
    return { url, status: res.status, ok: res.ok, ms: Date.now() - started };
  } catch (e) {
    return { url, status: null, ok: false, error: (e as Error).message, ms: Date.now() - started };
  } finally {
    clearTimeout(t);
  }
}

async function pool<T, R>(items: T[], size: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx]);
      }
    }),
  );
  return out;
}

function extractLocs(xml: string): string[] {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1]);
}

async function main() {
  console.log(`\n🔎 Verificando sitemap/robots em ${BASE}\n`);

  const sitemapUrl = `${BASE}/sitemap.xml`;
  const robotsUrl = `${BASE}/robots.txt`;

  const [sitemap, robots] = await Promise.all([
    fetch(sitemapUrl).then(async (r) => ({ r, text: await r.text().catch(() => "") })).catch((e) => ({ r: null, text: "", error: (e as Error).message })),
    fetch(robotsUrl).then(async (r) => ({ r, text: await r.text().catch(() => "") })).catch((e) => ({ r: null, text: "", error: (e as Error).message })),
  ]);

  const sitemapStatus = (sitemap as any).r?.status ?? null;
  const robotsStatus = (robots as any).r?.status ?? null;
  const sitemapOk = sitemapStatus === 200 && sitemap.text.includes("<urlset");
  const robotsOk = robotsStatus === 200 && /user-agent/i.test(robots.text);

  console.log(`sitemap.xml → ${sitemapStatus ?? "erro"} ${sitemapOk ? "✅" : "❌"}`);
  console.log(`robots.txt  → ${robotsStatus ?? "erro"} ${robotsOk ? "✅" : "❌"}`);

  const robotsHasSitemap = /sitemap\s*:/i.test(robots.text);
  console.log(`robots.txt referencia Sitemap: ${robotsHasSitemap ? "sim ✅" : "não ⚠️"}`);

  const locs = sitemapOk ? [...new Set(extractLocs(sitemap.text))] : [];
  const toCheck = locs.slice(0, MAX);
  console.log(`\n📄 ${locs.length} URLs no sitemap. Verificando ${toCheck.length} (concorrência ${CONCURRENCY})...\n`);

  const results = await pool(toCheck, CONCURRENCY, head);

  const broken = results.filter((r) => !r.ok);
  const ok = results.filter((r) => r.ok);

  const summary = {
    generatedAt: new Date().toISOString(),
    base: BASE,
    sitemap: { url: sitemapUrl, status: sitemapStatus, ok: sitemapOk, urls: locs.length, checked: toCheck.length },
    robots: { url: robotsUrl, status: robotsStatus, ok: robotsOk, hasSitemapDirective: robotsHasSitemap },
    urls: { ok: ok.length, broken: broken.length },
    brokenList: broken,
  };

  mkdirSync("reports/seo", { recursive: true });
  const jsonPath = resolve("reports/seo/sitemap-robots-check.json");
  const mdPath = resolve("reports/seo/sitemap-robots-check.md");
  writeFileSync(jsonPath, JSON.stringify(summary, null, 2));

  const md = [
    `# Sitemap & Robots — ${BASE}`,
    ``,
    `Gerado em ${summary.generatedAt}`,
    ``,
    `| Recurso | Status | OK |`,
    `|---|---|---|`,
    `| \`${sitemapUrl}\` | ${sitemapStatus ?? "erro"} | ${sitemapOk ? "✅" : "❌"} |`,
    `| \`${robotsUrl}\` | ${robotsStatus ?? "erro"} | ${robotsOk ? "✅" : "❌"} |`,
    `| \`robots.txt\` → Sitemap directive | — | ${robotsHasSitemap ? "✅" : "⚠️"} |`,
    ``,
    `## URLs do sitemap`,
    ``,
    `- Total: ${locs.length}`,
    `- Verificadas: ${toCheck.length}`,
    `- OK: ${ok.length}`,
    `- Quebradas: ${broken.length}`,
    ``,
    broken.length ? `## Links inválidos\n\n${broken.map((b) => `- ${b.status ?? "ERR"} — ${b.url}${b.error ? ` (${b.error})` : ""}`).join("\n")}` : `## Links inválidos\n\nNenhum ✅`,
    ``,
  ].join("\n");
  writeFileSync(mdPath, md);

  console.log(`\n📝 Relatórios:\n  - ${jsonPath}\n  - ${mdPath}\n`);
  console.log(`Resumo: OK=${ok.length}  Broken=${broken.length}`);

  const strict = args.includes("--strict");
  const fail = !sitemapOk || !robotsOk || (strict && broken.length > 0);
  if (fail) {
    console.error(`\n❌ Falhou (sitemap=${sitemapOk} robots=${robotsOk} broken=${broken.length})`);
    process.exit(1);
  }
  console.log(`\n✅ OK`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
