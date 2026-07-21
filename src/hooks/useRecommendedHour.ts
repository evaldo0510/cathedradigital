/**
 * useRecommendedHour — sugere a Hora canônica mais adequada ao horário local.
 *
 * Sprint 3 · Onda C. Lê `meta.window_start`/`meta.window_end` das orações
 * `breviario-*` (Prayer Engine v2) e devolve aquela cuja janela contém o
 * horário atual do dispositivo. Se nenhuma casar, devolve a próxima.
 *
 * Integração com o calendário litúrgico (data + timezone local):
 *  - Aceita `date` opcional; quando ausente usa o dia corrente do dispositivo.
 *  - Devolve `isoDate` (chave estável YYYY-MM-DD na TZ local) para que o
 *    consumidor construa deep links `?d=` que carregam o Próprio do Dia
 *    correto via `useDailyLiturgy` → `useLiturgyHoursOffice`.
 *  - Devolve `timeZone` resolvida por `Intl` para uso em rótulos/telemetria.
 *
 * Fonte única: o banco (janelas) + provedor litúrgico (Próprio). Nada hardcoded.
 */
import { useEffect, useMemo, useState } from 'react';
import { toIsoDateKey } from '@/core/liturgy/LiturgyProvider';
import { usePrayers, type Prayer } from './usePrayers';

export type RecommendedHour = {
  prayer: Prayer;
  hourSlug: string;
  reason: 'in-window' | 'nearest';
  minutesUntilOpen: number; // 0 se já aberta
  windowLabel: string;      // ex.: "05:00 → 10:00"
  isoDate: string;          // data de referência (YYYY-MM-DD, TZ local)
  isToday: boolean;
  timeZone: string;         // IANA (ex.: "America/Sao_Paulo")
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

function resolveTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function useRecommendedHour(
  date?: Date,
  pollMs = 60_000,
): RecommendedHour | null {
  const { prayers } = usePrayers();
  const timeZone = useMemo(resolveTimeZone, []);

  // Relógio local (minutos desde 00:00). Só afeta a janela quando o `date`
  // fornecido é o dia corrente — caso contrário usamos um pivô fixo para
  // permitir navegação em outras datas sem "correr" com o relógio.
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

    const refDate = date ?? new Date();
    const isoDate = toIsoDateKey(refDate);
    const todayIso = toIsoDateKey(new Date());
    const isToday = isoDate === todayIso;
    // Em datas passadas/futuras, projetamos o "agora" no dia selecionado
    // apenas para casar janelas — o CTA continua abrindo `?d=isoDate`.
    const pivotMin = nowMin;

    let best: RecommendedHour | null = null;
    let bestDelta = Infinity;

    for (const p of breviario) {
      const meta = (p as unknown as { meta?: PrayerMeta }).meta ?? {};
      const start = toMinutes(meta.window_start);
      const end = toMinutes(meta.window_end);
      if (start == null || end == null) continue;
      const windowLabel = `${meta.window_start} → ${meta.window_end}`;
      const hourSlug = meta.hour_slug ?? p.slug.replace(/^breviario-/, '');

      const inWindow = pivotMin >= start && pivotMin <= end;
      if (inWindow) {
        return {
          prayer: p,
          hourSlug,
          reason: 'in-window',
          minutesUntilOpen: 0,
          windowLabel,
          isoDate,
          isToday,
          timeZone,
        };
      }
      const delta = start >= pivotMin ? start - pivotMin : 24 * 60 - pivotMin + start;
      if (delta < bestDelta) {
        bestDelta = delta;
        best = {
          prayer: p,
          hourSlug,
          reason: 'nearest',
          minutesUntilOpen: delta,
          windowLabel,
          isoDate,
          isToday,
          timeZone,
        };
      }
    }
    return best;
  }, [prayers, nowMin, date, timeZone]);
}

