/**
 * EnvironmentRegistry — descreve os 5 ambientes canônicos.
 * Não conhece rotas literais nem componentes — apenas metadados semânticos.
 */

import type { EnvironmentKey, RouteKey } from './types';

export interface EnvironmentDescriptor {
  key: EnvironmentKey;
  label: string;
  iconToken: string;        // nome do ícone Lucide; render é responsabilidade da UI
  route: RouteKey;          // resolvido via RouteRegistry
  order: number;            // ordem canônica no Átrio (P4)
  description: string;      // frase-âncora curta
}

const ENVIRONMENTS: Record<EnvironmentKey, EnvironmentDescriptor> = {
  'estudar': {
    key: 'estudar',
    label: 'Estudar',
    iconToken: 'BookOpen',
    route: 'env.estudar',
    order: 1,
    description: 'Aprofundar-se nas fontes: Bíblia, Catecismo, Magistério, Padres, Concílios, Santos e Direito Canônico.',
  },
  'rezar': {
    key: 'rezar',
    label: 'Rezar',
    iconToken: 'HandHeart',
    route: 'env.rezar',
    order: 2,
    description: 'Vida de oração: liturgia, lectio divina, ofício, terço e devoções.',
  },
  'formar-se': {
    key: 'formar-se',
    label: 'Formar-se',
    iconToken: 'GraduationCap',
    route: 'env.formar-se',
    order: 3,
    description: 'Cursos, itinerários e trilhas de formação da fé.',
  },
  'pesquisar': {
    key: 'pesquisar',
    label: 'Pesquisar',
    iconToken: 'SearchCode',
    route: 'env.pesquisar',
    order: 4,
    description: 'Busca universal por temas, documentos, autores e passagens.',
  },
  'minha-jornada': {
    key: 'minha-jornada',
    label: 'Minha Jornada',
    iconToken: 'Compass',
    route: 'env.minha-jornada',
    order: 5,
    description: 'Histórico, marcadores, notas e progresso pessoal.',
  },
};

export const EnvironmentRegistry = {
  all(): EnvironmentDescriptor[] {
    return Object.values(ENVIRONMENTS).sort((a, b) => a.order - b.order);
  },
  get(key: EnvironmentKey): EnvironmentDescriptor {
    return ENVIRONMENTS[key];
  },
};
