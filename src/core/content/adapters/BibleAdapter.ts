/**
 * BibleAdapter (mock) — Sprint 2.0.4B-1.
 *
 * Serve `ReaderContent` para passagens bíblicas usando dados estáticos.
 * A substituição pela fonte real (Supabase / bolls.life) ocorre na
 * Sprint 2.0.5 sem mudar a assinatura.
 */

import type { ContentAdapter, ContentGetParams } from './types';
import type { ReaderContent, SearchResult } from '../contracts';
import { buildId } from '@/core/knowledge';

interface BiblePassageSeed {
  book: string;
  chapter: number;
  title: string;
  canonicalRef: string;
  verses: { n: number; text: string }[];
}

const SEED: BiblePassageSeed[] = [
  {
    book: 'romanos',
    chapter: 8,
    title: 'Romanos 8',
    canonicalRef: 'Rm 8',
    verses: [
      { n: 24, text: 'Porque, na esperança, é que fomos salvos.' },
      { n: 25, text: 'Ora, o que se vê não é esperança; pois, o que alguém vê, como o espera?' },
    ],
  },
  {
    book: 'joao',
    chapter: 6,
    title: 'João 6',
    canonicalRef: 'Jo 6',
    verses: [
      { n: 51, text: 'Eu sou o pão vivo que desceu do céu.' },
    ],
  },
  {
    book: 'efesios',
    chapter: 2,
    title: 'Efésios 2',
    canonicalRef: 'Ef 2',
    verses: [
      { n: 8, text: 'Pela graça sois salvos, mediante a fé.' },
    ],
  },
];

function toReaderContent(p: BiblePassageSeed): ReaderContent {
  return {
    id: buildId('bible', p.book, p.chapter),
    kind: 'bible',
    title: p.title,
    metadata: {
      canonicalRef: p.canonicalRef,
      source: 'Bíblia (NVI-PT)',
      language: 'pt-BR',
    },
    sections: p.verses.map((v) => ({
      anchor: String(v.n),
      body: v.text,
    })),
  };
}

export const BibleAdapter: ContentAdapter = {
  kind: 'bible',
  label: 'Bíblia',

  async get(params: ContentGetParams): Promise<ReaderContent | null> {
    const book = String(params.book ?? '');
    const chapter = Number(params.chapter ?? 0);
    const hit = SEED.find((p) => p.book === book && p.chapter === chapter);
    return hit ? toReaderContent(hit) : null;
  },

  async search(query: string, limit = 10): Promise<SearchResult[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const hits: SearchResult[] = [];
    for (const p of SEED) {
      for (const v of p.verses) {
        if (v.text.toLowerCase().includes(q)) {
          hits.push({
            nodeId: buildId('bible', p.book, p.chapter),
            kind: 'bible',
            label: `${p.canonicalRef}, ${v.n}`,
            snippet: v.text,
          });
        }
      }
    }
    return hits.slice(0, limit);
  },
};
