import React, { useState, useCallback } from 'react';
import { format, addDays, subDays, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Icons } from '@/constants';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';

/**
 * SanctorumDateNav — Navegação de datas reutilizável para páginas Sanctorum
 * (Santos, Papas, etc.).
 *
 * Estrutura:
 *  1. Header com dia anterior/próximo e data por extenso.
 *  2. Atalhos: Semana anterior · Hoje · Semana próxima · Calendário (Popover).
 *  3. Tira horizontal com 7 dias (−3 … +3) para toque rápido.
 *
 * A11y: cada botão tem aria-label; "Hoje" usa aria-current="date";
 * dias da tira usam aria-pressed; grupo com role="group" e aria-label.
 *
 * Analytics: emite `sanctorum_date_change` com `{ method, date }`.
 */
export type SanctorumDateChangeMethod =
  | 'prev-day'
  | 'next-day'
  | 'prev-week'
  | 'next-week'
  | 'today'
  | 'calendar'
  | 'strip';

export interface SanctorumDateNavProps {
  value: Date;
  onChange: (date: Date) => void;
  /** Nº de dias na tira horizontal (default 7, sempre ímpar). */
  stripDays?: number;
  /** Rótulo do grupo para leitores de tela. */
  ariaLabel?: string;
  /** Identifica a página que hospeda o nav nos eventos de analytics. */
  analyticsPage?: string;
  className?: string;
}

export const SanctorumDateNav: React.FC<SanctorumDateNavProps> = ({
  value,
  onChange,
  stripDays = 7,
  ariaLabel = 'Navegação por data',
  analyticsPage,
  className,
}) => {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const half = Math.floor(stripDays / 2);
  const strip = Array.from({ length: stripDays }).map((_, i) =>
    addDays(subDays(value, half), i),
  );

  const emit = useCallback(
    (method: SanctorumDateChangeMethod, next: Date) => {
      try {
        trackEvent('sanctorum_date_change', {
          method,
          date: next.toISOString().slice(0, 10),
          page: analyticsPage,
        });
      } catch {
        /* analytics never bloqueia UX */
      }
    },
    [analyticsPage],
  );

  const change = useCallback(
    (next: Date, method: SanctorumDateChangeMethod) => {
      emit(method, next);
      onChange(next);
    },
    [emit, onChange],
  );

  const handleCalendarSelect = (d: Date | undefined) => {
    if (!d) return;
    change(d, 'calendar');
    setCalendarOpen(false);
  };




  return (
    <div
      className={cn('flex flex-col items-center gap-spacing-lg', className)}
      role="group"
      aria-label={ariaLabel}
    >
      <div className="flex w-full max-w-full items-center justify-center gap-spacing-xs sm:gap-spacing-md md:gap-spacing-xl">
        <Button
          onClick={() => change(subDays(value, 1), 'prev-day')}
          className="shrink-0 min-h-11 min-w-11 p-spacing-xs sm:p-spacing-sm bg-card border border-border rounded-premium-full hover:bg-primary/5 hover:border-primary/30 focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-all text-muted-foreground hover:text-primary"
          aria-label="Dia anterior"
        >
          <Icons.ChevronLeft className="w-spacing-md h-spacing-md" />
        </Button>

        <div
          className="text-center min-w-0 flex-1 sm:flex-none sm:min-w-[200px] px-spacing-2xs"
          aria-live="polite"
          aria-atomic="true"
        >
          <h2 className="text-premium-lg sm:text-premium-xl md:text-premium-2xl font-serif font-bold text-foreground leading-tight break-words line-clamp-2">
            {format(value, "dd 'de' MMMM", { locale: ptBR })}
          </h2>
          <p className="text-premium-xs font-black uppercase tracking-widest text-primary mt-spacing-2xs truncate">
            {format(value, 'EEEE', { locale: ptBR })}
          </p>
        </div>

        <Button
          onClick={() => change(addDays(value, 1), 'next-day')}
          className="shrink-0 min-h-11 min-w-11 p-spacing-xs sm:p-spacing-sm bg-card border border-border rounded-premium-full hover:bg-primary/5 hover:border-primary/30 focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-all text-muted-foreground hover:text-primary"
          aria-label="Próximo dia"
        >
          <Icons.ChevronRight className="w-spacing-md h-spacing-md" />
        </Button>
      </div>


      <div className="flex flex-wrap items-center justify-center gap-spacing-xs">
        <Button
          onClick={() => change(subDays(value, 7), 'prev-week')}
          aria-label="Semana anterior"
          className="min-h-11 px-spacing-md bg-card border border-border rounded-premium-full text-premium-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary hover:border-primary/30 focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-all"
        >
          <Icons.ChevronLeft className="w-spacing-sm h-spacing-sm mr-spacing-2xs" />
          Semana
        </Button>
        <Button
          onClick={() => change(new Date(), 'today')}
          disabled={isToday(value)}
          aria-label="Ir para hoje"
          aria-current={isToday(value) ? 'date' : undefined}
          className={cn(
            'min-h-11 px-spacing-lg rounded-premium-full text-premium-xs font-black uppercase tracking-widest transition-all focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            isToday(value)
              ? 'bg-primary text-primary-foreground shadow-premium shadow-primary/20 cursor-default'
              : 'bg-card border border-border text-foreground hover:border-primary/30 hover:text-primary',
          )}
        >
          <Icons.Calendar className="w-spacing-sm h-spacing-sm mr-spacing-2xs" aria-hidden="true" />
          Hoje
        </Button>
        <Button
          onClick={() => change(addDays(value, 7), 'next-week')}
          aria-label="Próxima semana"
          className="min-h-11 px-spacing-md bg-card border border-border rounded-premium-full text-premium-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary hover:border-primary/30 focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-all"
        >
          Semana
          <Icons.ChevronRight className="w-spacing-sm h-spacing-sm ml-spacing-2xs" />
        </Button>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              aria-label="Escolher data no calendário"
              aria-haspopup="dialog"
              aria-expanded={calendarOpen}
              className="min-h-11 px-spacing-md bg-card border border-border rounded-premium-full text-premium-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary hover:border-primary/30 focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-all"
            >
              <Icons.Calendar className="w-spacing-sm h-spacing-sm mr-spacing-2xs" aria-hidden="true" />
              Calendário
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 pointer-events-auto" align="center">
            <CalendarPicker
              mode="single"
              selected={value}
              defaultMonth={value}
              onSelect={handleCalendarSelect}
              initialFocus
              locale={ptBR}
              modifiers={{ today: new Date() }}
              modifiersClassNames={{ today: 'ring-2 ring-primary/60 ring-offset-1 ring-offset-background' }}
              className={cn('p-3 pointer-events-auto')}
            />
          </PopoverContent>
        </Popover>

      </div>

      <div
        className="flex gap-spacing-xs sm:gap-spacing-sm overflow-x-auto pt-spacing-2xs pb-spacing-sm px-spacing-2xs max-w-full no-scrollbar snap-x snap-mandatory scroll-smooth"
        role="group"
        aria-label="Tira de dias"
        data-testid="sanctorum-date-strip"
        onKeyDown={(e) => {
          if (e.key === 'Home') {
            e.preventDefault();
            change(strip[0], 'strip');
          } else if (e.key === 'End') {
            e.preventDefault();
            change(strip[strip.length - 1], 'strip');
          }
        }}
      >
        {strip.map((date, i) => {
          const active = isSameDay(date, value);
          const today = isToday(date);
          return (
            <Button
              key={i}
              onClick={() => change(date, 'strip')}
              className={cn(
                'group relative flex flex-col items-center justify-center shrink-0 snap-start whitespace-nowrap',
                'w-14 sm:w-16 h-16 sm:h-[4.5rem] p-0 rounded-premium-md border-2 transition-all',
                'focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                active
                  ? 'bg-primary border-primary text-primary-foreground shadow-premium shadow-primary/25'
                  : today
                    ? 'bg-card border-primary/40 text-foreground hover:border-primary hover:bg-primary/5'
                    : 'bg-card border-border/70 text-foreground/80 hover:border-primary/40 hover:text-primary hover:bg-primary/5',
              )}
              aria-label={format(date, "dd 'de' MMMM", { locale: ptBR })}
              aria-pressed={active}
              aria-current={today && !active ? 'date' : undefined}
            >
              <span
                className={cn(
                  'text-[10px] leading-none font-black uppercase tracking-widest mb-spacing-2xs',
                  active ? 'text-primary-foreground/85' : 'text-muted-foreground group-hover:text-primary/80',
                )}
              >
                {format(date, 'EEEEEE', { locale: ptBR }).replace('.', '').slice(0, 3)}
              </span>
              <span className="text-[1.375rem] leading-none font-serif font-bold tabular-nums">
                {format(date, 'dd')}
              </span>
              {today && !active && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-1.5 h-1 w-1 rounded-full bg-primary"
                />
              )}
            </Button>
          );
        })}

      </div>
    </div>
  );
};

export default SanctorumDateNav;
