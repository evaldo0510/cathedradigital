/**
 * Nexus Intelligence — regras de continuidade após concluir uma jornada.
 */
import { describe, expect, it } from 'vitest';
import {
  resolveNextPath,
  type JourneyCandidate,
  type JourneyNexusNode,
} from '@/core/knowledge/intelligence/nextPathEngine';

const current: JourneyCandidate = {
  id: 'j-cruz',
  slug: 'a-cruz-e-a-esperanca',
  title: 'A Cruz e a Esperança',
  category: 'cura',
  tags: ['sofrimento', 'cruz'],
  difficulty: 'iniciante',
  sort_order: 35,
};

const candidates: JourneyCandidate[] = [
  current,
  { id: 'j-nexus', slug: 'via-dolorosa', title: 'Via Dolorosa', category: 'oracao', tags: [], difficulty: 'iniciante', sort_order: 90 },
  { id: 'j-cat', slug: 'cura-emocional', title: 'Cura Emocional', category: 'cura', tags: [], difficulty: 'iniciante', sort_order: 11 },
  { id: 'j-done', slug: 'concluida', title: 'Concluída', category: 'cura', tags: ['cruz'], difficulty: 'iniciante', sort_order: 1 },
];

const node = (key: string, label: string): JourneyNexusNode => ({
  key,
  kind: key.split('#')[0],
  label,
});

const nexusByJourney = new Map<string, JourneyNexusNode[]>([
  ['a-cruz-e-a-esperanca', [node('catechism_paragraph#1817', 'CIC §1817'), node('prayer#via-sacra', 'Via-Sacra')]],
  ['via-dolorosa', [node('prayer#via-sacra', 'Via-Sacra'), node('catechism_paragraph#1817', 'CIC §1817')]],
  ['cura-emocional', []],
]);

describe('resolveNextPath', () => {
  const recs = resolveNextPath({
    current,
    candidates,
    nexusByJourney,
    completedJourneyIds: new Set(['j-done']),
  });

  it('nunca recomenda a jornada atual nem as já concluídas', () => {
    expect(recs.map((r) => r.journey.id)).not.toContain('j-cruz');
    expect(recs.map((r) => r.journey.id)).not.toContain('j-done');
  });

  it('prioriza co-citação no Nexus sobre categoria', () => {
    expect(recs[0].journey.id).toBe('j-nexus');
    expect(recs[0].signal).toBe('nexus');
    expect(recs[0].sharedNodes).toHaveLength(2);
  });

  it('explica o motivo de cada recomendação', () => {
    expect(recs[0].reason).toContain('Via-Sacra');
    const byCategory = recs.find((r) => r.journey.id === 'j-cat');
    expect(byCategory?.signal).toBe('category');
    expect(byCategory?.reason).toContain('cura');
  });

  it('respeita o limite', () => {
    expect(
      resolveNextPath({ current, candidates, nexusByJourney, limit: 1 }),
    ).toHaveLength(1);
  });
});
