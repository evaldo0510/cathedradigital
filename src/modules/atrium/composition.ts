/**
 * Composition registry do Ambiente Átrio.
 *
 * ÚNICO lugar do módulo que decide:
 *   - qual bloco aparece
 *   - em que ordem aparece
 *   - para qual perfil aparece
 *
 * Trocar a experiência de um sacerdote, um visitante ou um catequista =
 * editar este arquivo. Nenhum componente-bloco precisa mudar.
 *
 * Fundamentação: ATRIUM-CONTRACT.md §6b (perfis) e §6c (P0..P6).
 */

import type { ComponentType } from 'react';
import type { AtriumBlock, AtriumProfile } from './types';
import { PROFILE_BLOCK_ORDER } from './constants';

import Header from './components/Header';
import JourneyResume from './components/Journey';
import UniversalSearch from './components/Search';
import ThemeExplorer from './components/ThemeExplorer';
import DailyLiturgy from './components/Liturgy';
import EnvironmentGrid from './components/EnvironmentGrid';
import Recommendations from './components/Recommendations';
import News from './components/News';

/** Mapa AtriumBlock → componente responsável. */
export const BLOCK_COMPONENT: Record<AtriumBlock, ComponentType> = {
  continue_journey: JourneyResume,
  universal_search: UniversalSearch,
  theme_entry: ThemeExplorer,
  daily_liturgy: DailyLiturgy,
  five_environments: EnvironmentGrid,
  recommendations: Recommendations,
  announcements: News,
};

/** Header é fixo — não entra na ordenação por perfil. */
export const AtriumHeader = Header;

/**
 * Resolve a lista final de componentes para um perfil.
 * Bloco não mapeado é ignorado silenciosamente (defesa contra typo futuro).
 */
export function resolveComposition(profile: AtriumProfile): ComponentType[] {
  return PROFILE_BLOCK_ORDER[profile]
    .map((b) => BLOCK_COMPONENT[b])
    .filter((c): c is ComponentType => Boolean(c));
}
