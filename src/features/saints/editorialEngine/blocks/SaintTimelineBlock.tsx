import React from 'react';
import type { SaintTimelineEvent } from '../types';

interface Props {
  events: SaintTimelineEvent[];
}

export const SaintTimelineBlock: React.FC<Props> = ({ events }) => (
  <section aria-labelledby="saint-timeline" className="rounded-2xl border border-border/60 bg-card/40 p-spacing-lg">
    <h2 id="saint-timeline" className="font-serif text-premium-lg text-foreground mb-spacing-sm">
      Linha do tempo
    </h2>
    <ol className="relative border-l border-border/50 pl-spacing-md space-y-spacing-md">
      {events.map((e, i) => (
        <li key={`${e.year}-${i}`} className="relative">
          <span
            className="absolute -left-[calc(theme(spacing.spacing-md)+5px)] top-[6px] w-2 h-2 rounded-full bg-primary"
            aria-hidden
          />
          <p className="text-[10px] font-mono uppercase tracking-widest text-primary">{e.year}</p>
          <p className="font-serif text-premium-md text-foreground">{e.title}</p>
          {e.detail && (
            <p className="text-premium-sm text-muted-foreground leading-relaxed">{e.detail}</p>
          )}
        </li>
      ))}
    </ol>
  </section>
);
