import type { JourneyAdapter } from '../types';
import type { ResumeItem } from '../../types';

const NOW = new Date().toISOString();

const ITEMS: ResumeItem[] = [
  { id: 'r1', kind: 'reading',   label: 'Continue João 6',              targetPath: '/estudar/biblia/joao/6',       progressPct: 42, lastActivityAt: NOW },
  { id: 'r2', kind: 'lectio',    label: 'Continue a Lectio Divina',     targetPath: '/rezar/lectio/hoje',           progressPct: 60, lastActivityAt: NOW },
  { id: 'r3', kind: 'formation', label: 'Retome a Formação em Fé',      targetPath: '/formar-se/curso/fe-catolica', progressPct: 25, lastActivityAt: NOW },
];

export const JourneyAdapterMock: JourneyAdapter = {
  async getResume() {
    return ITEMS.slice(0, 3);
  },
};
