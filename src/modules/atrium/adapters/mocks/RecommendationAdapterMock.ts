import type { RecommendationAdapter, RecommendationItem } from '../types';
import type { AtriumProfile } from '../../types';

const BASE: RecommendationItem[] = [
  { id: 'rc1', label: 'Lumen Gentium — cap. I',       kind: 'magisterium', targetPath: '/estudar/magisterio/lumen-gentium/1' },
  { id: 'rc2', label: 'Vida de Santo Agostinho',      kind: 'saint',       targetPath: '/estudar/santos/santo-agostinho' },
  { id: 'rc3', label: 'Lectio: Mt 5, 1-12',           kind: 'lectio',      targetPath: '/rezar/lectio/mt-5-1-12' },
  { id: 'rc4', label: 'Curso: Introdução à Fé',       kind: 'formation',   targetPath: '/formar-se/curso/introducao-fe' },
  { id: 'rc5', label: 'Salmo 63 — meditação',         kind: 'reading',     targetPath: '/estudar/biblia/salmos/63' },
];

const BY_PROFILE: Record<AtriumProfile, string[]> = {
  visitor:    ['rc1', 'rc4', 'rc2'],
  recurrent:  ['rc3', 'rc1', 'rc5'],
  catechist:  ['rc4', 'rc1', 'rc2'],
  priest:     ['rc1', 'rc3', 'rc2'],
  seminarian: ['rc1', 'rc2', 'rc4'],
};

export const RecommendationAdapterMock: RecommendationAdapter = {
  async getForProfile(profile) {
    const ids = BY_PROFILE[profile];
    return ids.map((id) => BASE.find((b) => b.id === id)!).filter(Boolean);
  },
};
