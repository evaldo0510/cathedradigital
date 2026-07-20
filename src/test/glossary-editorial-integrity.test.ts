/**
 * Integridade editorial do Glossário.
 *
 * Garante que TODO verbete publicado com editorial_completeness = 'complete'
 * possui os campos obrigatórios do template Logos 2030 preenchidos.
 * Roda contra o banco real via REST público (anon).
 */
import { describe, it, expect, beforeAll } from 'vitest';

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ??
  process.env.SUPABASE_URL ??
  'https://gpwrpmoniglarqwfyryp.supabase.co';
const SUPABASE_ANON =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  process.env.SUPABASE_PUBLISHABLE_KEY ??
  process.env.SUPABASE_ANON_KEY ??
  '';

type Entry = {
  slug: string | null;
  term: string;
  short_definition: string | null;
  definition: string | null;
  interpretation: string | null;
  historical_context: string | null;
  practical_application: string | null;
  logos_meditation: string | null;
  bible_verses: string[] | null;
  catechism_references: string[] | null;
  faq: unknown;
  bibliography: unknown;
  editorial_completeness: string;
  status: string;
  published_at: string | null;
};

let published: Entry[] = [];

const REQUIRED_TEXT_FIELDS: Array<keyof Entry> = [
  'short_definition',
  'definition',
  'interpretation',
  'historical_context',
  'practical_application',
  'logos_meditation',
];

const REQUIRED_ARRAY_FIELDS: Array<keyof Entry> = [
  'bible_verses',
  'catechism_references',
];

const REQUIRED_JSON_FIELDS: Array<keyof Entry> = ['faq', 'bibliography'];

beforeAll(async () => {
  if (!SUPABASE_ANON) throw new Error('Missing SUPABASE anon key for glossary integrity test');
  const url =
    `${SUPABASE_URL}/rest/v1/glossary` +
    `?select=slug,term,short_definition,definition,interpretation,historical_context,practical_application,logos_meditation,bible_verses,catechism_references,faq,bibliography,editorial_completeness,status,published_at` +
    `&status=eq.published&editorial_completeness=eq.complete`;
  const res = await fetch(url, {
    headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` },
  });
  if (!res.ok) throw new Error(`Supabase REST ${res.status}: ${await res.text()}`);
  published = (await res.json()) as Entry[];
});

describe('Glossário — integridade editorial dos verbetes publicados', () => {
  it('há pelo menos um verbete published+complete', () => {
    expect(published.length).toBeGreaterThan(0);
  });

  it('todo verbete publicado+complete tem slug e published_at', () => {
    const invalid = published.filter((e) => !e.slug || !e.published_at);
    expect(invalid, `Verbetes sem slug/published_at: ${invalid.map((i) => i.term).join(', ')}`).toEqual([]);
  });

  it('todos os campos textuais obrigatórios estão preenchidos', () => {
    const failures: string[] = [];
    for (const e of published) {
      for (const f of REQUIRED_TEXT_FIELDS) {
        const v = e[f];
        if (typeof v !== 'string' || v.trim().length < 20) {
          failures.push(`${e.term} → ${String(f)} vazio/curto`);
        }
      }
    }
    expect(failures, failures.join('\n')).toEqual([]);
  });

  it('arrays de referência (Bíblia, Catecismo) têm pelo menos 1 item', () => {
    const failures: string[] = [];
    for (const e of published) {
      for (const f of REQUIRED_ARRAY_FIELDS) {
        const v = e[f] as string[] | null;
        if (!Array.isArray(v) || v.length === 0) failures.push(`${e.term} → ${String(f)} vazio`);
      }
    }
    expect(failures, failures.join('\n')).toEqual([]);
  });

  it('FAQ e bibliografia são arrays não vazios com estrutura válida', () => {
    const failures: string[] = [];
    for (const e of published) {
      for (const f of REQUIRED_JSON_FIELDS) {
        const v = e[f];
        if (!Array.isArray(v) || v.length === 0) {
          failures.push(`${e.term} → ${String(f)} vazio`);
          continue;
        }
        if (f === 'faq') {
          const bad = (v as any[]).some(
            (i) => !i || typeof i.question !== 'string' || typeof i.answer !== 'string',
          );
          if (bad) failures.push(`${e.term} → faq com item inválido`);
        }
      }
    }
    expect(failures, failures.join('\n')).toEqual([]);
  });
});
