import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, BookOpen } from 'lucide-react';
import type { SaintWritingRef } from '../types';

interface Props {
  writings: SaintWritingRef[];
}

/** Escritos: hospedados (`slug`) preferem link interno; senão externo com atribuição. */
export const SaintWritingsBlock: React.FC<Props> = ({ writings }) => (
  <section aria-labelledby="saint-writings" className="rounded-2xl border border-border/60 bg-card/40 p-spacing-lg">
    <h2 id="saint-writings" className="font-serif text-premium-lg text-foreground mb-spacing-sm">
      Escritos
    </h2>
    <ul className="space-y-spacing-sm">
      {writings.map((w) => {
        const internal = w.slug ? `/biblioteca/escritos/${w.slug}` : null;
        const Wrapper: React.ElementType = internal ? Link : 'a';
        const wrapperProps = internal
          ? { to: internal }
          : { href: w.externalUrl ?? '#', target: '_blank', rel: 'noopener nofollow' };
        return (
          <li key={w.id} className="rounded-xl border border-border/50 p-spacing-md">
            <Wrapper
              {...wrapperProps}
              className="flex items-start gap-spacing-xs group"
            >
              {internal ? (
                <BookOpen className="w-4 h-4 mt-1 text-primary flex-shrink-0" aria-hidden />
              ) : (
                <ExternalLink className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" aria-hidden />
              )}
              <span className="font-serif text-premium-md text-foreground group-hover:text-primary transition-colors">
                {w.title}
              </span>
            </Wrapper>
            {w.summary && (
              <p className="text-premium-sm text-muted-foreground mt-spacing-2xs leading-relaxed">
                {w.summary}
              </p>
            )}
            {(w.attribution || w.license) && (
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 mt-spacing-2xs">
                {[w.attribution, w.license].filter(Boolean).join(' · ')}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  </section>
);
