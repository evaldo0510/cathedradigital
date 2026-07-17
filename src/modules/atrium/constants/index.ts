/**
 * Constantes do Ambiente Átrio.
 * Fonte: docs/cathedra-2.0/ATRIUM-CONTRACT.md §6b, §6c.
 */

import type { AtriumBlock, AtriumProfile, AtriumExit } from '../types';

/** §6c — ordem base P0 → P6. */
export const BLOCK_PRIORITY: AtriumBlock[] = [
  'continue_journey',   // P0
  'universal_search',   // P1
  'theme_entry',        // P2
  'daily_liturgy',      // P3
  'five_environments',  // P4
  'recommendations',    // P5
  'announcements',      // P6
];

/**
 * §6b — personalização de missão por perfil.
 * Só reordena entre P2, P3 e P5. Nunca altera P0, P1, P4.
 */
export const PROFILE_BLOCK_ORDER: Record<AtriumProfile, AtriumBlock[]> = {
  visitor: [
    'universal_search',
    'daily_liturgy',
    'theme_entry',
    'five_environments',
    'recommendations',
    'announcements',
  ],
  recurrent: [
    'continue_journey',
    'universal_search',
    'recommendations',
    'theme_entry',
    'daily_liturgy',
    'five_environments',
    'announcements',
  ],
  catechist: [
    'continue_journey',
    'universal_search',
    'theme_entry',
    'daily_liturgy',
    'five_environments',
    'recommendations',
    'announcements',
  ],
  priest: [
    'continue_journey',
    'universal_search',
    'daily_liturgy',
    'theme_entry',
    'five_environments',
    'recommendations',
    'announcements',
  ],
  seminarian: [
    'continue_journey',
    'universal_search',
    'theme_entry',
    'recommendations',
    'daily_liturgy',
    'five_environments',
    'announcements',
  ],
};

/** §3 — cinco saídas oficiais do Átrio (rotas destino do 2.0). */
export const ENVIRONMENT_ROUTES: Record<AtriumExit, string> = {
  'estudar': '/estudar',
  'rezar': '/rezar',
  'formar-se': '/formar-se',
  'pesquisar': '/pesquisar',
  'minha-jornada': '/minha-jornada',
};
