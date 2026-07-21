import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Icons } from '@/constants';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface LiturgyDateNavProps {
  date: Date;
  onChange: (d: Date) => void;
  isToday: boolean;
}

function addDays(d: Date, delta: number): Date {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + delta);
  return nd;
}

function nextSunday(d: Date): Date {
  const nd = new Date(d);
  const dow = nd.getDay(); // 0 = domingo
  const delta = dow === 0 ? 7 : 7 - dow;
  nd.setDate(nd.getDate() + delta);
  return nd;
}

export const LiturgyDateNav: React.FC<LiturgyDateNavProps> = ({ date, onChange, isToday }) => {
  return (
    <div className="flex flex-col items-center gap-spacing-xs" aria-label="Navegação de data litúrgica">
      <div className="flex items-center gap-spacing-md">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onChange(addDays(date, -1))}
          aria-label="Dia anterior"
          className="rounded-premium-full"
        >
          <Icons.ChevronLeft className="w-spacing-md h-spacing-md" />
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'rounded-premium-full h-spacing-2xl px-spacing-lg gap-spacing-xs text-premium-sm font-bold text-primary',
                'min-w-[220px] justify-center',
              )}
              aria-label="Escolher data no calendário"
            >
              <Icons.Calendar className="w-spacing-md h-spacing-md" />
              <span className="capitalize">
                {format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => d && onChange(d)}
              locale={ptBR}
              initialFocus
              className={cn('p-3 pointer-events-auto')}
            />
          </PopoverContent>
        </Popover>

        <Button
          variant="outline"
          size="icon"
          onClick={() => onChange(addDays(date, 1))}
          aria-label="Próximo dia"
          className="rounded-premium-full"
        >
          <Icons.ChevronRight className="w-spacing-md h-spacing-md" />
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-spacing-2xs">
        {!isToday && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange(new Date())}
            className="rounded-premium-full h-spacing-xl px-spacing-md text-premium-xs uppercase tracking-widest"
          >
            Hoje
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange(nextSunday(date))}
          className="rounded-premium-full h-spacing-xl px-spacing-md text-premium-xs uppercase tracking-widest"
        >
          Próximo Domingo
        </Button>
      </div>
    </div>
  );
};

export default LiturgyDateNav;
