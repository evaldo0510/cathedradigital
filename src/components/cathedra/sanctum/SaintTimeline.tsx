import React from 'react';
import { Icons } from '../../../constants';
import type { Saint } from '@/data/saints';

const TIMELINE_ICON: Record<string, keyof typeof Icons> = {
  birth: 'User',
  conversion: 'Sparkles',
  formation: 'BookOpen',
  mission: 'Route',
  work: 'Feather',
  miracle: 'Star',
  martyrdom: 'Flame',
  death: 'XCircle',
  canonization: 'Crown',
  feast: 'Calendar',
};

const SectionTitle: React.FC<{ icon: keyof typeof Icons; children: React.ReactNode }> = ({ icon, children }) => {
  const Icon = Icons[icon] as any;
  return (
    <div className="flex items-center gap-spacing-xs text-primary">
      {Icon && <Icon className="w-spacing-md h-spacing-md" aria-hidden="true" />}
      <h3 className="text-premium-small font-black uppercase tracking-[0.2em]">{children}</h3>
    </div>
  );
};

/** SaintTimeline — linha do tempo vertical com ícones por tipo de evento. */
const SaintTimeline: React.FC<{ saint: Saint }> = ({ saint }) => {
  if (!saint.timeline?.length) return null;

  return (
    <section className="space-y-spacing-md">
      <SectionTitle icon="Calendar">Linha do tempo</SectionTitle>
      <ol className="relative border-l-2 border-primary/20 pl-spacing-lg space-y-spacing-lg">
        {saint.timeline.map((ev, i) => {
          const iconName = TIMELINE_ICON[ev.type || 'work'] || 'Star';
          const Icon = Icons[iconName] as any;
          return (
            <li key={i} className="relative">
              <span className="absolute -left-[calc(theme(spacing.spacing-lg)+9px)] top-0 w-spacing-lg h-spacing-lg rounded-premium-full bg-background border-2 border-primary/40 flex items-center justify-center text-primary">
                {Icon && <Icon className="w-3 h-3" aria-hidden="true" />}
              </span>
              <div className="flex flex-wrap items-baseline gap-spacing-xs">
                {ev.year !== undefined && (
                  <span className="text-premium-xs font-black uppercase tracking-widest text-primary">
                    {ev.year}
                  </span>
                )}
                <p className="font-serif text-premium-md text-foreground">{ev.event}</p>
              </div>
              {ev.place && (
                <p className="text-premium-xs text-muted-foreground mt-spacing-2xs">
                  <Icons.MapPin className="inline w-3 h-3 mr-1" aria-hidden="true" />
                  {ev.place}
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
};

export default SaintTimeline;
