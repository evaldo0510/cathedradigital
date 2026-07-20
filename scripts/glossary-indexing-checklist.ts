/**
 * Gera public/glossary-indexing-report.json com um checklist de indexação
 * dos verbetes publicados (URL canônica, presença no sitemap, no RSS/Atom
 * e instrução para submissão no Google Search Console).
 *
 * Sem OAuth do GSC não há como consultar status real do Google — este
 * relatório expõe tudo o que é auditável em runtime.
 */
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://www.cathedradigital.com.br';
const SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://gpwrpmoniglarqwfyryp.supabase.co';
const SUPABASE_ANON = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '';

async function main() {
  if (!SUPABASE_ANON) throw new Error('Missing SUPABASE_PUBLISHABLE_KEY');

  const restUrl =
    `${SUPABASE_URL}/rest/v1/glossary` +
    `?select=slug,term,editorial_completeness,updated_at,published_at` +
    `&status=eq.published&order=term.asc`;
  const res = await fetch(restUrl, {
    headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` },
  });
  if (!res.ok) throw new Error(`REST ${res.status}: ${await res.text()}`);
  const terms = (await res.json()) as Array<{
    slug: string | null;
    term: string;
    editorial_completeness: string;
    updated_at: string;
    published_at: string | null;
  }>;

  const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
  const sitemap = fs.existsSync(sitemapPath) ? fs.readFileSync(sitemapPath, 'utf8') : '';

  // RSS pode não estar servido em runtime local; tentamos buscar.
  let rssBody = '';
  try {
    const rss = await fetch(`${SUPABASE_URL}/functions/v1/glossary-rss?format=rss`, {
      headers: { Authorization: `Bearer ${SUPABASE_ANON}`, apikey: SUPABASE_ANON },
    });
    if (rss.ok) rssBody = await rss.text();
  } catch {
    /* tolerado */
  }

  const items = terms
    .filter((t) => t.slug)
    .map((t) => {
      const canonical = `${BASE_URL}/glossario/${t.slug}`;
      const inSitemap = sitemap.includes(canonical);
      const inRss = rssBody.includes(`/glossario/${t.slug}`);
      const gscInspectUrl = `https://search.google.com/search-console/inspect?resource_id=${encodeURIComponent(
        `${BASE_URL}/`,
      )}&id=${encodeURIComponent(canonical)}`;
      const status: 'ok' | 'warn' = inSitemap && inRss ? 'ok' : 'warn';
      return {
        slug: t.slug,
        term: t.term,
        editorial_completeness: t.editorial_completeness,
        canonical,
        in_sitemap: inSitemap,
        in_rss: inRss,
        published_at: t.published_at,
        updated_at: t.updated_at,
        gsc_inspect_url: gscInspectUrl,
        status,
      };
    });

  const summary = {
    total: items.length,
    complete: items.filter((i) => i.editorial_completeness === 'complete').length,
    missing_from_sitemap: items.filter((i) => !i.in_sitemap).length,
    missing_from_rss: items.filter((i) => !i.in_rss).length,
  };

  const report = {
    generated_at: new Date().toISOString(),
    base_url: BASE_URL,
    note:
      'GSC não está conectado. Use gsc_inspect_url para inspecionar cada URL manualmente no Search Console e "Solicitar indexação" quando necessário.',
    summary,
    items,
  };

  const outDir = path.join(process.cwd(), 'public');
  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, 'glossary-indexing-report.json');
  fs.writeFileSync(out, JSON.stringify(report, null, 2));
  console.log(
    `Glossary indexing checklist: ${summary.total} verbetes · sitemap faltando ${summary.missing_from_sitemap} · rss faltando ${summary.missing_from_rss} → ${out}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
