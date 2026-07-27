import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import type { SaintPrayerRef } from '../types';

interface Props {
  prayers: SaintPrayerRef[];
}

export const SaintPrayersBlock: React.FC<Props> = ({ prayers }) => (
  <section aria-labelledby="saint-prayers" className="rounded-2xl border border-border/60 bg-card/40 p-spacing-lg">
    <h2 id="saint-prayers" className="font-serif text-premium-lg text-foreground mb-spacing-sm">
      Orações associadas
    </h2>
    <ul className="space-y-spacing-2xs">
      {prayers.map((p) => (
        <li key={p.id}>
          <Link
            to={`/oracao/${p.slug}`}
            className="flex items-center gap-spacing-xs rounded-lg p-spacing-sm hover:bg-primary/[0.05] transition-colors group"
          >
            <Sparkles className="w-4 h-4 text-primary flex-shrink-0" aria-hidden />
            <span className="font-serif text-premium-md text-foreground group-hover:text-primary transition-colors">
              {p.title}
            </span>
            {p.kind && (
              <span className="ml-auto text-[10px] uppercase tracking-widest text-muted-foreground">
                {p.kind}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  </section>
);
