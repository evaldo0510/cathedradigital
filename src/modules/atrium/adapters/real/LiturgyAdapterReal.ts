import type { LiturgyAdapter } from '../types';
import type { LiturgicalContext } from '../../types';
import { getLiturgyProvider, toIsoDateKey } from '@/core/liturgy/LiturgyProvider';
import { getSaintsByDate } from '@/services/saintsService';

const WEEKDAYS_PT = [
  'domingo', 'segunda-feira', 'terça-feira', 'quarta-feira',
  'quinta-feira', 'sexta-feira', 'sábado',
];

let cached: { key: string; ctx: LiturgicalContext } | null = null;

/**
 * Adapter real da Liturgia para o Átrio.
 *
 * Substitui `LiturgyAdapterMock`. Zero dados hardcoded: consome o
 * `LiturgyProvider` (fonte oficial) para tempo/cor/dia e o santoral local
 * (`getSaintsByDate`) para o santo do dia. Cache in-memory por data
 * (invalida ao virar o dia).
 */
export const LiturgyAdapterReal: LiturgyAdapter = {
  async getToday(): Promise<LiturgicalContext> {
    const today = new Date();
    const isoKey = toIsoDateKey(today);
    if (cached?.key === isoKey) return cached.ctx;

    const [day, saints] = await Promise.all([
      getLiturgyProvider()
        .getDayLiturgy(today)
        .catch(() => null),
      getSaintsByDate(today.getMonth() + 1, today.getDate()).catch(() => []),
    ]);

    const first = saints?.[0];
    const ctx: LiturgicalContext = {
      season: day?.season ?? day?.liturgia ?? 'Tempo Comum',
      weekday: WEEKDAYS_PT[today.getDay()],
      colorToken: day?.colorToken ?? 'liturgical-green',
      saintOfDay: first
        ? {
            name: first.name,
            title: first.title ?? undefined,
            slug: (first as any).slug ?? undefined,
          }
        : undefined,
    };
    cached = { key: isoKey, ctx };
    return ctx;
  },
};
