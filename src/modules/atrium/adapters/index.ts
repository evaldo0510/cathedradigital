/**
 * Registro único de adapters do Ambiente Átrio.
 * Fase 3: todos mockados.
 * Sprint 2.0.6: trocar `Mock` por `Supabase` sem alterar componentes.
 */

import type { AtriumAdapters } from './types';
import { JourneyAdapterMock } from './mocks/JourneyAdapterMock';
import { SearchAdapterMock } from './mocks/SearchAdapterMock';
import { ThemeAdapterMock } from './mocks/ThemeAdapterMock';
import { LiturgyAdapterMock } from './mocks/LiturgyAdapterMock';
import { RecommendationAdapterMock } from './mocks/RecommendationAdapterMock';
import { ProfileAdapterMock } from './mocks/ProfileAdapterMock';
import { AnnouncementAdapterMock } from './mocks/AnnouncementAdapterMock';

export const atriumAdapters: AtriumAdapters = {
  journey: JourneyAdapterMock,
  search: SearchAdapterMock,
  theme: ThemeAdapterMock,
  liturgy: LiturgyAdapterMock,
  recommendation: RecommendationAdapterMock,
  profile: ProfileAdapterMock,
  announcement: AnnouncementAdapterMock,
};

export * from './types';
