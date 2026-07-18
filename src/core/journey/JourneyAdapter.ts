/**
 * JourneyAdapter — camada de compatibilidade `itineraria*` → `journeys*`.
 *
 * Uso interno do Journey Core. NÃO exportar pelo barrel.
 *
 * Estratégia:
 * - IDs de itineraria são prefixados com `itin:` para evitar colisão com
 *   UUIDs reais de `journeys`. Consumidores tratam o Journey como opaco.
 * - Conteúdo é normalizado: `html` ↔ `interpretation` (fallback bidirecional).
 * - Escrita no path legado é bloqueada nesta fase (Fase D fará a migração
 *   definitiva).
 */

import type { Journey, JourneyStep, JourneyStepContent } from './types';

export const LEGACY_ID_PREFIX = 'itin:';

export const JourneyAdapter = {
  isLegacyId(id: string): boolean {
    return typeof id === 'string' && id.startsWith(LEGACY_ID_PREFIX);
  },

  toLegacyId(rawId: string): string {
    return `${LEGACY_ID_PREFIX}${rawId}`;
  },

  fromLegacyId(id: string): string {
    return id.startsWith(LEGACY_ID_PREFIX) ? id.slice(LEGACY_ID_PREFIX.length) : id;
  },

  normalizeContent(content: unknown): JourneyStepContent {
    const c: JourneyStepContent =
      content && typeof content === 'object' ? { ...(content as JourneyStepContent) } : {};
    if (!c.interpretation && typeof c.html === 'string') {
      c.interpretation = c.html;
    } else if (!c.html && typeof c.interpretation === 'string') {
      c.html = c.interpretation;
    }
    return c;
  },

  fromItineraria(row: Record<string, any>): Journey {
    return {
      id: JourneyAdapter.toLegacyId(row.id),
      title: row.title,
      subtitle: row.subtitle ?? null,
      description: row.description ?? null,
      icon: row.icon ?? null,
      cover_url: row.cover_url ?? null,
      category: row.category ?? null,
      difficulty: row.difficulty ?? null,
      estimated_days: row.estimated_days ?? null,
      is_premium: !!row.is_premium,
      is_active: row.is_active !== false,
      sort_order: row.sort_order ?? 0,
      tags: row.tags ?? null,
      created_at: row.created_at,
      updated_at: row.updated_at,
      is_legacy: true,
    };
  },

  fromItinerariaStep(row: Record<string, any>): JourneyStep {
    return {
      id: JourneyAdapter.toLegacyId(row.id),
      journey_id: JourneyAdapter.toLegacyId(row.itinerarium_id),
      step_order: row.step_order,
      title: row.title,
      subtitle: row.subtitle ?? null,
      step_type: row.step_type,
      content: JourneyAdapter.normalizeContent(row.content),
      duration_minutes: row.duration_minutes ?? null,
      is_free: row.is_free !== false,
      created_at: row.created_at,
      updated_at: row.updated_at,
      is_legacy: true,
    };
  },

  fromJourneyRow(row: Record<string, any>): Journey {
    return {
      id: row.id,
      title: row.title,
      subtitle: row.subtitle ?? null,
      description: row.description ?? null,
      icon: row.icon ?? null,
      cover_url: row.cover_url ?? null,
      category: row.category ?? null,
      difficulty: row.difficulty ?? null,
      estimated_days: row.estimated_days ?? null,
      is_premium: !!row.is_premium,
      is_active: row.is_active !== false,
      sort_order: row.sort_order ?? 0,
      tags: row.tags ?? null,
      created_at: row.created_at,
      updated_at: row.updated_at,
      is_legacy: false,
    };
  },

  fromJourneyStepRow(row: Record<string, any>): JourneyStep {
    return {
      id: row.id,
      journey_id: row.journey_id,
      step_order: row.step_order,
      title: row.title,
      subtitle: row.subtitle ?? null,
      step_type: row.step_type,
      content: JourneyAdapter.normalizeContent(row.content),
      duration_minutes: row.duration_minutes ?? null,
      is_free: row.is_free !== false,
      created_at: row.created_at,
      updated_at: row.updated_at,
      is_legacy: false,
    };
  },
};
