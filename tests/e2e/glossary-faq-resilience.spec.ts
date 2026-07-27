/**
 * E2E — /glossario/[termo]: garante que a página carrega mesmo com FAQs
 * inválidos no banco (nunca crasha) e que o JSON-LD FAQPage, quando emitido,
 * atende ao schema.org (Question/Answer não vazios).
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

type Row = { slug: string; term: string; faq: unknown };

async function fetchSample(): Promise<Row[]> {
  const ctx = await request.newContext();
  const url = `${SUPABASE_URL}/rest/v1/glossary?select=slug,term,faq&status=eq.published&order=term.asc&limit=8`;
  const res = await ctx.get(url, {
    headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` },
  });
  await ctx.dispose();
  if (!res.ok()) return [];
  return ((await res.json()) as Row[]).filter((r) => !!r.slug);
}

test.describe('Glossário — resiliência do FAQ + JSON-LD', () => {
  test('página carrega e JSON-LD FAQPage (se presente) não tem question/answer vazios', async ({
    page,
  }) => {
    test.setTimeout(120_000);

    const runtimeErrors: string[] = [];
    page.on('pageerror', (e) => runtimeErrors.push(e.message));

    const terms = await fetchSample();
    // Fallback: se REST indisponível no ambiente de CI, ao menos garante rota conhecida
    const slugs = terms.length > 0 ? terms.map((t) => t.slug) : ['confissao'];

    for (const slug of slugs) {
      await page.goto(`/glossario/${slug}`, { waitUntil: 'domcontentloaded' });

      // H1 sempre renderiza (não travou no skeleton, não crashou o React)
      const h1 = page.locator('h1').first();
      await expect(h1, `H1 ausente em /glossario/${slug}`).toBeVisible({ timeout: 15_000 });

      // Coleta todos os JSON-LD e valida FAQPage se existir
      const scripts = await page
        .locator('script[type="application/ld+json"]')
        .allTextContents();

      for (const raw of scripts) {
        let parsed: any;
        try {
          parsed = JSON.parse(raw);
        } catch {
          throw new Error(`JSON-LD inválido em /glossario/${slug}: ${raw.slice(0, 120)}`);
        }
        const graph = Array.isArray(parsed?.['@graph']) ? parsed['@graph'] : [parsed];
        for (const node of graph) {
          if (node?.['@type'] !== 'FAQPage') continue;
          expect(Array.isArray(node.mainEntity), `FAQPage sem mainEntity em ${slug}`).toBe(true);
          expect(node.mainEntity.length, `FAQPage vazio em ${slug}`).toBeGreaterThan(0);
          for (const q of node.mainEntity) {
            expect(q?.['@type']).toBe('Question');
            expect(typeof q?.name === 'string' && q.name.trim().length > 0, `Question.name vazio em ${slug}`).toBe(true);
            expect(q?.acceptedAnswer?.['@type']).toBe('Answer');
            expect(
              typeof q?.acceptedAnswer?.text === 'string' && q.acceptedAnswer.text.trim().length > 0,
              `Answer.text vazio em ${slug}`,
            ).toBe(true);
          }
        }
      }
    }

    expect(runtimeErrors, `Runtime errors: ${runtimeErrors.join(' | ')}`).toEqual([]);
  });
});
