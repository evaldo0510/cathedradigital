/**
 * JourneyService — API pública oficial do domínio Journey.
 *
 * Regra: nenhum componente de UI consulta o backend diretamente para
 * `journeys | journey_steps | journey_progress | itineraria*`. Todo acesso
 * passa por este service.
 *
 * Fluxo: UI → JourneyService → JourneyAdapter → backend.
 *
 * Compatibilidade: `itineraria` é lida via adapter durante a Fase C. Escrita
 * no path legado é bloqueada — admin edita apenas `journeys` reais.
 */

import { supabase } from '@/integrations/supabase/client';
import { JourneyAdapter } from './JourneyAdapter';
import type {
  Journey,
  JourneyCreateInput,
  JourneyGlobalStats,
  JourneyListFilters,
  JourneyNexusLink,
  JourneyPatch,
  JourneyProgress,
  JourneyRecommendation,
  JourneyStats,
  JourneyStep,
  JourneyStepUpsertInput,
  ServiceResult,
} from './types';

type SB = typeof supabase;

function ok<T>(data: T): ServiceResult<T> {
  return { data, error: null };
}
function fail<T>(error: unknown): ServiceResult<T> {
  const err = error instanceof Error ? error : new Error(String(error));
  return { data: null, error: err };
}

const LEGACY_WRITE_ERROR = new Error(
  '[JourneyService] Escrita bloqueada em conteúdo legado (itineraria). Migre para journeys antes de editar.',
);

async function fetchJourneyById(id: string): Promise<Journey | null> {
  if (JourneyAdapter.isLegacyId(id)) {
    const raw = JourneyAdapter.fromLegacyId(id);
    const { data, error } = await (supabase as SB)
      .from('itineraria' as any)
      .select('*')
      .eq('id', raw)
      .maybeSingle();
    if (error) throw error;
    return data ? JourneyAdapter.fromItineraria(data as any) : null;
  }
  const { data, error } = await supabase.from('journeys').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? JourneyAdapter.fromJourneyRow(data as any) : null;
}

export const JourneyService = {
  // ─────────────────────────── Leitura ───────────────────────────

  async list(filters: JourneyListFilters = {}): Promise<ServiceResult<Journey[]>> {
    try {
      let q = supabase.from('journeys').select('*');
      if (filters.category) q = q.eq('category', filters.category);
      if (filters.difficulty) q = q.eq('difficulty', filters.difficulty);
      if (typeof filters.is_premium === 'boolean') q = q.eq('is_premium', filters.is_premium);
      if (typeof filters.is_active === 'boolean') q = q.eq('is_active', filters.is_active);
      if (filters.tags?.length) q = q.overlaps('tags', filters.tags);
      if (filters.search) q = q.ilike('title', `%${filters.search}%`);
      q = q.order('sort_order', { ascending: true });
      if (filters.limit) q = q.limit(filters.limit);
      if (filters.offset) q = q.range(filters.offset, filters.offset + (filters.limit ?? 50) - 1);

      const { data, error } = await q;
      if (error) throw error;
      return ok((data ?? []).map((r) => JourneyAdapter.fromJourneyRow(r as any)));
    } catch (e) {
      return fail(e);
    }
  },

  /**
   * Busca por slug. Como o schema atual não tem coluna `slug`, tratamos o
   * parâmetro como `id` (UUID puro ou prefixado `itin:`). Deep links legados
   * `/jornadas/:id` continuam funcionando.
   */
  async getBySlug(slug: string): Promise<ServiceResult<Journey>> {
    return JourneyService.getById(slug);
  },

  async getById(id: string): Promise<ServiceResult<Journey>> {
    try {
      const j = await fetchJourneyById(id);
      return ok(j as Journey);
    } catch (e) {
      return fail(e);
    }
  },

  async listSteps(journeyId: string): Promise<ServiceResult<JourneyStep[]>> {
    try {
      if (JourneyAdapter.isLegacyId(journeyId)) {
        const raw = JourneyAdapter.fromLegacyId(journeyId);
        const { data, error } = await (supabase as SB)
          .from('itineraria_steps' as any)
          .select('*')
          .eq('itinerarium_id', raw)
          .order('step_order', { ascending: true });
        if (error) throw error;
        return ok((data ?? []).map((r) => JourneyAdapter.fromItinerariaStep(r as any)));
      }
      const { data, error } = await supabase
        .from('journey_steps')
        .select('*')
        .eq('journey_id', journeyId)
        .order('step_order', { ascending: true });
      if (error) throw error;
      return ok((data ?? []).map((r) => JourneyAdapter.fromJourneyStepRow(r as any)));
    } catch (e) {
      return fail(e);
    }
  },

  async getStep(journeyId: string, order: number): Promise<ServiceResult<JourneyStep>> {
    try {
      if (JourneyAdapter.isLegacyId(journeyId)) {
        const raw = JourneyAdapter.fromLegacyId(journeyId);
        const { data, error } = await (supabase as SB)
          .from('itineraria_steps' as any)
          .select('*')
          .eq('itinerarium_id', raw)
          .eq('step_order', order)
          .maybeSingle();
        if (error) throw error;
        return ok(data ? JourneyAdapter.fromItinerariaStep(data as any) : (null as any));
      }
      const { data, error } = await supabase
        .from('journey_steps')
        .select('*')
        .eq('journey_id', journeyId)
        .eq('step_order', order)
        .maybeSingle();
      if (error) throw error;
      return ok(data ? JourneyAdapter.fromJourneyStepRow(data as any) : (null as any));
    } catch (e) {
      return fail(e);
    }
  },

  async getFirstStep(journeyId: string): Promise<ServiceResult<JourneyStep>> {
    return JourneyService.getStep(journeyId, 1);
  },

  async getRelated(journeyId: string, limit = 4): Promise<ServiceResult<Journey[]>> {
    try {
      const { data: base } = await JourneyService.getById(journeyId);
      if (!base) return ok([]);
      let q = supabase
        .from('journeys')
        .select('*')
        .eq('is_active', true)
        .neq('id', JourneyAdapter.isLegacyId(journeyId) ? '' : journeyId)
        .limit(limit);
      if (base.category) q = q.eq('category', base.category);
      const { data, error } = await q;
      if (error) throw error;
      return ok((data ?? []).map((r) => JourneyAdapter.fromJourneyRow(r as any)));
    } catch (e) {
      return fail(e);
    }
  },

  // ─────────────────────────── Progresso ───────────────────────────

  async getProgress(
    userId: string,
    journeyId: string,
  ): Promise<ServiceResult<JourneyProgress[]>> {
    try {
      if (JourneyAdapter.isLegacyId(journeyId)) {
        const raw = JourneyAdapter.fromLegacyId(journeyId);
        const { data, error } = await (supabase as SB)
          .from('itineraria_progress' as any)
          .select('*')
          .eq('user_id', userId)
          .eq('itinerarium_id', raw);
        if (error) throw error;
        return ok(
          (data ?? []).map((r: any) => ({
            id: r.id,
            user_id: r.user_id,
            journey_id: JourneyAdapter.toLegacyId(r.itinerarium_id),
            step_id: r.step_id ? JourneyAdapter.toLegacyId(r.step_id) : null,
            completed_at: r.completed_at,
            reflection: r.reflection ?? null,
          })),
        );
      }
      const { data, error } = await supabase
        .from('journey_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('journey_id', journeyId);
      if (error) throw error;
      return ok((data ?? []) as JourneyProgress[]);
    } catch (e) {
      return fail(e);
    }
  },

  async startJourney(
    userId: string,
    journeyId: string,
  ): Promise<ServiceResult<JourneyProgress>> {
    try {
      if (JourneyAdapter.isLegacyId(journeyId)) return fail(LEGACY_WRITE_ERROR);
      const { data: first } = await JourneyService.getFirstStep(journeyId);
      const { data, error } = await supabase
        .from('journey_progress')
        .insert({
          user_id: userId,
          journey_id: journeyId,
          step_id: first?.id ?? null,
        })
        .select()
        .maybeSingle();
      if (error) throw error;
      return ok(data as JourneyProgress);
    } catch (e) {
      return fail(e);
    }
  },

  async completeStep(
    userId: string,
    journeyId: string,
    stepOrder: number,
    reflection?: string,
  ): Promise<ServiceResult<JourneyProgress>> {
    try {
      if (JourneyAdapter.isLegacyId(journeyId)) return fail(LEGACY_WRITE_ERROR);
      const { data: step } = await JourneyService.getStep(journeyId, stepOrder);
      if (!step) throw new Error(`Passo ${stepOrder} não encontrado`);
      const { data, error } = await supabase
        .from('journey_progress')
        .insert({
          user_id: userId,
          journey_id: journeyId,
          step_id: step.id,
          reflection: reflection ?? null,
        })
        .select()
        .maybeSingle();
      if (error) throw error;
      return ok(data as JourneyProgress);
    } catch (e) {
      return fail(e);
    }
  },

  async resumeJourney(
    userId: string,
    journeyId: string,
  ): Promise<ServiceResult<JourneyStep>> {
    try {
      const { data: progress } = await JourneyService.getProgress(userId, journeyId);
      const { data: steps } = await JourneyService.listSteps(journeyId);
      if (!steps || steps.length === 0) return ok(null as any);
      const doneIds = new Set((progress ?? []).map((p) => p.step_id));
      const next = steps.find((s) => !doneIds.has(s.id)) ?? steps[steps.length - 1];
      return ok(next);
    } catch (e) {
      return fail(e);
    }
  },

  async listUserJourneys(userId: string): Promise<ServiceResult<Journey[]>> {
    try {
      const { data, error } = await supabase
        .from('journey_progress')
        .select('journey_id')
        .eq('user_id', userId);
      if (error) throw error;
      const ids = Array.from(new Set((data ?? []).map((r: any) => r.journey_id).filter(Boolean)));
      if (ids.length === 0) return ok([]);
      const { data: js, error: e2 } = await supabase.from('journeys').select('*').in('id', ids);
      if (e2) throw e2;
      return ok((js ?? []).map((r) => JourneyAdapter.fromJourneyRow(r as any)));
    } catch (e) {
      return fail(e);
    }
  },

  async resetProgress(userId: string, journeyId: string): Promise<ServiceResult<true>> {
    try {
      if (JourneyAdapter.isLegacyId(journeyId)) return fail(LEGACY_WRITE_ERROR);
      const { error } = await supabase
        .from('journey_progress')
        .delete()
        .eq('user_id', userId)
        .eq('journey_id', journeyId);
      if (error) throw error;
      return ok(true);
    } catch (e) {
      return fail(e);
    }
  },

  // ─────────────────────────── Admin ───────────────────────────

  async createJourney(input: JourneyCreateInput): Promise<ServiceResult<Journey>> {
    try {
      const { data, error } = await supabase.from('journeys').insert(input).select().maybeSingle();
      if (error) throw error;
      return ok(JourneyAdapter.fromJourneyRow(data as any));
    } catch (e) {
      return fail(e);
    }
  },

  async updateJourney(id: string, patch: JourneyPatch): Promise<ServiceResult<Journey>> {
    try {
      if (JourneyAdapter.isLegacyId(id)) return fail(LEGACY_WRITE_ERROR);
      const { data, error } = await supabase
        .from('journeys')
        .update(patch)
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return ok(JourneyAdapter.fromJourneyRow(data as any));
    } catch (e) {
      return fail(e);
    }
  },

  async upsertStep(
    journeyId: string,
    step: JourneyStepUpsertInput,
  ): Promise<ServiceResult<JourneyStep>> {
    try {
      if (JourneyAdapter.isLegacyId(journeyId)) return fail(LEGACY_WRITE_ERROR);
      const payload = { ...step, journey_id: journeyId };
      const { data, error } = await supabase
        .from('journey_steps')
        .upsert(payload as any)
        .select()
        .maybeSingle();
      if (error) throw error;
      return ok(JourneyAdapter.fromJourneyStepRow(data as any));
    } catch (e) {
      return fail(e);
    }
  },

  async deleteJourney(id: string): Promise<ServiceResult<true>> {
    try {
      if (JourneyAdapter.isLegacyId(id)) return fail(LEGACY_WRITE_ERROR);
      const { error } = await supabase.from('journeys').delete().eq('id', id);
      if (error) throw error;
      return ok(true);
    } catch (e) {
      return fail(e);
    }
  },

  // ─────────────────────────── Stats / Nexus ───────────────────────────

  async getStats(journeyId: string): Promise<ServiceResult<JourneyStats>> {
    try {
      const { data: steps } = await JourneyService.listSteps(journeyId);
      const total_steps = steps?.length ?? 0;

      if (JourneyAdapter.isLegacyId(journeyId)) {
        return ok({
          journey_id: journeyId,
          total_steps,
          users_started: 0,
          users_completed: 0,
          completion_rate: 0,
        });
      }
      const { data, error } = await supabase
        .from('journey_progress')
        .select('user_id, step_id')
        .eq('journey_id', journeyId);
      if (error) throw error;
      const rows = data ?? [];
      const users_started = new Set(rows.map((r: any) => r.user_id)).size;
      // completed = usuário concluiu todos os passos
      const byUser = new Map<string, Set<string>>();
      for (const r of rows as any[]) {
        if (!r.step_id) continue;
        if (!byUser.has(r.user_id)) byUser.set(r.user_id, new Set());
        byUser.get(r.user_id)!.add(r.step_id);
      }
      let users_completed = 0;
      byUser.forEach((set) => {
        if (total_steps > 0 && set.size >= total_steps) users_completed += 1;
      });
      const completion_rate = users_started ? users_completed / users_started : 0;
      return ok({
        journey_id: journeyId,
        total_steps,
        users_started,
        users_completed,
        completion_rate,
      });
    } catch (e) {
      return fail(e);
    }
  },

  async getGlobalStats(): Promise<ServiceResult<JourneyGlobalStats>> {
    try {
      const [j, p] = await Promise.all([
        supabase.from('journeys').select('id', { count: 'exact', head: true }),
        supabase.from('journey_progress').select('user_id, id'),
      ]);
      if (j.error) throw j.error;
      if (p.error) throw p.error;
      const rows = (p.data ?? []) as any[];
      return ok({
        total_journeys: j.count ?? 0,
        total_active_users: new Set(rows.map((r) => r.user_id)).size,
        total_completions: rows.length,
      });
    } catch (e) {
      return fail(e);
    }
  },

  /**
   * Retorna links do Nexus associados a um passo (best-effort).
   * Se a tabela `nexus_relations` não expuser `step_id` diretamente,
   * consumidores devem cair para `KnowledgeGraph`.
   */
  async getNexusForStep(stepId: string): Promise<ServiceResult<JourneyNexusLink[]>> {
    try {
      const rawId = JourneyAdapter.fromLegacyId(stepId);
      const { data, error } = await (supabase as SB)
        .from('nexus_relations' as any)
        .select('*')
        .or(`source_id.eq.${rawId},target_id.eq.${rawId}`)
        .limit(50);
      if (error) throw error;
      return ok(
        (data ?? []).map((r: any) => ({
          step_id: stepId,
          target_type: r.target_type ?? r.relation_type ?? 'unknown',
          target_id: r.target_id ?? r.source_id,
          label: r.label ?? undefined,
        })),
      );
    } catch (e) {
      return fail(e);
    }
  },

  /** Recomendações simples baseadas em categoria + atividade recente. */
  async recommend(userId: string, limit = 3): Promise<ServiceResult<JourneyRecommendation[]>> {
    try {
      const { data: mine } = await JourneyService.listUserJourneys(userId);
      const seen = new Set((mine ?? []).map((j) => j.id));
      const categories = Array.from(new Set((mine ?? []).map((j) => j.category).filter(Boolean)));
      const { data, error } = await supabase
        .from('journeys')
        .select('*')
        .eq('is_active', true)
        .limit(20);
      if (error) throw error;
      const all = (data ?? []).map((r) => JourneyAdapter.fromJourneyRow(r as any));
      const scored = all
        .filter((j) => !seen.has(j.id))
        .map((j) => ({
          journey: j,
          reason:
            j.category && categories.includes(j.category)
              ? `Continua sua formação em ${j.category}`
              : 'Novo caminho recomendado',
          score:
            (j.category && categories.includes(j.category) ? 2 : 0) + (j.is_premium ? 0 : 1),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
      return ok(scored);
    } catch (e) {
      return fail(e);
    }
  },
};

export type JourneyServiceType = typeof JourneyService;
