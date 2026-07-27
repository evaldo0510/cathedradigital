import React from 'react';
import type { SaintSourceRef } from '../types';

interface Props {
  sources: SaintSourceRef[];
}

/** Fontes Nível 3 — hagiografia oficial, Vatican.va, Aciprensa, etc. */
export const SaintSourcesBlock: React.FC<Props> = ({ sources }) => (
  <section aria-labelledby="saint-sources" className="rounded-2xl border border-border/60 bg-card/40 p-spacing-lg">
    <h2 id="saint-sources" className="font-serif text-premium-lg text-foreground mb-spacing-sm">
      Fontes
    </h2>
    <ul className="space-y-spacing-2xs text-premium-sm">
      {sources.map((s, i) => (
        <li key={i} className="text-muted-foreground">
          {s.url ? (
            <a
              href={s.url}
              target="_blank"
              rel="noopener nofollow"
              className="underline decoration-dotted underline-offset-2 hover:text-primary"
            >
              {s.label}
            </a>
          ) : (
            <span className="text-foreground">{s.label}</span>
          )}
          {s.citation && <span className="ml-1 text-muted-foreground/70">— {s.citation}</span>}
        </li>
      ))}
    </ul>
  </section>
);
