/**
 * useRecommendedHour — sugere a Hora canônica mais adequada ao horário local.
 *
 * Sprint 3 · Onda C. Lê `meta.window_start`/`meta.window_end` das orações
 * `breviario-*` (Prayer Engine v2) e devolve aquela cuja janela contém o
 * horário atual do dispositivo. Se nenhuma casar, devolve a mais próxima.
 *
 * Fonte única: o banco. Nada de tabela hardcoded.
 */
import { useEffect, useMemo, useState } from 'react';
import { usePrayers, type Prayer } from './usePrayers';

export type RecommendedHour = {
  prayer: Prayer;
  hourSlug: string;
  reason: 'in-window' | 'nearest';
  minutesUntilOpen: number; // 0 se já aberta
  windowLabel: string;      // ex.: "05:00 → 10:00"
};

interface PrayerMeta {
  hour_slug?: string;
  window_start?: string;
  window_end?: string;
  auto_injects_proper?: boolean;
}

function toMinutes(hhmm?: string): number | null {
  if (!hhmm || !/^\d{2}:\d{2}$/.test(hhmm)) return null;
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function useRecommendedHour(pollMs = 60_000): RecommendedHour | null {
  const { prayers } = usePrayers();
  const [nowMin, setNowMin] = useState(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setNowMin(d.getHours() * 60 + d.getMinutes());
    };
    const t = setInterval(tick, pollMs);
    return () => clearInterval(t);
  }, [pollMs]);

  return useMemo(() => {
    const breviario = prayers.filter((p) => p.slug.startsWith('breviario-'));
    if (breviario.length === 0) return null;

    let best: RecommendedHour | null = null;
    let bestDelta = Infinity;

    for (const p of breviario) {
      const meta = (p as unknown as { meta?: PrayerMeta }).meta ?? {};
      const start = toMinutes(meta.window_start);
      const end = toMinutes(meta.window_end);
      if (start == null || end == null) continue;
      const windowLabel = `${meta.window_start} → ${meta.window_end}`;
      const hourSlug = meta.hour_slug ?? p.slug.replace(/^breviario-/, '');

      const inWindow = nowMin >= start && nowMin <= end;
      if (inWindow) {
        return {
          prayer: p,
          hourSlug,
          reason: 'in-window',
          minutesUntilOpen: 0,
          windowLabel,
        };
      }
      // distância até a próxima abertura (considerando ciclo de 24h)
      const delta = start >= nowMin ? start - nowMin : 24 * 60 - nowMin + start;
      if (delta < bestDelta) {
        bestDelta = delta;
        best = {
          prayer: p,
          hourSlug,
          reason: 'nearest',
          minutesUntilOpen: delta,
          windowLabel,
        };
      }
    }
    return best;
  }, [prayers, nowMin]);
}
