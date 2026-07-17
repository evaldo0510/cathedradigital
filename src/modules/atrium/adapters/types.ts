/**
 * Contratos de adapters do Ambiente Átrio.
 *
 * Regra de ouro (Fase 3):
 *   - Componentes NUNCA conhecem Supabase, Edge Functions, React Query, fetch.
 *   - Toda origem de dado passa por um adapter tipado deste arquivo.
 *   - Na Sprint 2.0.6 trocamos apenas a implementação (Mock → Supabase).
 */

import type {
  AtriumProfile,
  LiturgicalContext,
  ResumeItem,
  AtriumExit,
} from '../types';

export interface JourneyAdapter {
  /** Retorna até 3 itens do Estado E9 "Continuar minha caminhada". */
  getResume(): Promise<ResumeItem[]>;
}

export interface SearchSuggestion {
  id: string;
  label: string;
  hint?: string;
}
export interface SearchAdapter {
  /** Sugestões estáticas exibidas antes da digitação (chips). */
  getSuggestions(): Promise<SearchSuggestion[]>;
}

export interface ThemeEntry {
  slug: string;
  label: string;
  short?: string;
}
export interface ThemeAdapter {
  /** Temas em destaque para "Explorar por Tema". */
  getFeatured(): Promise<ThemeEntry[]>;
}

export interface LiturgyAdapter {
  getToday(): Promise<LiturgicalContext | null>;
}

export interface RecommendationItem {
  id: string;
  label: string;
  kind: 'reading' | 'formation' | 'lectio' | 'saint' | 'magisterium';
  targetPath: string;
}
export interface RecommendationAdapter {
  getForProfile(profile: AtriumProfile): Promise<RecommendationItem[]>;
}

export interface AtriumUser {
  profile: AtriumProfile;
  displayName?: string;
  isAuthenticated: boolean;
}
export interface ProfileAdapter {
  getCurrent(): Promise<AtriumUser>;
}

export interface AnnouncementItem {
  id: string;
  label: string;
  publishedAt: string; // ISO
}
export interface AnnouncementAdapter {
  getRecent(): Promise<AnnouncementItem[]>;
}

/** Registro único de adapters injetados no módulo. */
export interface AtriumAdapters {
  journey: JourneyAdapter;
  search: SearchAdapter;
  theme: ThemeAdapter;
  liturgy: LiturgyAdapter;
  recommendation: RecommendationAdapter;
  profile: ProfileAdapter;
  announcement: AnnouncementAdapter;
}

export type { AtriumExit };
