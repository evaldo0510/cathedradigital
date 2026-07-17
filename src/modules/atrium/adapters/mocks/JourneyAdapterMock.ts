/**
 * JourneyAdapterMock — Fase 4A.
 * Rotas resolvidas via RouteRegistry (Core). O componente continua recebendo
 * `targetPath` como string opaca.
 */

import type { JourneyAdapter } from '../types';
import type { ResumeItem } from '../../types';
import { RouteRegistry } from '@/core/navigation';

const NOW = new Date().toISOString();

const ITEMS: ResumeItem[] = [
  {
    id: 'r1', kind: 'reading', label: 'Continue João 6', progressPct: 42, lastActivityAt: NOW,
    targetPath: RouteRegistry.resolve('study.bible', { book: 'joao', chapter: 6 }),
  },
  {
    id: 'r2', kind: 'lectio', label: 'Continue a Lectio Divina', progressPct: 60, lastActivityAt: NOW,
    targetPath: RouteRegistry.resolve('pray.lectio', { slug: 'hoje' }),
  },
  {
    id: 'r3', kind: 'formation', label: 'Retome a Formação em Fé', progressPct: 25, lastActivityAt: NOW,
    targetPath: RouteRegistry.resolve('env.formar-se'),
  },
];

export const JourneyAdapterMock: JourneyAdapter = {
  async getResume() {
    return ITEMS.slice(0, 3);
  },
};
