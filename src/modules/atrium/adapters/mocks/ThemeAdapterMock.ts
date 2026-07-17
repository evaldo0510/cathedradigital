import type { ThemeAdapter, ThemeEntry } from '../types';

const THEMES: ThemeEntry[] = [
  { slug: 'eucaristia',   label: 'Eucaristia',    short: 'Fonte e cume' },
  { slug: 'trindade',     label: 'Trindade',      short: 'Deus Uno e Trino' },
  { slug: 'graca',        label: 'Graça',         short: 'Dom sobrenatural' },
  { slug: 'oracao',       label: 'Oração',        short: 'Colóquio com Deus' },
  { slug: 'escatologia',  label: 'Últimas coisas', short: 'Céu, juízo, eternidade' },
  { slug: 'liturgia',     label: 'Liturgia',      short: 'Culto público da Igreja' },
];

export const ThemeAdapterMock: ThemeAdapter = {
  async getFeatured() {
    return THEMES;
  },
};
