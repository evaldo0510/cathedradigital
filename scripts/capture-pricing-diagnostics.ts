#!/usr/bin/env bun
/**
 * Diagnóstico pós-falha do publish-gate: captura o HTML renderizado e
 * o JSON-LD de /pricing para facilitar debug quando os testes SEO
 * quebram. Escreve em ./diagnostics/ (uploaded como artifact do CI).
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE = process.env.PLAYWRIGHT_TEST_BASE_URL ?? 'http://127.0.0.1:8080';
const OUT = path.resolve('diagnostics');
fs.mkdirSync(OUT, { recursive: true });

async function capture(pathName: string, slug: string) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const url = `${BASE}${pathName}`;
  const nav = await page.goto(url, { waitUntil: 'networkidle' }).catch((e) => {
    console.error(`falha ao navegar ${url}:`, e);
    return null;
  });

  const html = await page.content().catch(() => '<!-- captura falhou -->');
  fs.writeFileSync(path.join(OUT, `${slug}.html`), html);

  const jsonld = await page
    .locator('head script[type="application/ld+json"]')
    .allTextContents()
    .catch(() => []);
  fs.writeFileSync(
    path.join(OUT, `${slug}.jsonld.json`),
    JSON.stringify(
      {
        url,
        finalUrl: page.url(),
        status: nav?.status() ?? null,
        canonical: await page.getAttribute('link[rel="canonical"]', 'href').catch(() => null),
        ogUrl: await page.getAttribute('meta[property="og:url"]', 'content').catch(() => null),
        twitterUrl: await page.getAttribute('meta[name="twitter:url"]', 'content').catch(() => null),
        robots: await page.getAttribute('meta[name="robots"]', 'content').catch(() => null),
        jsonld: jsonld.map((raw) => {
          try {
            return JSON.parse(raw);
          } catch {
            return { __invalid: true, raw };
          }
        }),
      },
      null,
      2,
    ),
  );

  await page.screenshot({ path: path.join(OUT, `${slug}.png`), fullPage: false }).catch(() => {});
  await browser.close();
  console.log(`✅ diagnóstico salvo: ${slug}`);
}

async function main() {
  await capture('/pricing', 'pricing');
  await capture('/planos', 'planos-redirect');
}

main().catch((e) => {
  console.error('diagnostics falhou:', e);
  process.exit(0); // nunca derruba o job — é só coleta.
});
