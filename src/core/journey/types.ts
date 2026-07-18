/**
 * Journey Core — Tipos públicos.
 *
 * Domínio interno: Journey (tabela `journeys`).
 * UI apresenta como "Formação" (coleção) e "Caminho" (unidade).
 */

export type JourneyDifficulty = 'iniciante' | 'intermediario' | 'avancado' | string;

export type JourneyStepType =
  | 'reading'
  | 'reflection'
  | 'prayer'
  | 'quiz'
  | 'exercise'
  | 'video'
  | string;

/**
 * Conteúdo do passo — JSONB livre no backend.
 * Campos conhecidos são opcionais; consumidores devem tratar ausência.
 */
export interface JourneyStepContent {
  interpretation?: string;
  html?: string;
  padh?: unknown;
  final_question?: string;
  guided_exercise?: unknown;
  [key: string]: unknown;
}

export interface Journey {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  icon: string | null;
  cover_url: string | null;
  category: string | null;
  difficulty: JourneyDifficulty | null;
  estimated_days: number | null;
  is_premium: boolean;
  is_active: boolean;
  sort_order: number;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  /** true quando a origem é `itineraria` (compatibilidade). */
  is_legacy?: boolean;
}

export interface JourneyStep {
  id: string;
  journey_id: string;
  step_order: number;
  title: string;
  subtitle: string | null;
  step_type: JourneyStepType;
  content: JourneyStepContent;
  duration_minutes: number | null;
  is_free: boolean;
  created_at: string;
  updated_at: string;
  is_legacy?: boolean;
}

export interface JourneyProgress {
  id: string;
  user_id: string;
  journey_id: string;
  step_id: string | null;
  completed_at: string;
  reflection: string | null;
}

export interface JourneyStats {
  journey_id: string;
  total_steps: number;
  users_started: number;
  users_completed: number;
  completion_rate: number;
}

export interface JourneyGlobalStats {
  total_journeys: number;
  total_active_users: number;
  total_completions: number;
}

export interface JourneyRecommendation {
  journey: Journey;
  reason: string;
  score: number;
}

export interface JourneyListFilters {
  category?: string;
  difficulty?: JourneyDifficulty;
  is_premium?: boolean;
  is_active?: boolean;
  tags?: string[];
  search?: string;
  limit?: number;
  offset?: number;
}

export interface JourneyNexusLink {
  step_id: string;
  target_type: string;
  target_id: string;
  label?: string;
}

/** Envelope padrão de retorno. */
export interface ServiceResult<T> {
  data: T | null;
  error: Error | null;
}

/** Input para criar/atualizar. */
export type JourneyCreateInput = Omit<Journey, 'id' | 'created_at' | 'updated_at' | 'is_legacy'>;
export type JourneyPatch = Partial<JourneyCreateInput>;
export type JourneyStepUpsertInput = Omit<
  JourneyStep,
  'id' | 'created_at' | 'updated_at' | 'is_legacy'
> & { id?: string };
