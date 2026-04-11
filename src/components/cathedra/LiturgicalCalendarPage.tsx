import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Icons } from '@/constants';
import { useFavorites } from '@/hooks/useFavorites';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { Saint } from '@/data/saints';
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
  verde: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20', label: 'Verde' },
  roxo: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20', label: 'Roxo' },
  branco: { bg: 'bg-secondary/20', text: 'text-secondary', border: 'border-secondary/30', label: 'Branco' },
  vermelho: { bg: 'bg-primary/20', text: 'text-primary font-bold', border: 'border-primary/40', label: 'Vermelho' },
  rosa: { bg: 'bg-secondary/10', text: 'text-secondary', border: 'border-secondary/20', label: 'Rosa' },
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
  '04-11': { name: 'Santo Estanislau', color: 'vermelho', rank: 'memória' },
  '04-23': { name: 'São Jorge', color: 'vermelho', rank: 'memória' },
  '04-25': { name: 'São Marcos Evangelista', color: 'vermelho', rank: 'festa' },
  '05-01': { name: 'São José Operário', color: 'branco', rank: 'memória' },
  '05-22': { name: 'Santa Rita de Cássia', color: 'branco', rank: 'memória' },
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
  const { toggleFavorite, isFavorite } = useFavorites();
  const navigate = useNavigate();
  const [showSaintModal, setShowSaintModal] = useState(false);
  const [saintsData, setSaintsData] = useState<Saint[]>([]);

  React.useEffect(() => {
    import('@/data/saints').then(m => setSaintsData(m.SAINTS_DATA));
  }, []);

  const { data: apiData = {}, isLoading: isLoadingApi } = useQuery({
    queryKey: ['liturgical-month', year, month],
    queryFn: async () => {
      const { data } = await supabase.functions.invoke('liturgical-calendar', {
        body: { action: 'month', year, month: month + 1, lang: 'la', calendar: 'general-la' }
      });
      if (Array.isArray(data)) {
        const map: Record<string, ApiDayData> = {};
        data.forEach((d: ApiDayData) => { map[d.date] = d; });
        return map;
      }
      return {};
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  // Build a set of "MM-DD" keys for days that have a saint
  const saintDaysSet = useMemo(() => {
    const set = new Set<string>();
    saintsData.forEach(s => {
      set.add(`${String(s.feastMonth).padStart(2, '0')}-${String(s.feastDayNum).padStart(2, '0')}`);
    });
    return set;
  }, [saintsData]);

  // Merge fixed + movable celebrations
  const allCelebrations = useMemo(() => {
    const movable = getMovableCelebrations(year);
    return { ...FIXED_CELEBRATIONS, ...movable };
  }, [year]);

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
    return saintsData.find(s => s.feastMonth === m && s.feastDayNum === d) || null;
  }, [selectedDay, saintsData]);

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
            <div className={`w-2.5 h-2.5 rounded-full ${key === 'verde' ? 'bg-primary' : key === 'roxo' ? 'bg-primary' : key === 'branco' ? 'bg-secondary' : key === 'vermelho' ? 'bg-primary' : 'bg-secondary'}`} />
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
              <div className="w-4 h-4 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
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
              const hasSaint = saintDaysSet.has(`${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`);

              return (
                <button
                  key={date.toISOString()}
                  onClick={() => setSelectedDay(date)}
                  className={`
                    aspect-square rounded-xl p-1 relative flex flex-col items-center justify-center transition-all group
                    ${isSelected ? 'ring-2 ring-primary ring-offset-2 z-10' : 'hover:bg-muted'}
                    ${isToday ? 'bg-primary/5' : ''}
                  `}
                >
                  <div className={`
                    w-full h-full rounded-lg flex flex-col items-center justify-center gap-0.5 border
                    ${info.rank === 'solenidade' ? 'border-primary/20 bg-primary/5 shadow-sm' : 'border-transparent'}
                    ${colorStyle?.bg}
                  `}>
                    <span className={`text-xs md:text-sm font-bold ${isToday ? 'text-primary' : colorStyle?.text}`}>
                      {date.getDate()}
                    </span>
                    {info.rank === 'solenidade' && (
                      <div className="w-1 h-1 rounded-full bg-primary" />
                    )}
                    {hasSaint && (
                      <div className="absolute top-1.5 right-1.5">
                        <Icons.Star className="w-2.5 h-2.5 text-secondary fill-secondary" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected day info */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {selectedDay ? (
              <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
                {selectedSaint ? (
                  <div className="relative h-48 group">
                    <SacredImage src={selectedSaint.image} alt={selectedSaint.name} className="w-full h-full" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/70">Santo do Dia</p>
                      <h3 className="text-lg font-serif font-bold text-white line-clamp-1">{selectedSaint.name}</h3>
                    </div>
                    <button 
                      onClick={() => toggleFavorite({ 
                        title: selectedSaint.name, 
                        type: 'saint', 
                        content: selectedSaint.bio 
                      })}
                      className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm transition-all"
                    >
                      <Icons.Heart className={`w-4 h-4 ${isFavorite('saint', selectedSaint.name) ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                    </button>
                    <button 
                      onClick={() => navigate(`/cathedra/daily-liturgy?date=${selectedDay.toISOString()}`)}
                      className="absolute top-4 left-4 p-2 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm transition-all"
                    >
                      <Icons.Book className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <div className={`h-24 ${LITURGICAL_COLORS[selectedInfo?.color || 'verde']?.bg} flex items-center justify-center`}>
                    <Icons.Cross className={`w-8 h-8 ${LITURGICAL_COLORS[selectedInfo?.color || 'verde']?.text} opacity-20`} />
                  </div>
                )}
                
                <div className="p-6 space-y-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">
                      {selectedDay.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    <h3 className="text-xl font-serif font-bold text-foreground">
                      {selectedInfo?.celebration || 'Féria'}
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <div className={`px-2 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider ${LITURGICAL_COLORS[selectedInfo?.color || 'verde']?.bg} ${LITURGICAL_COLORS[selectedInfo?.color || 'verde']?.text} ${LITURGICAL_COLORS[selectedInfo?.color || 'verde']?.border}`}>
                      {LITURGICAL_COLORS[selectedInfo?.color || 'verde']?.label}
                    </div>
                    {selectedInfo?.rank && (
                      <div className="px-2 py-1 rounded-md bg-muted border border-border text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {selectedInfo.rank}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-border flex gap-3">
                    <button 
                      onClick={() => navigate(`/cathedra/daily-liturgy?date=${selectedDay.toISOString()}`)}
                      className="flex-1 py-3 px-4 bg-primary text-primary-foreground rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/10"
                    >
                      <Icons.Book className="w-4 h-4" />
                      Ver Liturgia
                    </button>
                    {selectedSaint && (
                      <button 
                        onClick={() => setShowSaintModal(true)}
                        className="p-3 bg-secondary text-foreground rounded-xl hover:bg-muted transition-all border border-border"
                      >
                        <Icons.ArrowDown className="w-4 h-4 -rotate-90" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-muted/30 border-2 border-dashed border-border rounded-3xl p-12 text-center space-y-3">
                <Icons.LiturgicalCalendar className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                <p className="text-sm text-muted-foreground font-serif italic">Selecione um dia para ver os detalhes</p>
              </div>
            )}
          </AnimatePresence>

          {/* Upcoming list */}
          <div className="bg-card border border-border rounded-3xl p-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Próximas Solenidades</h3>
            <div className="space-y-3">
              {upcomingCelebrations.map((c, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setYear(c.date.getFullYear());
                    setMonth(c.date.getMonth());
                    setSelectedDay(c.date);
                  }}
                  className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-muted transition-all group text-left"
                >
                  <div className={`w-10 h-10 rounded-lg shrink-0 flex flex-col items-center justify-center ${LITURGICAL_COLORS[c.color]?.bg}`}>
                    <span className={`text-[10px] font-black ${LITURGICAL_COLORS[c.color]?.text}`}>{c.date.getDate()}</span>
                    <span className={`text-[8px] font-bold uppercase ${LITURGICAL_COLORS[c.color]?.text}`}>{MONTH_NAMES[c.date.getMonth()].slice(0, 3)}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">{c.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{c.rank}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showSaintModal && selectedSaint && (
          <SaintDetail saint={selectedSaint} onClose={() => setShowSaintModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default LiturgicalCalendarPage;