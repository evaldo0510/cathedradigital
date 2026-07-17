/**
 * CatechismAdapter (mock) — Sprint 2.0.4B-1.
 *
 * Devolve parágrafos do CIC em formato `ReaderContent`. Substituição
 * pela leitura real de `catechism_official` acontece na Sprint 2.0.5.
 */

import type { ContentAdapter, ContentGetParams } from './types';
import type { ReaderContent, SearchResult } from '../contracts';
import { buildId } from '@/core/knowledge';

interface CatechismParagraphSeed {
  paragraph: number;
  title: string;
  body: string;
}

const SEED: CatechismParagraphSeed[] = [
  {
    paragraph: 1817,
    title: 'A virtude da esperança',
    body:
      'A esperança é a virtude teologal pela qual desejamos o Reino dos ' +
      'céus e a vida eterna como nossa felicidade, colocando a nossa ' +
      'confiança nas promessas de Cristo.',
  },
  {
    paragraph: 1322,
    title: 'O sacramento da Eucaristia',
    body:
      'A sagrada Eucaristia completa a iniciação cristã. Nela recebemos ' +
      'o próprio Cristo, memorial da sua Páscoa.',
  },
  {
    paragraph: 1996,
    title: 'A graça',
    body:
      'A nossa justificação vem da graça de Deus. A graça é o favor, o ' +
      'auxílio gratuito que Deus nos dá para respondermos ao seu apelo.',
  },
];

function toReaderContent(p: CatechismParagraphSeed): ReaderContent {
  return {
    id: buildId('catechism', String(p.paragraph)),
    kind: 'catechism',
    title: p.title,
    subtitle: `CIC § ${p.paragraph}`,
    metadata: {
      canonicalRef: `CIC § ${p.paragraph}`,
      source: 'Catecismo da Igreja Católica',
      language: 'pt-BR',
    },
    sections: [{ anchor: String(p.paragraph), body: p.body }],
  };
}

export const CatechismAdapter: ContentAdapter = {
  kind: 'catechism',
  label: 'Catecismo',

  async get(params: ContentGetParams): Promise<ReaderContent | null> {
    const paragraph = Number(params.paragraph ?? 0);
    const hit = SEED.find((p) => p.paragraph === paragraph);
    return hit ? toReaderContent(hit) : null;
  },

  async search(query: string, limit = 10): Promise<SearchResult[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return SEED
      .filter((p) =>
        `${p.title} ${p.body}`.toLowerCase().includes(q),
      )
      .slice(0, limit)
      .map((p) => ({
        nodeId: buildId('catechism', String(p.paragraph)),
        kind: 'catechism' as const,
        label: `CIC § ${p.paragraph}`,
        snippet: p.body.slice(0, 140),
      }));
  },
};
