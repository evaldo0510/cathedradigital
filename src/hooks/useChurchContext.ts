import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useDailyLiturgy } from '@/hooks/useDailyLiturgy';
import { useSaintOfDay, type SaintOfDay } from '@/hooks/useSaintOfDay';
import { toIsoDateKey, type DailyLiturgy, type Reading, type Psalm } from '@/core/liturgy/LiturgyProvider';
import {
  resolveLiturgicalDay,
  msUntilNextMidnight,
  type LiturgicalDay,
  type CelebrationRank,
  type LiturgicalSeason,
  type YearCycle,
  type WeekCycle,
} from '@/core/church/liturgicalCalendar';
import { getSaintsByDate } from '@/services/saintsService';
import { supabase } from '@/integrations/supabase/client';

/**
 * Church Context Engine — Contexto Eclesial Global (SSoT · KERNEL).
 *
 * Camada única e congelada. Toda a plataforma (Home, Biblioteca, Logos, Nexus,
 * Reader, Liturgia, Missal, Orações, Perfil, Widgets) consome exclusivamente
 * `useChurchContext()`. Nenhum módulo deve consultar Papa, Santo, Calendário,
 * Tempo Litúrgico ou Leituras de forma independente.
 *
 * Atualização automática à meia-noite local (timezone do dispositivo).
 */

export interface PopeContext {
  id: string;
  name: string;
  title: string;
  image: string;
  reign: string;
  isSaint: boolean;
  status: 'current' | 'historical';
  /** Intenção mensal do Papa, quando disponível. */
  intention: string | null;
}

export interface SaintsContext {
  /** Santo principal do dia. */
  principal: SaintOfDay | null;
  /** Santos secundários celebrados na mesma data. */
  secondary: SaintOfDay[];
  /** Bem-aventurados do dia. */
  blessed: SaintOfDay[];
  /** Mártires do dia. */
  martyrs: SaintOfDay[];
}

export interface ReadingsContext {
  first: Reading | null;
  psalm: Psalm | null;
  second: Reading | null;
  gospel: Reading | null;
  entranceAntiphon: string | null;
  communionAntiphon: string | null;
}

export interface ChurchSeasonFlags {
  isAdvent: boolean;
  isChristmas: boolean;
  isLent: boolean;
  isHolyWeek: boolean;
  isEaster: boolean;
  isPentecost: boolean;
  isCorpusChristi: boolean;
  isAssumption: boolean;
  isAllSaints: boolean;
  isOrdinaryTime: boolean;
}

export interface ChurchContext {
  // ── Igreja ──────────────────────────────────────────────
  currentPope: PopeContext | null;
  /** Ano Santo / Jubileu em curso, quando aplicável. */
  jubilee: { active: boolean; name: string | null; year: number | null };

  // ── Santos ──────────────────────────────────────────────
  saints: SaintsContext;
  /** Atalho para o santo principal (compatibilidade). */
  todaySaint: SaintOfDay | null;

  // ── Calendário ──────────────────────────────────────────
  calendar: LiturgicalDay;
  liturgicalSeason: LiturgicalSeason;
  liturgicalWeek: number;
  liturgicalYear: number;
  yearCycle: YearCycle;
  weekCycle: WeekCycle;
  liturgicalColor: string;
  rank: CelebrationRank;
  celebration: string | null;
  seasonFlags: ChurchSeasonFlags;

  // ── Liturgia ────────────────────────────────────────────
  liturgy: DailyLiturgy | null;
  readings: ReadingsContext;
  gospel: Reading | null;
  psalm: Psalm | null;

  // ── Meta ────────────────────────────────────────────────
  isoDate: string;
  isToday: boolean;
  isLoading: boolean;
  /** Incrementa a cada virada de meia-noite — força consumidores a re-renderizar. */
  dayTick: number;
}

// Fallback do Papa caso a base falhe
export const FALLBACK_POPE: PopeContext = {
  id: 'leo-xiv',
  name: 'Leão XIV',
  title: 'Bispo de Roma, Vigário de Jesus Cristo',
  image: '',
  reign: '2025 – Presente',
  isSaint: false,
  status: 'current',
  intention: null,
};

const JUBILEE_YEARS: Record<number, string> = {
  2025: 'Jubileu Ordinário de 2025 — Peregrinos da Esperança',
};

function mapSaint(s: any): SaintOfDay {
  return {
    name: s.name,
    title: s.title ?? null,
    slug: s.slug ?? null,
    image: s.image ?? null,
    source: 'santoral',
  };
}

/**
 * Sincroniza o kernel com a virada do dia (meia-noite local).
 * Reagenda a cada virada e também ao voltar do background / mudar de aba.
 */
function useMidnightTick(): number {
  const [tick, setTick] = useState(0);
  const [dayKey, setDayKey] = useState(() => toIsoDateKey(new Date()));
  const queryClient = useQueryClient();

  useEffect(() => {
    let timer: number | undefined;

    const fire = () => {
      const nowKey = toIsoDateKey(new Date());
      if (nowKey !== dayKey) {
        setDayKey(nowKey);
        setTick((t) => t + 1);
        // Refresh consistente de todo o contexto eclesial
        queryClient.invalidateQueries({ queryKey: ['church-pope'] });
        queryClient.invalidateQueries({ queryKey: ['saint-of-day'] });
        queryClient.invalidateQueries({ queryKey: ['church-saints'] });
        queryClient.invalidateQueries({ queryKey: ['daily-liturgy'] });
        queryClient.invalidateQueries({ queryKey: ['liturgy'] });
      }
      schedule();
    };

    const schedule = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(fire, msUntilNextMidnight());
    };

    schedule();

    // Dispositivo suspenso / aba em background pode atrasar o timeout
    const onVisible = () => {
      if (document.visibilityState === 'visible') fire();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);

    return () => {
      if (timer) window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [dayKey, queryClient]);

  return tick;
}

export function useChurchContext(date?: Date): ChurchContext {
  const dayTick = useMidnightTick();

  // Quando nenhuma data é informada, o kernel segue "hoje" e reavalia na virada.
  const effectiveDate = useMemo(() => date ?? new Date(), [date, dayTick]);

  const isoDate = toIsoDateKey(effectiveDate);
  const isToday = isoDate === toIsoDateKey(new Date());

  const calendar = useMemo(() => resolveLiturgicalDay(effectiveDate), [isoDate]);

  // ── 1. Papa Atual (P0) ────────────────────────────────
  const { data: currentPope, isLoading: loadingPope } = useQuery({
    queryKey: ['church-pope', 'current'],
    queryFn: async (): Promise<PopeContext> => {
      const { data, error } = await supabase
        .from('library_items_v1')
        .select('*')
        .eq('status', 'current')
        .limit(1)
        .maybeSingle();

      if (data && !error && data.title) {
        return {
          id: data.id || 'current-pope',
          name: data.title,
          title: data.author_label || 'Bispo de Roma',
          image: data.cover_image_url || FALLBACK_POPE.image,
          reign: data.published_at || FALLBACK_POPE.reign,
          isSaint: data.category === 'saint',
          status: 'current',
          intention: null,
        };
      }

      return FALLBACK_POPE;
    },
    staleTime: 1000 * 60 * 60 * 12,
  });

  // ── 2. Santos do dia ──────────────────────────────────
  const { data: principalSaint, isLoading: loadingSaint } = useSaintOfDay(effectiveDate);

  const { data: saintsOfDate, isLoading: loadingSaints } = useQuery({
    queryKey: ['church-saints', isoDate],
    queryFn: async () => {
      const list = await getSaintsByDate(effectiveDate.getMonth() + 1, effectiveDate.getDate());
      return (list ?? []) as any[];
    },
    staleTime: 1000 * 60 * 60 * 6,
  });

  // ── 3. Liturgia do dia ────────────────────────────────
  const { liturgy, isLoading: loadingLiturgy } = useDailyLiturgy(effectiveDate);

  const saints = useMemo<SaintsContext>(() => {
    const all = (saintsOfDate ?? []).map(mapSaint);
    const principalName = principalSaint?.name?.toLowerCase();
    const rest = all.filter((s) => s.name?.toLowerCase() !== principalName);

    const isBlessed = (s: SaintOfDay) => /^be(a|á)t[oa]\b|bem-aventurad/i.test(`${s.name} ${s.title ?? ''}`);
    const isMartyr = (s: SaintOfDay) => /m[áa]rtir/i.test(`${s.title ?? ''}`);

    return {
      principal: principalSaint ?? all[0] ?? null,
      secondary: rest,
      blessed: all.filter(isBlessed),
      martyrs: all.filter(isMartyr),
    };
  }, [saintsOfDate, principalSaint]);

  const readings = useMemo<ReadingsContext>(
    () => ({
      first: liturgy?.primeiraLeitura ?? null,
      psalm: liturgy?.salmo ?? null,
      second: liturgy?.segundaLeitura ?? null,
      gospel: liturgy?.evangelho ?? null,
      entranceAntiphon: (liturgy as any)?.antifonaEntrada ?? null,
      communionAntiphon: (liturgy as any)?.antifonaComunhao ?? null,
    }),
    [liturgy],
  );

  const seasonFlags = useMemo<ChurchSeasonFlags>(() => {
    const k = calendar.keyDates;
    const iso = (d: Date) => toIsoDateKey(d);
    return {
      isAdvent: calendar.season === 'Advento',
      isChristmas: calendar.season === 'Natal',
      isLent: calendar.season === 'Quaresma',
      isHolyWeek: calendar.isHolyWeek,
      isEaster: calendar.season === 'Tempo Pascal' || calendar.season === 'Tríduo Pascal',
      isPentecost: isoDate === iso(k.pentecost),
      isCorpusChristi: isoDate === iso(k.corpusChristi),
      isAssumption: isoDate === iso(k.assumption),
      isAllSaints: isoDate === iso(k.allSaints),
      isOrdinaryTime: calendar.season === 'Tempo Comum',
    };
  }, [calendar, isoDate]);

  const jubileeYear = effectiveDate.getFullYear();

  return useMemo<ChurchContext>(
    () => ({
      currentPope: currentPope ?? FALLBACK_POPE,
      jubilee: {
        active: Boolean(JUBILEE_YEARS[jubileeYear]),
        name: JUBILEE_YEARS[jubileeYear] ?? null,
        year: JUBILEE_YEARS[jubileeYear] ? jubileeYear : null,
      },

      saints,
      todaySaint: saints.principal,

      calendar,
      liturgicalSeason: calendar.season,
      liturgicalWeek: calendar.seasonWeek,
      liturgicalYear: calendar.liturgicalYear,
      yearCycle: calendar.yearCycle,
      weekCycle: calendar.weekCycle,
      liturgicalColor: liturgy?.colorToken ?? 'liturgical-green',
      rank: calendar.rank,
      celebration: calendar.celebration ?? liturgy?.liturgia ?? null,
      seasonFlags,

      liturgy: liturgy ?? null,
      readings,
      gospel: readings.gospel,
      psalm: readings.psalm,

      isoDate,
      isToday,
      isLoading: loadingPope || loadingSaint || loadingSaints || loadingLiturgy,
      dayTick,
    }),
    [
      currentPope,
      jubileeYear,
      saints,
      calendar,
      liturgy,
      readings,
      seasonFlags,
      isoDate,
      isToday,
      loadingPope,
      loadingSaint,
      loadingSaints,
      loadingLiturgy,
      dayTick,
    ],
  );
}
