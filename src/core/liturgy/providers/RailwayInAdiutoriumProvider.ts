/**
 * RailwayInAdiutoriumProvider — implementação atual do LiturgyProvider.
 *
 * Encapsula a chamada à edge function `liturgical-calendar` (action `readings`),
 * que hoje delega para `https://liturgia.up.railway.app`. Nenhuma nova fonte:
 * apenas isola o contorno para permitir troca futura sem tocar em UI/hooks.
 */

import { supabase } from '@/integrations/supabase/client';
import {
  type DailyLiturgy,
  type LiturgyProvider,
  type Reading,
  inferSeason,
  normalizeColorToken,
  toIsoDateKey,
} from '../LiturgyProvider';

interface RawReadings {
  data?: string;
  liturgia?: string;
  cor?: string;
  dia?: string;
  primeiraLeitura?: Reading | null;
  salmo?: { referencia: string; refrao: string; texto: string } | null;
  segundaLeitura?: Reading | string | null;
  evangelho?: Reading | null;
}

function normalizeSecond(raw: RawReadings['segundaLeitura']): Reading | null {
  if (!raw) return null;
  if (typeof raw === 'string') return null;
  return raw;
}

export class RailwayInAdiutoriumProvider implements LiturgyProvider {
  readonly id = 'railway-in-adiutorium';
  readonly label = 'In Adiutorium (railway)';

  async getDayLiturgy(date: Date): Promise<DailyLiturgy> {
    const { data, error } = await supabase.functions.invoke('liturgical-calendar', {
      body: {
        action: 'readings',
        day: date.getDate(),
        month: date.getMonth() + 1,
        year: date.getFullYear(),
      },
    });
    if (error) throw error;
    const raw = (data ?? {}) as RawReadings;

    return {
      isoDate: toIsoDateKey(date),
      data: raw.data ?? date.toLocaleDateString('pt-BR'),
      liturgia: raw.liturgia ?? '',
      cor: raw.cor ?? 'verde',
      colorToken: normalizeColorToken(raw.cor),
      dia: raw.dia ?? '',
      season: inferSeason(raw.liturgia ?? raw.dia ?? ''),
      primeiraLeitura: raw.primeiraLeitura ?? null,
      salmo: raw.salmo ?? null,
      segundaLeitura: normalizeSecond(raw.segundaLeitura),
      evangelho: raw.evangelho ?? null,
    };
  }
}
