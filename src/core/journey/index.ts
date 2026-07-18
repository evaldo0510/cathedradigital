/**
 * Journey Core — barrel público.
 *
 * Consumidores devem importar APENAS daqui:
 *   import { JourneyService, type Journey } from "@/core/journey";
 *
 * Regras congeladas (ver README.md):
 * - Nenhuma UI acessa `journeys | journey_steps | journey_progress | itineraria*`
 *   diretamente. Tudo passa pelo JourneyService.
 * - JourneyAdapter é interno. NÃO é reexportado.
 * - Nomenclatura de UI: "Formação" (coleção) e "Caminho" (unidade).
 */

export { JourneyService } from './JourneyService';
export type { JourneyServiceType } from './JourneyService';
export type {
  Journey,
  JourneyStep,
  JourneyStepContent,
  JourneyStepType,
  JourneyDifficulty,
  JourneyProgress,
  JourneyStats,
  JourneyGlobalStats,
  JourneyRecommendation,
  JourneyListFilters,
  JourneyNexusLink,
  JourneyCreateInput,
  JourneyPatch,
  JourneyStepUpsertInput,
  ServiceResult,
} from './types';
