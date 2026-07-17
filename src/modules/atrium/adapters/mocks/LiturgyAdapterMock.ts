import type { LiturgyAdapter } from '../types';
import type { LiturgicalContext } from '../../types';

const TODAY: LiturgicalContext = {
  season: 'Tempo Comum',
  weekday: 'sexta-feira',
  colorToken: 'liturgical-green',
  saintOfDay: { name: 'São Boaventura', title: 'Bispo e Doutor', slug: 'sao-boaventura' },
};

export const LiturgyAdapterMock: LiturgyAdapter = {
  async getToday() {
    return TODAY;
  },
};
