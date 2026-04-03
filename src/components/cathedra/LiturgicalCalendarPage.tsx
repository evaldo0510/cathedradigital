import React, { useState, useMemo } from 'react';
import { Icons } from '../../constants';
import { useFavorites } from '@/hooks/useFavorites';
import { useNavigate } from 'react-router-dom';

interface LiturgicalDay {
  date: Date;
  celebration?: string;
  color: 'verde' | 'roxo' | 'branco' | 'vermelho' | 'rosa';
  rank?: 'solenidade' | 'festa' | 'memória' | 'feria';
}

const LITURGICAL_COLORS: Record<string, { bg: string; text: string; border: string; label: string }> = {
  verde: { bg: 'bg-emerald-500/15', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-500/30', label: 'Verde' },
  roxo: { bg: 'bg-purple-500/15', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-500/30', label: 'Roxo' },
  branco: { bg: 'bg-amber-100/40 dark:bg-amber-500/10', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-400/30', label: 'Branco' },
  vermelho: { bg: 'bg-red-500/15', text: 'text-red-700 dark:text-red-400', border: 'border-red-500/30', label: 'Vermelho' },
  rosa: { bg: 'bg-pink-500/15', text: 'text-pink-700 dark:text-pink-400', border: 'border-pink-500/30', label: 'Rosa' },
};

// Major fixed celebrations
const FIXED_CELEBRATIONS: Record<string, { name: string; color: 'verde' | 'roxo' | 'branco' | 'vermelho' | 'rosa'; rank: 'solenidade' | 'festa' | 'memória' | 'feria' }> = {
  '01-01': { name: 'Santa Maria, Mãe de Deus', color: 'branco', rank: 'solenidade' },
  '01-06': { name: 'Epifania do Senhor', color: 'branco', rank: 'solenidade' },
  '02-02': { name: 'Apresentação do Senhor', color: 'branco', rank: 'festa' },
  '02-11': { name: 'N. Sra. de Lourdes', color: 'branco', rank: 'memória' },
  '03-19': { name: 'São José', color: 'branco', rank: 'solenidade' },
  '03-25': { name: 'Anunciação do Senhor', color: 'branco', rank: 'solenidade' },
  '05-01': { name: 'São José Operário', color: 'branco', rank: 'memória' },
  '05-13': { name: 'N. Sra. de Fátima', color: 'branco', rank: 'memória' },
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
  '08-06': { name: 'Transfiguração do Senhor', color: 'branco', rank: 'festa' },
  '08-10': { name: 'São Lourenço', color: 'vermelho', rank: 'festa' },
  '08-15': { name: 'Assunção de Maria', color: 'branco', rank: 'solenidade' },
  '08-22': { name: 'Maria Rainha', color: 'branco', rank: 'memória' },
  '08-28': { name: 'Santo Agostinho', color: 'branco', rank: 'memória' },
  '09-08': { name: 'Natividade de Maria', color: 'branco', rank: 'festa' },
  '09-14': { name: 'Exaltação da Santa Cruz', color: 'vermelho', rank: 'festa' },
  '09-29': { name: 'Santos Arcanjos', color: 'branco', rank: 'festa' },
  '10-01': { name: 'Santa Teresinha', color: 'branco', rank: 'memória' },
  '10-04': { name: 'São Francisco de Assis', color: 'branco', rank: 'memória' },
  '10-07': { name: 'N. Sra. do Rosário', color: 'branco', rank: 'memória' },
  '10-15': { name: 'Santa Teresa de Ávila', color: 'branco', rank: 'memória' },
  '10-18': { name: 'São Lucas Evangelista', color: 'vermelho', rank: 'festa' },
  '11-01': { name: 'Todos os Santos', color: 'branco', rank: 'solenidade' },
  '11-02': { name: 'Fiéis Defuntos', color: 'roxo', rank: 'solenidade' },
  '11-21': { name: 'Apresentação de Maria', color: 'branco', rank: 'memória' },
  '12-08': { name: 'Imaculada Conceição', color: 'branco', rank: 'solenidade' },
  '12-12': { name: 'N. Sra. de Guadalupe', color: 'branco', rank: 'festa' },
  '12-25': { name: 'Natal do Senhor', color: 'branco', rank: 'solenidade' },
  '12-26': { name: 'Santo Estêvão', color: 'vermelho', rank: 'festa' },
  '12-27': { name: 'São João Evangelista', color: 'branco', rank: 'festa' },
};

function getLiturgicalSeason(date: Date): { season: string; color: 'verde' | 'roxo' | 'branco' | 'vermelho' | 'rosa' } {
  const m = date.getMonth(); // 0-indexed
  const d = date.getDate();

  // Approximate seasons (simplified - no Easter calculation)
  if (m === 11 && d >= 1 && d <= 24) return { season: 'Advento', color: 'roxo' };
  if ((m === 11 && d >= 25) || (m === 0 && d <= 6)) return { season: 'Natal', color: 'branco' };
  if (m === 1 && d >= 14 && d <= 16) return { season: 'Quaresma', color: 'roxo' }; // approximate
  if (m >= 1 && m <= 2) return { season: 'Tempo Comum', color: 'verde' };
  if (m === 3 && d >= 1 && d <= 20) return { season: 'Quaresma', color: 'roxo' };
  if (m === 3 && d >= 21 && d <= 30) return { season: 'Tempo Pascal', color: 'branco' };
  if (m === 4) return { season: 'Tempo Pascal', color: 'branco' };
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

  const days = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const blanks = Array.from({ length: firstDayOfWeek });

  const getLiturgicalInfo = (date: Date): LiturgicalDay => {
    const key = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const fixed = FIXED_CELEBRATIONS[key];
    const season = getLiturgicalSeason(date);

    if (fixed) {
      return { date, celebration: fixed.name, color: fixed.color, rank: fixed.rank };
    }
    // Sundays
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

  const currentSeason = getLiturgicalSeason(today);

  // Upcoming celebrations
  const upcomingCelebrations = useMemo(() => {
    const upcoming: { date: Date; name: string; color: string; rank: string }[] = [];
    for (let i = 0; i < 60; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const key = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const fixed = FIXED_CELEBRATIONS[key];
      if (fixed) {
        upcoming.push({ date: new Date(d), name: fixed.name, color: fixed.color, rank: fixed.rank });
      }
    }
    return upcoming.slice(0, 6);
  }, []);

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
          Tempo atual: <span className={LITURGICAL_COLORS[currentSeason.color].text}>{currentSeason.season}</span>
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
            <h2 className="text-xl font-serif font-bold text-foreground">{MONTH_NAMES[month]} {year}</h2>
            <button onClick={() => navigateMonth(1)} className="p-2 rounded-xl bg-muted hover:bg-primary/10 transition-all">
              <Icons.ArrowDown className="w-5 h-5 -rotate-90 text-foreground" />
            </button>
          </div>

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
                    ${colorStyle.bg} ${colorStyle.border} border
                    hover:scale-105 hover:shadow-md
                  `}
                >
                  <span className={`font-bold ${colorStyle.text} ${isToday ? 'text-foreground' : ''}`}>{date.getDate()}</span>
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
          {/* Selected day info */}
          {selectedInfo ? (
            <div className={`rounded-2xl border p-5 space-y-3 ${LITURGICAL_COLORS[selectedInfo.color].bg} ${LITURGICAL_COLORS[selectedInfo.color].border}`}>
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                {selectedDay!.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <h3 className={`text-lg font-serif font-bold ${LITURGICAL_COLORS[selectedInfo.color].text}`}>
                {selectedInfo.celebration || 'Féria'}
              </h3>
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${LITURGICAL_COLORS[selectedInfo.color].bg} ${LITURGICAL_COLORS[selectedInfo.color].text}`}>
                  {LITURGICAL_COLORS[selectedInfo.color].label}
                </span>
                {selectedInfo.rank && (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                    {selectedInfo.rank}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground font-serif">
                {getLiturgicalSeason(selectedDay!).season}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-5 text-center">
              <p className="text-sm text-muted-foreground italic">Selecione um dia no calendário</p>
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
                      {c.date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                    </p>
                    <p className={`text-sm font-semibold ${cStyle.text}`}>{c.name}</p>
                    <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">{c.rank}</span>
                  </div>
                );
              })}
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
