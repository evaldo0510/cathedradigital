import React from 'react';
import { format, addDays, subDays, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Icons } from '@/constants';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

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
 * dias da tira usam aria-pressed.
 */
export interface SanctorumDateNavProps {
  value: Date;
  onChange: (date: Date) => void;
  /** Nº de dias na tira horizontal (default 7, sempre ímpar). */
  stripDays?: number;
  className?: string;
}

export const SanctorumDateNav: React.FC<SanctorumDateNavProps> = ({
  value,
  onChange,
  stripDays = 7,
  className,
}) => {
  const half = Math.floor(stripDays / 2);
  const strip = Array.from({ length: stripDays }).map((_, i) =>
    addDays(subDays(value, half), i),
  );

  return (
    <div className={cn('flex flex-col items-center gap-spacing-lg', className)}>
      <div className="flex items-center gap-spacing-md md:gap-spacing-xl">
        <Button
          onClick={() => onChange(subDays(value, 1))}
          className="p-spacing-sm bg-card border border-border rounded-premium-full hover:bg-primary/5 hover:border-primary/30 transition-all text-muted-foreground hover:text-primary"
          aria-label="Dia anterior"
        >
          <Icons.ChevronLeft className="w-spacing-md h-spacing-md" />
        </Button>

        <div className="text-center min-w-[200px]">
          <h2 className="text-premium-2xl font-serif font-bold text-foreground">
            {format(value, "dd 'de' MMMM", { locale: ptBR })}
          </h2>
          <p className="text-premium-xs font-black uppercase tracking-widest text-primary mt-spacing-2xs">
            {format(value, 'EEEE', { locale: ptBR })}
          </p>
        </div>

        <Button
          onClick={() => onChange(addDays(value, 1))}
          className="p-spacing-sm bg-card border border-border rounded-premium-full hover:bg-primary/5 hover:border-primary/30 transition-all text-muted-foreground hover:text-primary"
          aria-label="Próximo dia"
        >
          <Icons.ChevronRight className="w-spacing-md h-spacing-md" />
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-spacing-xs">
        <Button
          onClick={() => onChange(subDays(value, 7))}
          aria-label="Semana anterior"
          className="h-spacing-xl px-spacing-md bg-card border border-border rounded-premium-full text-premium-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
        >
          <Icons.ChevronLeft className="w-spacing-sm h-spacing-sm mr-spacing-2xs" />
          Semana
        </Button>
        <Button
          onClick={() => onChange(new Date())}
          disabled={isToday(value)}
          aria-label="Ir para hoje"
          aria-current={isToday(value) ? 'date' : undefined}
          className={cn(
            'h-spacing-xl px-spacing-lg rounded-premium-full text-premium-xs font-black uppercase tracking-widest transition-all',
            isToday(value)
              ? 'bg-primary text-primary-foreground shadow-premium shadow-primary/20 cursor-default'
              : 'bg-card border border-border text-foreground hover:border-primary/30 hover:text-primary',
          )}
        >
          <Icons.Calendar className="w-spacing-sm h-spacing-sm mr-spacing-2xs" aria-hidden="true" />
          Hoje
        </Button>
        <Button
          onClick={() => onChange(addDays(value, 7))}
          aria-label="Próxima semana"
          className="h-spacing-xl px-spacing-md bg-card border border-border rounded-premium-full text-premium-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
        >
          Semana
          <Icons.ChevronRight className="w-spacing-sm h-spacing-sm ml-spacing-2xs" />
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              aria-label="Escolher data no calendário"
              className="h-spacing-xl px-spacing-md bg-card border border-border rounded-premium-full text-premium-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
            >
              <Icons.Calendar className="w-spacing-sm h-spacing-sm mr-spacing-2xs" aria-hidden="true" />
              Calendário
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 pointer-events-auto" align="center">
            <CalendarPicker
              mode="single"
              selected={value}
              onSelect={(d) => d && onChange(d)}
              initialFocus
              locale={ptBR}
              className={cn('p-3 pointer-events-auto')}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex gap-spacing-xs overflow-x-auto pb-spacing-xs px-spacing-md max-w-full no-scrollbar">
        {strip.map((date, i) => (
          <Button
            key={i}
            onClick={() => onChange(date)}
            className={`flex flex-col items-center justify-center min-w-[56px] h-spacing-3xl rounded-premium-full border transition-all ${
              isSameDay(date, value)
                ? 'bg-primary border-primary text-primary-foreground shadow-premium shadow-primary/20 scale-110'
                : 'bg-card border-border text-muted-foreground hover:border-primary/30 hover:text-primary'
            }`}
            aria-label={format(date, "dd 'de' MMMM", { locale: ptBR })}
            aria-pressed={isSameDay(date, value)}
          >
            <span className="text-premium-xs font-black uppercase tracking-tighter mb-spacing-2xs">
              {format(date, 'EEE', { locale: ptBR }).replace('.', '')}
            </span>
            <span className="text-premium-lg font-serif font-bold">{format(date, 'dd')}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default SanctorumDateNav;
