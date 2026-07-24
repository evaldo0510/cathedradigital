/**
 * Falha se a meta tag <meta name="google-site-verification" ...> não estiver
 * presente (e válida) no HTML publicado.
 *
 * Verifica por padrão o build local (dist/index.html). Com --url=... valida
 * também o HTML servido pelo domínio publicado, e faz um sanity check de
 * sitemap.xml e robots.txt no mesmo domínio.
 *
 * Sempre grava reports/seo/gsc-meta-check.{json,md} com URL consultada,
 * trecho do HTML encontrado e status HTTP de sitemap/robots — para inspeção
 * como artefato no CI.
 *
 * Uso:
 *   bun run scripts/validate-gsc-meta.ts
 *   bun run scripts/validate-gsc-meta.ts --file=dist/index.html
 *   bun run scripts/validate-gsc-meta.ts --url=https://www.cathedradigital.com.br
 *   bun run scripts/validate-gsc-meta.ts --allow-placeholder
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const arg = (name: string, fallback?: string) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=")[1] : fallback;
};
const flag = (name: string) => args.includes(`--${name}`);

const FILE = arg("file", "dist/index.html")!;
const URL_ = arg("url");
const ALLOW_PLACEHOLDER = flag("allow-placeholder");

const META_RE =
  /<meta\s+[^>]*name=["']google-site-verification["'][^>]*content=["']([^"']+)["'][^>]*\/?>/i;
const META_TAG_RE =
  /<meta\s+[^>]*name=["']google-site-verification["'][^>]*\/?>/i;
const PLACEHOLDER = /SUBSTITUIR|PLACEHOLDER|TODO|xxxx/i;

type Check = {
  source: string;
  httpStatus?: number | null;
  found: boolean;
  content?: string;
  placeholder?: boolean;
  tagSnippet?: string;
  headSnippet?: string;
  error?: string;
};

type UrlProbe = {
  url: string;
  status: number | null;
  ok: boolean;
  contentType?: string | null;
  bodyExcerpt?: string;
  error?: string;
};

function snippetAroundMeta(html: string): string | undefined {
  const m = html.match(META_TAG_RE);
  return m ? m[0] : undefined;
}

function headSnippet(html: string, max = 1200): string {
  const head = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const body = head ? head[1] : html.slice(0, max);
  return body.replace(/\s+/g, " ").trim().slice(0, max);
}

function checkHtml(source: string, html: string, httpStatus?: number | null): Check {
  const m = html.match(META_RE);
  const tagSnippet = snippetAroundMeta(html);
  const head = headSnippet(html);
  if (!m) return { source, httpStatus, found: false, tagSnippet, headSnippet: head };
  const content = m[1].trim();
  return {
    source,
    httpStatus,
    found: true,
    content,
    placeholder: PLACEHOLDER.test(content) || content.length < 20,
    tagSnippet,
    headSnippet: head,
  };
}

async function probe(url: string, opts: { text?: boolean } = {}): Promise<UrlProbe> {
  try {
    const res = await fetch(url, { redirect: "follow" });
    const contentType = res.headers.get("content-type");
    let bodyExcerpt: string | undefined;
    let text: string | undefined;
    if (opts.text) {
      text = await res.text();
      bodyExcerpt = text.slice(0, 400);
    }
    return {
      url,
      status: res.status,
      ok: res.ok,
      contentType,
      bodyExcerpt,
      // @ts-expect-error smuggle text back when needed
      _text: text,
    };
  } catch (e) {
    return { url, status: null, ok: false, error: (e as Error).message };
  }
}

async function main() {
  const results: Check[] = [];
  let siteProbe: UrlProbe | null = null;
  let robotsProbe: UrlProbe | null = null;
  let sitemapProbe: UrlProbe | null = null;

  // ---- Build local ----
  const filePath = resolve(FILE);
  if (existsSync(filePath)) {
    results.push(checkHtml(filePath, readFileSync(filePath, "utf-8")));
  } else {
    console.warn(`⚠️  Arquivo não encontrado: ${filePath} (rode "vite build" antes ou use --file=index.html)`);
    const src = resolve("index.html");
    if (existsSync(src)) results.push(checkHtml(src, readFileSync(src, "utf-8")));
  }

  // ---- Domínio publicado ----
  if (URL_) {
    siteProbe = await probe(URL_, { text: true });
    // @ts-expect-error internal field
    const html: string | undefined = siteProbe._text;
    if (html) {
      results.push(checkHtml(URL_, html, siteProbe.status));
    } else {
      results.push({
        source: URL_,
        httpStatus: siteProbe.status,
        found: false,
        error: siteProbe.error ?? `HTTP ${siteProbe.status}`,
      });
    }

    const base = URL_.replace(/\/$/, "");
    [sitemapProbe, robotsProbe] = await Promise.all([
      probe(`${base}/sitemap.xml`, { text: true }),
      probe(`${base}/robots.txt`, { text: true }),
    ]);
  }

  // ---- Console output ----
  let failed = false;
  console.log(`\n🔍 Validando meta google-site-verification\n`);
  for (const r of results) {
    const httpTag = r.httpStatus != null ? ` [HTTP ${r.httpStatus}]` : "";
    if (!r.found) {
      console.error(`❌ ${r.source}${httpTag} — meta AUSENTE${r.error ? ` (${r.error})` : ""}`);
      failed = true;
    } else if (r.placeholder && !ALLOW_PLACEHOLDER) {
      console.error(`❌ ${r.source}${httpTag} — meta com PLACEHOLDER: "${r.content}"`);
      failed = true;
    } else {
      console.log(
        `✅ ${r.source}${httpTag} — content="${r.content}"${r.placeholder ? " (placeholder tolerado)" : ""}`,
      );
    }
  }

  if (sitemapProbe) {
    console.log(`\nsitemap.xml → ${sitemapProbe.status ?? "erro"} ${sitemapProbe.ok ? "✅" : "❌"}`);
  }
  if (robotsProbe) {
    console.log(`robots.txt  → ${robotsProbe.status ?? "erro"} ${robotsProbe.ok ? "✅" : "❌"}`);
  }

  // ---- Relatório (sempre gerado, mesmo em falha) ----
  mkdirSync("reports/seo", { recursive: true });
  const summary = {
    generatedAt: new Date().toISOString(),
    args: { file: FILE, url: URL_ ?? null, allowPlaceholder: ALLOW_PLACEHOLDER },
    metaChecks: results.map((r) => ({
      source: r.source,
      httpStatus: r.httpStatus ?? null,
      found: r.found,
      content: r.content ?? null,
      placeholder: r.placeholder ?? null,
      tagSnippet: r.tagSnippet ?? null,
      headSnippet: r.headSnippet ?? null,
      error: r.error ?? null,
    })),
    seoAssets: URL_
      ? {
          sitemap: sitemapProbe
            ? {
                url: sitemapProbe.url,
                status: sitemapProbe.status,
                ok: sitemapProbe.ok,
                contentType: sitemapProbe.contentType ?? null,
                bodyExcerpt: sitemapProbe.bodyExcerpt ?? null,
                error: sitemapProbe.error ?? null,
              }
            : null,
          robots: robotsProbe
            ? {
                url: robotsProbe.url,
                status: robotsProbe.status,
                ok: robotsProbe.ok,
                contentType: robotsProbe.contentType ?? null,
                bodyExcerpt: robotsProbe.bodyExcerpt ?? null,
                error: robotsProbe.error ?? null,
              }
            : null,
        }
      : null,
    failed: failed || results.length === 0,
  };

  writeFileSync(resolve("reports/seo/gsc-meta-check.json"), JSON.stringify(summary, null, 2));

  const md = [
    `# GSC meta gate — relatório`,
    ``,
    `Gerado em ${summary.generatedAt}`,
    ``,
    `- Arquivo local: \`${FILE}\``,
    `- URL publicada: ${URL_ ? `\`${URL_}\`` : "_não consultada_"}`,
    `- allow-placeholder: **${ALLOW_PLACEHOLDER ? "sim" : "não"}**`,
    ``,
    `## Verificações da meta`,
    ``,
    `| Fonte | HTTP | Encontrada | Placeholder | Conteúdo |`,
    `|---|---|---|---|---|`,
    ...results.map(
      (r) =>
        `| \`${r.source}\` | ${r.httpStatus ?? "—"} | ${r.found ? "✅" : "❌"} | ${r.placeholder ? "⚠️" : "—"} | ${
          r.content ? `\`${r.content}\`` : r.error ? `_${r.error}_` : "—"
        } |`,
    ),
    ``,
    `### Trechos encontrados`,
    ``,
    ...results.flatMap((r) => [
      `**${r.source}**`,
      ``,
      r.tagSnippet
        ? "```html\n" + r.tagSnippet + "\n```"
        : "_(nenhuma tag `google-site-verification` no HTML)_",
      ``,
      r.headSnippet
        ? `<details><summary>&lt;head&gt; excerpt</summary>\n\n\`\`\`html\n${r.headSnippet}\n\`\`\`\n</details>`
        : "",
      ``,
    ]),
    URL_
      ? [
          `## Sanity check dos assets SEO em \`${URL_}\``,
          ``,
          `| Recurso | HTTP | OK | Content-Type |`,
          `|---|---|---|---|`,
          `| \`${sitemapProbe?.url ?? "sitemap.xml"}\` | ${sitemapProbe?.status ?? "erro"} | ${sitemapProbe?.ok ? "✅" : "❌"} | ${sitemapProbe?.contentType ?? "—"} |`,
          `| \`${robotsProbe?.url ?? "robots.txt"}\` | ${robotsProbe?.status ?? "erro"} | ${robotsProbe?.ok ? "✅" : "❌"} | ${robotsProbe?.contentType ?? "—"} |`,
          ``,
          `**sitemap.xml (primeiros 400 chars):**`,
          ``,
          "```xml",
          sitemapProbe?.bodyExcerpt ?? sitemapProbe?.error ?? "—",
          "```",
          ``,
          `**robots.txt (primeiros 400 chars):**`,
          ``,
          "```",
          robotsProbe?.bodyExcerpt ?? robotsProbe?.error ?? "—",
          "```",
        ].join("\n")
      : "",
    ``,
    summary.failed
      ? `## Como corrigir\n\nAdicione em \`<head>\` do \`index.html\`:\n\n\`\`\`html\n<meta name="google-site-verification" content="SEU_CODIGO_AQUI" />\n\`\`\`\n\nObtenha o código em Google Search Console → Configurações → Verificação da propriedade → Tag HTML.`
      : `## Status\n\n✅ Meta \`google-site-verification\` válida em todas as fontes.`,
    ``,
  ].join("\n");
  writeFileSync(resolve("reports/seo/gsc-meta-check.md"), md);

  console.log(`\n📝 Relatórios:\n  - reports/seo/gsc-meta-check.json\n  - reports/seo/gsc-meta-check.md`);

  if (results.length === 0) {
    console.error(`❌ Nenhuma fonte verificada.`);
    process.exit(1);
  }
  if (failed) {
    console.error(
      `\n❌ Validação falhou. Adicione em <head> do index.html:\n   <meta name="google-site-verification" content="SEU_CODIGO_AQUI" />\n`,
    );
    process.exit(1);
  }
  console.log(`\n✅ Meta google-site-verification presente em todas as fontes.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
