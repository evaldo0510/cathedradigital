import React from 'react';
import type { SaintVirtue } from '../types';

interface Props {
  virtues: SaintVirtue[];
}

export const SaintVirtuesBlock: React.FC<Props> = ({ virtues }) => (
  <section aria-labelledby="saint-virtues" className="rounded-2xl border border-border/60 bg-card/40 p-spacing-lg">
    <h2 id="saint-virtues" className="font-serif text-premium-lg text-foreground mb-spacing-sm">
      Virtudes e carisma
    </h2>
    <ul className="grid gap-spacing-sm sm:grid-cols-2">
      {virtues.map((v, i) => (
        <li key={i} className="rounded-xl border border-border/50 p-spacing-md">
          <p className="font-serif text-premium-md text-foreground">{v.label}</p>
          {v.description && (
            <p className="text-premium-sm text-muted-foreground mt-spacing-2xs leading-relaxed">
              {v.description}
            </p>
          )}
        </li>
      ))}
    </ul>
  </section>
);
