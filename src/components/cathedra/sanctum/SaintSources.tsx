import React from 'react';
import { Icons } from '../../../constants';
import type { Saint } from '@/data/saints';

const SectionTitle: React.FC<{ icon: keyof typeof Icons; children: React.ReactNode }> = ({ icon, children }) => {
  const Icon = Icons[icon] as any;
  return (
    <div className="flex items-center gap-spacing-xs text-primary">
      {Icon && <Icon className="w-spacing-md h-spacing-md" aria-hidden="true" />}
      <h3 className="text-premium-small font-black uppercase tracking-[0.2em]">{children}</h3>
    </div>
  );
};

/** SaintSources — bibliografia editorial com links externos. */
const SaintSources: React.FC<{ saint: Saint }> = ({ saint }) => {
  if (!saint.sources?.length) return null;

  return (
    <section className="space-y-spacing-md pt-spacing-lg border-t border-border">
      <SectionTitle icon="BookOpen">Fontes e bibliografia</SectionTitle>
      <ul className="space-y-spacing-2xs text-premium-sm text-muted-foreground">
        {saint.sources.map((s, i) => (
          <li key={i} className="font-serif">
            {s.author && <span className="text-foreground/80">{s.author}. </span>}
            <em className="text-foreground/90">{s.title}</em>
            {s.year && <span>, {s.year}</span>}
            {s.url && (
              <>
                {' · '}
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-2 hover:text-primary/80"
                >
                  fonte
                </a>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
};

export default SaintSources;
