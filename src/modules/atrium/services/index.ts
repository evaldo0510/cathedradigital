/**
 * Contratos de serviços do Átrio.
 * Fase 1: apenas as interfaces. As implementações reais entram na Fase 6.
 *
 * Toda comunicação com outros ambientes acontece por AQUI.
 * O restante do módulo só depende destas interfaces — nunca de componentes
 * ou serviços de outros ambientes diretamente.
 */

import type {
  AtriumSnapshot,
  LiturgicalContext,
  ResumeItem,
  AtriumProfile,
} from '../types';

/** Contrato do provedor litúrgico (Fase 6 conectará ao serviço existente). */
export interface LiturgyProvider {
  getToday(): Promise<LiturgicalContext | null>;
}

/** Contrato do provedor de continuidade (Fase 6 → tabela user_events). */
export interface ResumeProvider {
  getRecent(limit: number): Promise<ResumeItem[]>;
}

/** Contrato do provedor de perfil (Fase 6 → Minha Jornada). */
export interface ProfileProvider {
  getProfile(): Promise<{ profile: AtriumProfile; displayName?: string }>;
}

/** Agregador que compõe o snapshot final. Único consumo do AtriumPage. */
export interface AtriumService {
  getSnapshot(): Promise<AtriumSnapshot>;
}
