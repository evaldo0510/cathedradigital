/**
 * Falha se a meta tag <meta name="google-site-verification" ...> não estiver
 * presente (e válida) no HTML publicado.
 *
 * Verifica por padrão o build local (dist/index.html). Com --url=... valida
 * também o HTML servido pelo domínio publicado.
 *
 * Uso:
 *   bun run scripts/validate-gsc-meta.ts
 *   bun run scripts/validate-gsc-meta.ts --file=dist/index.html
 *   bun run scripts/validate-gsc-meta.ts --url=https://www.cathedradigital.com.br
 *   bun run scripts/validate-gsc-meta.ts --allow-placeholder   # não falha se ainda for placeholder
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const arg = (name: string, fallback?: string) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=")[1] : fallback;
};
const flag = (name: string) => args.includes(`--${name}`);

const FILE = arg("file", "dist/index.html")!;
const URL = arg("url");
const ALLOW_PLACEHOLDER = flag("allow-placeholder");

const META_RE = /<meta\s+[^>]*name=["']google-site-verification["'][^>]*content=["']([^"']+)["'][^>]*\/?>/i;
const PLACEHOLDER = /SUBSTITUIR|PLACEHOLDER|TODO|xxxx/i;

type Check = { source: string; found: boolean; content?: string; placeholder?: boolean };

function checkHtml(source: string, html: string): Check {
  const m = html.match(META_RE);
  if (!m) return { source, found: false };
  const content = m[1].trim();
  return { source, found: true, content, placeholder: PLACEHOLDER.test(content) || content.length < 20 };
}

async function main() {
  const results: Check[] = [];

  const filePath = resolve(FILE);
  if (existsSync(filePath)) {
    results.push(checkHtml(filePath, readFileSync(filePath, "utf-8")));
  } else {
    console.warn(`⚠️  Arquivo não encontrado: ${filePath} (rode "vite build" antes ou use --file=index.html)`);
    // fallback para o index.html-fonte
    const src = resolve("index.html");
    if (existsSync(src)) results.push(checkHtml(src, readFileSync(src, "utf-8")));
  }

  if (URL) {
    try {
      const res = await fetch(URL, { redirect: "follow" });
      const html = await res.text();
      results.push(checkHtml(URL, html));
    } catch (e) {
      results.push({ source: URL, found: false, content: `erro de fetch: ${(e as Error).message}` });
    }
  }

  let failed = false;
  console.log(`\n🔍 Validando meta google-site-verification\n`);
  for (const r of results) {
    if (!r.found) {
      console.error(`❌ ${r.source} — meta AUSENTE`);
      failed = true;
    } else if (r.placeholder && !ALLOW_PLACEHOLDER) {
      console.error(`❌ ${r.source} — meta com PLACEHOLDER: "${r.content}"`);
      failed = true;
    } else {
      console.log(`✅ ${r.source} — content="${r.content}"${r.placeholder ? " (placeholder tolerado)" : ""}`);
    }
  }

  if (results.length === 0) {
    console.error(`❌ Nenhuma fonte verificada.`);
    process.exit(1);
  }

  if (failed) {
    console.error(`\n❌ Validação falhou. Adicione em <head> do index.html:\n   <meta name="google-site-verification" content="SEU_CODIGO_AQUI" />\n`);
    process.exit(1);
  }
  console.log(`\n✅ Meta google-site-verification presente em todas as fontes.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
