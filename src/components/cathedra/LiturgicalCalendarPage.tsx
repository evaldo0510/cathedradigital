import React, { useState, useMemo, useEffect } from 'react';
import { Icons } from '../../constants';
import { useFavorites } from '@/hooks/useFavorites';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { SAINTS_DATA, type Saint } from '@/data/saints';
import SacredImage from './SacredImage';
import SaintDetail from './SaintDetail';
import { AnimatePresence } from 'framer-motion';

interface LiturgicalDay {
  date: Date;
  celebration?: string;
  color: 'verde' | 'roxo' | 'branco' | 'vermelho' | 'rosa';
  rank?: 'solenidade' | 'festa' | 'memória' | 'feria';
}

interface ApiCelebration {
  title: string;
  colour: string;
  rank: string;
}

interface ApiDayData {
  date: string;
  season: string;
  celebrations: ApiCelebration[];
}

const LITURGICAL_COLORS: Record<string, { bg: string; text: string; border: string; label: string }> = {
  verde: { bg: 'bg-emerald-500/15', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-500/30', label: 'Verde' },
  roxo: { bg: 'bg-purple-500/15', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-500/30', label: 'Roxo' },
  branco: { bg: 'bg-amber-100/40 dark:bg-amber-500/10', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-400/30', label: 'Branco' },
  vermelho: { bg: 'bg-red-500/15', text: 'text-red-700 dark:text-red-400', border: 'border-red-500/30', label: 'Vermelho' },
  rosa: { bg: 'bg-pink-500/15', text: 'text-pink-700 dark:text-pink-400', border: 'border-pink-500/30', label: 'Rosa' },
};

const COLOUR_TO_PT: Record<string, string> = {
  green: 'verde',
  violet: 'roxo',
  white: 'branco',
  red: 'vermelho',
  rose: 'rosa',
};

const RANK_TO_PT: Record<string, 'solenidade' | 'festa' | 'memória' | 'feria'> = {
  solemnity: 'solenidade',
  feast: 'festa',
  memorial: 'memória',
  'optional memorial': 'memória',
  ferial: 'feria',
};

// Computus — Easter calculation (Anonymous Gregorian algorithm)
function computeEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day);
}

function getMovableCelebrations(year: number): Record<string, { name: string; color: 'verde' | 'roxo' | 'branco' | 'vermelho' | 'rosa'; rank: 'solenidade' | 'festa' | 'memória' | 'feria' }> {
  const easter = computeEaster(year);
  const fmt = (d: Date) => `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const offset = (days: number) => {
    const d = new Date(easter);
    d.setDate(d.getDate() + days);
    return d;
  };

  return {
    [fmt(offset(-46))]: { name: 'Quarta-feira de Cinzas', color: 'roxo', rank: 'solenidade' },
    [fmt(offset(-7))]: { name: 'Domingo de Ramos', color: 'vermelho', rank: 'solenidade' },
    [fmt(offset(-3))]: { name: 'Quinta-feira Santa', color: 'branco', rank: 'solenidade' },
    [fmt(offset(-2))]: { name: 'Sexta-feira Santa', color: 'vermelho', rank: 'solenidade' },
    [fmt(offset(-1))]: { name: 'Sábado Santo', color: 'branco', rank: 'solenidade' },
    [fmt(easter)]: { name: 'Páscoa da Ressurreição', color: 'branco', rank: 'solenidade' },
    [fmt(offset(1))]: { name: 'Segunda-feira da Oitava da Páscoa', color: 'branco', rank: 'solenidade' },
    [fmt(offset(39))]: { name: 'Ascensão do Senhor', color: 'branco', rank: 'solenidade' },
    [fmt(offset(49))]: { name: 'Pentecostes', color: 'vermelho', rank: 'solenidade' },
    [fmt(offset(56))]: { name: 'Santíssima Trindade', color: 'branco', rank: 'solenidade' },
    [fmt(offset(60))]: { name: 'Corpus Christi', color: 'branco', rank: 'solenidade' },
  };
}

// Fixed celebrations
const FIXED_CELEBRATIONS: Record<string, { name: string; color: 'verde' | 'roxo' | 'branco' | 'vermelho' | 'rosa'; rank: 'solenidade' | 'festa' | 'memória' | 'feria' }> = {
  '01-01': { name: 'Santa Maria, Mãe de Deus', color: 'branco', rank: 'solenidade' },
  '01-06': { name: 'Epifania do Senhor', color: 'branco', rank: 'solenidade' },
  '01-25': { name: 'Conversão de São Paulo', color: 'branco', rank: 'festa' },
  '02-02': { name: 'Apresentação do Senhor', color: 'branco', rank: 'festa' },
  '02-11': { name: 'N. Sra. de Lourdes', color: 'branco', rank: 'memória' },
  '02-22': { name: 'Cátedra de São Pedro', color: 'branco', rank: 'festa' },
  '03-19': { name: 'São José', color: 'branco', rank: 'solenidade' },
  '03-25': { name: 'Anunciação do Senhor', color: 'branco', rank: 'solenidade' },
  '04-25': { name: 'São Marcos Evangelista', color: 'vermelho', rank: 'festa' },
  '05-01': { name: 'São José Operário', color: 'branco', rank: 'memória' },
  '05-03': { name: 'Santos Filipe e Tiago', color: 'vermelho', rank: 'festa' },
  '05-13': { name: 'N. Sra. de Fátima', color: 'branco', rank: 'memória' },
  '05-14': { name: 'São Matias Apóstolo', color: 'vermelho', rank: 'festa' },
  '05-31': { name: 'Visitação de Maria', color: 'branco', rank: 'festa' },
  '06-11': { name: 'Sagrado Coração de Jesus', color: 'branco', rank: 'solenidade' },
  '06-13': { name: 'Santo Antônio de Pádua', color: 'branco', rank: 'memória' },
  '06-24': { name: 'Natividade de São João Batista', color: 'branco', rank: 'solenidade' },
  '06-29': { name: 'São Pedro e São Paulo', color: 'vermelho', rank: 'solenidade' },
  '07-03': { name: 'São Tomé Apóstolo', color: 'vermelho', rank: 'festa' },
  '07-11': { name: 'São Bento', color: 'branco', rank: 'memória' },
  '07-16': { name: 'N. Sra. do Carmo', color: 'branco', rank: 'memória' },
  '07-22': { name: 'Santa Maria Madalena', color: 'branco', rank: 'festa' },
  '07-25': { name: 'São Tiago Apóstolo', color: 'vermelho', rank: 'festa' },
  '07-26': { name: 'Santos Joaquim e Ana', color: 'branco', rank: 'memória' },
  '08-06': { name: 'Transfiguração do Senhor', color: 'branco', rank: 'festa' },
  '08-10': { name: 'São Lourenço', color: 'vermelho', rank: 'festa' },
  '08-15': { name: 'Assunção de Maria', color: 'branco', rank: 'solenidade' },
  '08-22': { name: 'Maria Rainha', color: 'branco', rank: 'memória' },
  '08-24': { name: 'São Bartolomeu Apóstolo', color: 'vermelho', rank: 'festa' },
  '08-28': { name: 'Santo Agostinho', color: 'branco', rank: 'memória' },
  '09-08': { name: 'Natividade de Maria', color: 'branco', rank: 'festa' },
  '09-14': { name: 'Exaltação da Santa Cruz', color: 'vermelho', rank: 'festa' },
  '09-15': { name: 'N. Sra. das Dores', color: 'branco', rank: 'memória' },
  '09-21': { name: 'São Mateus Apóstolo', color: 'vermelho', rank: 'festa' },
  '09-29': { name: 'Santos Arcanjos', color: 'branco', rank: 'festa' },
  '10-01': { name: 'Santa Teresinha', color: 'branco', rank: 'memória' },
  '10-02': { name: 'Santos Anjos da Guarda', color: 'branco', rank: 'memória' },
  '10-04': { name: 'São Francisco de Assis', color: 'branco', rank: 'memória' },
  '10-07': { name: 'N. Sra. do Rosário', color: 'branco', rank: 'memória' },
  '10-12': { name: 'N. Sra. Aparecida', color: 'branco', rank: 'solenidade' },
  '10-15': { name: 'Santa Teresa de Ávila', color: 'branco', rank: 'memória' },
  '10-18': { name: 'São Lucas Evangelista', color: 'vermelho', rank: 'festa' },
  '10-28': { name: 'Santos Simão e Judas', color: 'vermelho', rank: 'festa' },
  '11-01': { name: 'Todos os Santos', color: 'branco', rank: 'solenidade' },
  '11-02': { name: 'Fiéis Defuntos', color: 'roxo', rank: 'solenidade' },
  '11-21': { name: 'Apresentação de Maria', color: 'branco', rank: 'memória' },
  '11-30': { name: 'Santo André Apóstolo', color: 'vermelho', rank: 'festa' },
  '12-03': { name: 'São Francisco Xavier', color: 'branco', rank: 'memória' },
  '12-08': { name: 'Imaculada Conceição', color: 'branco', rank: 'solenidade' },
  '12-12': { name: 'N. Sra. de Guadalupe', color: 'branco', rank: 'festa' },
  '12-25': { name: 'Natal do Senhor', color: 'branco', rank: 'solenidade' },
  '12-26': { name: 'Santo Estêvão', color: 'vermelho', rank: 'festa' },
  '12-27': { name: 'São João Evangelista', color: 'branco', rank: 'festa' },
  '12-28': { name: 'Santos Inocentes', color: 'vermelho', rank: 'festa' },
};

function getLiturgicalSeason(date: Date, year: number): { season: string; color: 'verde' | 'roxo' | 'branco' | 'vermelho' | 'rosa' } {
  const easter = computeEaster(year);
  const dayMs = 24 * 60 * 60 * 1000;
  const diff = Math.round((date.getTime() - easter.getTime()) / dayMs);

  // Lent: Ash Wednesday (-46) to Holy Thursday (-3)
  if (diff >= -46 && diff < -3) {
    // Laetare Sunday (4th Sunday of Lent)
    if (date.getDay() === 0 && diff >= -25 && diff <= -22) return { season: 'Quaresma', color: 'rosa' };
    return { season: 'Quaresma', color: 'roxo' };
  }
  // Holy Week
  if (diff >= -3 && diff < 0) return { season: 'Semana Santa', color: 'vermelho' };
  // Easter season
  if (diff >= 0 && diff <= 49) return { season: 'Tempo Pascal', color: 'branco' };

  const m = date.getMonth();
  const d = date.getDate();
  // Advent
  // First Sunday of Advent: closest Sunday to Nov 30
  const nov30 = new Date(year, 10, 30);
  const adventStart = new Date(nov30);
  adventStart.setDate(30 - nov30.getDay());
  if (date >= adventStart && (m < 11 || (m === 11 && d <= 24))) {
    // Gaudete Sunday (3rd Sunday of Advent)
    const thirdSunday = new Date(adventStart);
    thirdSunday.setDate(thirdSunday.getDate() + 14);
    if (date.getTime() === thirdSunday.getTime()) return { season: 'Advento', color: 'rosa' };
    return { season: 'Advento', color: 'roxo' };
  }
  // Christmas
  if ((m === 11 && d >= 25) || (m === 0 && d <= 6)) return { season: 'Natal', color: 'branco' };

  return { season: 'Tempo Comum', color: 'verde' };
}

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const daysCount = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysCount; d++) {
    days.push(new Date(year, month, d));
  }
  return days;
}

const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const LiturgicalCalendarPage: React.FC = () => {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [apiData, setApiData] = useState<Record<string, ApiDayData>>({});
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const { toggleFavorite, isFavorite } = useFavorites();
  const navigate = useNavigate();
  const [showSaintModal, setShowSaintModal] = useState(false);

  // Build a set of "MM-DD" keys for days that have a saint
  const saintDaysSet = useMemo(() => {
    const set = new Set<string>();
    SAINTS_DATA.forEach(s => {
      set.add(`${String(s.feastMonth).padStart(2, '0')}-${String(s.feastDayNum).padStart(2, '0')}`);
    });
    return set;
  }, []);

  // Merge fixed + movable celebrations
  const allCelebrations = useMemo(() => {
    const movable = getMovableCelebrations(year);
    return { ...FIXED_CELEBRATIONS, ...movable };
  }, [year]);

  // Fetch month data from API
  useEffect(() => {
    const fetchMonth = async () => {
      setIsLoadingApi(true);
      try {
        const { data } = await supabase.functions.invoke('liturgical-calendar', {
          body: { action: 'month', year, month: month + 1, lang: 'la', calendar: 'general-la' }
        });
        if (Array.isArray(data)) {
          const map: Record<string, ApiDayData> = {};
          data.forEach((d: ApiDayData) => { map[d.date] = d; });
          setApiData(map);
        }
      } catch (err) {
        console.error('Error fetching calendar month:', err);
      } finally {
        setIsLoadingApi(false);
      }
    };
    fetchMonth();
  }, [year, month]);

  const days = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const blanks = Array.from({ length: firstDayOfWeek });

  const getLiturgicalInfo = (date: Date): LiturgicalDay => {
    const key = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const apiKey = `${date.getFullYear()}-${key.replace('-', '-')}`;
    // Try API data first
    const apiDay = apiData[apiKey];
    if (apiDay?.celebrations?.length) {
      const c = apiDay.celebrations[0];
      const color = (COLOUR_TO_PT[c.colour?.toLowerCase()] || 'verde') as LiturgicalDay['color'];
      const rank = (RANK_TO_PT[c.rank?.toLowerCase()] || 'feria') as LiturgicalDay['rank'];
      return { date, celebration: c.title, color, rank };
    }
    // Fallback to local data
    const fixed = allCelebrations[key];
    const season = getLiturgicalSeason(date, year);
    if (fixed) {
      return { date, celebration: fixed.name, color: fixed.color, rank: fixed.rank };
    }
    if (date.getDay() === 0) {
      return { date, celebration: `Domingo do ${season.season}`, color: season.color, rank: 'feria' };
    }
    return { date, color: season.color, rank: 'feria' };
  };

  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

  const navigateMonth = (dir: number) => {
    let m = month + dir;
    let y = year;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setMonth(m);
    setYear(y);
    setSelectedDay(null);
  };

  const goToToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setSelectedDay(today);
  };

  const currentSeason = getLiturgicalSeason(today, today.getFullYear());

  // Upcoming celebrations
  const upcomingCelebrations = useMemo(() => {
    const upcoming: { date: Date; name: string; color: string; rank: string }[] = [];
    const movable = getMovableCelebrations(today.getFullYear());
    const all = { ...FIXED_CELEBRATIONS, ...movable };
    for (let i = 1; i <= 90; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const key = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const cel = all[key];
      if (cel && (cel.rank === 'solenidade' || cel.rank === 'festa')) {
        upcoming.push({ date: new Date(d), name: cel.name, color: cel.color, rank: cel.rank });
      }
      if (upcoming.length >= 8) break;
    }
    return upcoming;
  }, []);

  // Find saint for selected day
  const selectedSaint = useMemo((): Saint | null => {
    if (!selectedDay) return null;
    const m = selectedDay.getMonth() + 1;
    const d = selectedDay.getDate();
    return SAINTS_DATA.find(s => s.feastMonth === m && s.feastDayNum === d) || null;
  }, [selectedDay]);

  const selectedInfo = selectedDay ? getLiturgicalInfo(selectedDay) : null;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
          <Icons.Star className="w-4 h-4 text-primary" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Calendarium Liturgicum</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-foreground">Calendário Litúrgico</h1>
        <p className="text-muted-foreground font-serif italic">
          Tempo atual: <span className={LITURGICAL_COLORS[currentSeason.color]?.text}>{currentSeason.season}</span>
        </p>
      </div>

      {/* Color legend */}
      <div className="flex flex-wrap gap-2 justify-center">
        {Object.entries(LITURGICAL_COLORS).map(([key, val]) => (
          <div key={key} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${val.bg} ${val.border} border`}>
            <div className={`w-2.5 h-2.5 rounded-full ${key === 'verde' ? 'bg-emerald-500' : key === 'roxo' ? 'bg-purple-500' : key === 'branco' ? 'bg-amber-400' : key === 'vermelho' ? 'bg-red-500' : 'bg-pink-500'}`} />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${val.text}`}>{val.label}</span>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar grid */}
        <div className="lg:col-span-2 bg-card border border-border rounded-3xl p-6">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => navigateMonth(-1)} className="p-2 rounded-xl bg-muted hover:bg-primary/10 transition-all">
              <Icons.ArrowDown className="w-5 h-5 rotate-90 text-foreground" />
            </button>
            <div className="text-center">
              <h2 className="text-xl font-serif font-bold text-foreground">{MONTH_NAMES[month]} {year}</h2>
              {(year !== today.getFullYear() || month !== today.getMonth()) && (
                <button onClick={goToToday} className="text-[9px] font-black uppercase tracking-widest text-primary hover:underline mt-1">
                  Ir para Hoje
                </button>
              )}
            </div>
            <button onClick={() => navigateMonth(1)} className="p-2 rounded-xl bg-muted hover:bg-primary/10 transition-all">
              <Icons.ArrowDown className="w-5 h-5 -rotate-90 text-foreground" />
            </button>
          </div>

          {/* Loading indicator */}
          {isLoadingApi && (
            <div className="flex justify-center mb-3">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAY_NAMES.map(d => (
              <div key={d} className="text-center text-[10px] font-black uppercase tracking-wider text-muted-foreground py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1">
            {blanks.map((_, i) => <div key={`b-${i}`} />)}
            {days.map(date => {
              const info = getLiturgicalInfo(date);
              const colorStyle = LITURGICAL_COLORS[info.color];
              const isToday = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}` === todayKey;
              const isSelected = selectedDay && date.getTime() === selectedDay.getTime();
              const hasCelebration = !!info.celebration && info.rank !== 'feria';

              return (
                <button
                  key={date.getDate()}
                  onClick={() => setSelectedDay(date)}
                  className={`relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all text-sm
                    ${isSelected ? 'ring-2 ring-primary shadow-lg scale-105' : ''}
                    ${isToday ? 'ring-2 ring-foreground' : ''}
                    ${colorStyle?.bg} ${colorStyle?.border} border
                    hover:scale-105 hover:shadow-md
                  `}
                >
                  <span className={`font-bold ${colorStyle?.text} ${isToday ? 'text-foreground' : ''}`}>{date.getDate()}</span>
                  {hasCelebration && (
                    <div className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${
                      info.rank === 'solenidade' ? 'bg-amber-500' : info.rank === 'festa' ? 'bg-primary' : 'bg-muted-foreground'
                    }`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          {selectedInfo ? (
            <div className={`rounded-2xl border p-5 space-y-3 ${LITURGICAL_COLORS[selectedInfo.color]?.bg} ${LITURGICAL_COLORS[selectedInfo.color]?.border}`}>
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                {selectedDay!.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <h3 className={`text-lg font-serif font-bold ${LITURGICAL_COLORS[selectedInfo.color]?.text}`}>
                {selectedInfo.celebration || 'Féria'}
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${LITURGICAL_COLORS[selectedInfo.color]?.bg} ${LITURGICAL_COLORS[selectedInfo.color]?.text}`}>
                  {LITURGICAL_COLORS[selectedInfo.color]?.label}
                </span>
                {selectedInfo.rank && (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                    {selectedInfo.rank}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground font-serif">
                {getLiturgicalSeason(selectedDay!, year).season}
              </p>
              <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                {selectedInfo.celebration && selectedInfo.rank !== 'feria' && (() => {
                  const favTitle = selectedInfo.celebration || '';
                  const faved = isFavorite('liturgy', favTitle);
                  return (
                    <button onClick={() => toggleFavorite({ type: 'liturgy', title: favTitle, content: `${selectedDay!.toLocaleDateString('pt-BR')} — ${favTitle}` })}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                      <Icons.Heart className={`w-4 h-4 ${faved ? 'fill-primary text-primary' : ''}`} />
                      {faved ? 'Salvo' : 'Favoritar'}
                    </button>
                  );
                })()}
                <button onClick={() => navigate('/liturgia?tab=liturgia')}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors ml-auto">
                  <Icons.Book className="w-4 h-4" /> Leituras
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-5 text-center">
              <p className="text-sm text-muted-foreground italic">Selecione um dia no calendário</p>
            </div>
          )}

          {/* Saint of the selected day */}
          {selectedSaint && (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              {selectedSaint.image && (
                <div className="h-32 overflow-hidden">
                  <SacredImage src={selectedSaint.image} className="w-full h-full object-cover" alt={selectedSaint.name} />
                </div>
              )}
              <div className="p-5 space-y-3">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-primary block">{selectedSaint.feastDay}</span>
                  <h3 className="text-lg font-serif font-bold text-foreground">{selectedSaint.name}</h3>
                  <p className="text-xs text-muted-foreground font-serif italic">{selectedSaint.title}</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">{selectedSaint.bio}</p>
                {selectedSaint.quotes[0] && (
                  <blockquote className="border-l-2 border-primary/30 pl-3 py-1">
                    <p className="text-[11px] text-foreground/70 font-serif italic">{selectedSaint.quotes[0]}</p>
                  </blockquote>
                )}
                {selectedSaint.works.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Obras</span>
                    {selectedSaint.works.slice(0, 3).map((w, i) => (
                      <div key={i} className="text-[11px]">
                        {w.url ? (
                          <a href={w.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold">{w.title}</a>
                        ) : (
                          <span className="text-foreground/80 font-bold">{w.title}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => navigate('/saints')}
                  className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 pt-1"
                >
                  Ver biografia completa <Icons.ArrowDown className="w-3 h-3 -rotate-90" />
                </button>
              </div>
            </div>
          )}

          {/* Upcoming celebrations */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Próximas Celebrações</h3>
            <div className="space-y-2">
              {upcomingCelebrations.map((c, i) => {
                const cStyle = LITURGICAL_COLORS[c.color] || LITURGICAL_COLORS.verde;
                return (
                  <div key={i} className={`p-3 rounded-xl ${cStyle.bg} border ${cStyle.border}`}>
                    <p className="text-[9px] font-bold text-muted-foreground">
                      {c.date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', weekday: 'short' })}
                    </p>
                    <p className={`text-sm font-semibold ${cStyle.text}`}>{c.name}</p>
                    <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">{c.rank}</span>
                  </div>
                );
              })}
              {upcomingCelebrations.length === 0 && (
                <p className="text-xs text-muted-foreground italic text-center py-2">Carregando...</p>
              )}
            </div>
          </div>

          {/* Rank legend */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Classificação</h3>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-amber-500" /><span className="text-foreground">Solenidade</span></div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-primary" /><span className="text-foreground">Festa</span></div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-muted-foreground" /><span className="text-foreground">Memória</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiturgicalCalendarPage;
