/**
 * MagisteriumAdapter (mock) — Sprint 2.0.4B-1.
 *
 * Devolve documentos do Magistério em formato `ReaderContent`.
 * Substituição pela leitura real (vatican_cache / edge functions)
 * acontece na Sprint 2.0.5.
 */

import type { ContentAdapter, ContentGetParams } from './types';
import type { ReaderContent, SearchResult } from '../contracts';
import { buildId } from '@/core/knowledge';

interface MagisteriumDocSeed {
  slug: string;
  title: string;
  author: string;
  publishedAt: string;
  paragraphs: { anchor?: string; heading?: string; body: string }[];
}

const SEED: MagisteriumDocSeed[] = [
  {
    slug: 'spe-salvi',
    title: 'Spe Salvi',
    author: 'Bento XVI',
    publishedAt: '2007',
    paragraphs: [
      {
        anchor: '1',
        heading: 'A esperança que salva',
        body:
          '“Spe salvi facti sumus” — na esperança fomos salvos, diz São ' +
          'Paulo aos Romanos e também a nós.',
      },
    ],
  },
  {
    slug: 'ecclesia-de-eucharistia',
    title: 'Ecclesia de Eucharistia',
    author: 'João Paulo II',
    publishedAt: '2003',
    paragraphs: [
      {
        anchor: '1',
        body:
          'A Igreja vive da Eucaristia. Esta verdade não exprime apenas ' +
          'uma experiência cotidiana de fé, mas resume o núcleo do ' +
          'mistério da Igreja.',
      },
    ],
  },
];

function toReaderContent(d: MagisteriumDocSeed): ReaderContent {
  return {
    id: buildId('magisterium', d.slug),
    kind: 'magisterium',
    title: d.title,
    subtitle: d.author,
    metadata: {
      author: d.author,
      publishedAt: d.publishedAt,
      canonicalRef: d.title,
      source: 'Magistério',
      language: 'pt-BR',
    },
    sections: d.paragraphs,
  };
}

export const MagisteriumAdapter: ContentAdapter = {
  kind: 'magisterium',
  label: 'Magistério',

  async get(params: ContentGetParams): Promise<ReaderContent | null> {
    const slug = String(params.doc ?? '');
    const hit = SEED.find((d) => d.slug === slug);
    return hit ? toReaderContent(hit) : null;
  },

  async search(query: string, limit = 10): Promise<SearchResult[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return SEED
      .filter((d) => {
        const hay = `${d.title} ${d.author} ${d.paragraphs.map((p) => p.body).join(' ')}`;
        return hay.toLowerCase().includes(q);
      })
      .slice(0, limit)
      .map((d) => ({
        nodeId: buildId('magisterium', d.slug),
        kind: 'magisterium' as const,
        label: d.title,
        snippet: d.paragraphs[0]?.body.slice(0, 140),
      }));
  },
};
