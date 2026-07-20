/**
 * E2E SEO do Glossário: valida title, description, canonical, og:*, twitter:card
 * e JSON-LD (DefinedTerm/Article/FAQPage quando aplicável) em cada verbete
 * published+complete.
 */
import { test, expect, request } from '@playwright/test';

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ??
  process.env.SUPABASE_URL ??
  'https://gpwrpmoniglarqwfyryp.supabase.co';
const SUPABASE_ANON =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  process.env.SUPABASE_ANON_KEY ??
  '';

type Row = { slug: string; term: string; faq: any };

async function fetchTerms(): Promise<Row[]> {
  const ctx = await request.newContext();
  const url = `${SUPABASE_URL}/rest/v1/glossary?select=slug,term,faq&status=eq.published&editorial_completeness=eq.complete&order=term.asc`;
  const res = await ctx.get(url, {
    headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` },
  });
  if (!res.ok()) throw new Error(`REST ${res.status()}`);
  const data = (await res.json()) as Row[];
  await ctx.dispose();
  return data.filter((r) => !!r.slug);
}

test.describe('Glossário — SEO por verbete', () => {
  test('cada verbete publicado tem title/description/canonical/og/twitter e JSON-LD válido', async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const terms = await fetchTerms();
    expect(terms.length, 'sem verbetes published+complete').toBeGreaterThan(0);

    const failures: string[] = [];

    for (const t of terms) {
      const path = `/glossario/${t.slug}`;
      await page.goto(path, { waitUntil: 'networkidle' });

      const title = await page.title();
      // Helmet APPENDS tags marcadas com data-rh="true"; usar `.last()` para pegar
      // o valor efetivo (Helmet vence a versão estática do index.html).
      const attr = async (sel: string, name: string) =>
        page.locator(sel).last().getAttribute(name);
      const desc = await attr('meta[name="description"]', 'content');
      const canonical = await attr('link[rel="canonical"]', 'href');
      const ogTitle = await attr('meta[property="og:title"]', 'content');
      const ogDesc = await attr('meta[property="og:description"]', 'content');
      const ogType = await attr('meta[property="og:type"]', 'content');
      const ogUrl = await attr('meta[property="og:url"]', 'content');
      const twCard = await attr('meta[name="twitter:card"]', 'content');

      const push = (msg: string) => failures.push(`${t.slug}: ${msg}`);
      if (!title?.includes(t.term)) push(`<title> sem o termo (${title})`);
      if (!desc || desc.length < 30) push('description ausente/curta');
      if (!canonical?.endsWith(`/glossario/${t.slug}`)) push(`canonical inválido (${canonical})`);
      if (!ogTitle?.includes(t.term)) push('og:title inválido');
      if (!ogDesc) push('og:description ausente');
      if (ogType !== 'article') push(`og:type != article (${ogType})`);
      if (!ogUrl?.endsWith(`/glossario/${t.slug}`)) push('og:url inválido');
      if (!twCard) push('twitter:card ausente');

      // JSON-LD
      const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
      const graphs = scripts
        .map((s) => {
          try {
            return JSON.parse(s);
          } catch {
            push('JSON-LD malformado');
            return null;
          }
        })
        .filter(Boolean);
      const types = new Set<string>();
      for (const g of graphs) {
        const nodes = g['@graph'] ?? [g];
        for (const n of nodes) if (n?.['@type']) types.add(n['@type']);
      }
      if (!types.has('DefinedTerm')) push('JSON-LD sem DefinedTerm');
      if (!types.has('Article')) push('JSON-LD sem Article');
      const hasFaq = Array.isArray(t.faq) && t.faq.length > 0;
      if (hasFaq && !types.has('FAQPage')) push('JSON-LD sem FAQPage (embora exista FAQ)');
    }

    expect(failures, `\n${failures.join('\n')}`).toEqual([]);
  });
});
