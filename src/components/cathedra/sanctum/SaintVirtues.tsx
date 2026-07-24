import React from 'react';
import { Icons } from '../../../constants';
import type { Saint } from '@/data/saints';

/**
 * SaintVirtues — grade de badges de virtudes.
 * Mantém tokens/badges canônicos (bg-primary/10, border-primary/20, uppercase tracking-widest).
 */
const SaintVirtues: React.FC<{ saint: Saint; headingId?: string }> = ({ saint, headingId = 'virt-heading' }) => {
  const virtues = saint.virtues ?? [];
  if (virtues.length === 0) return null;

  return (
    <section aria-labelledby={headingId} className="space-y-spacing-md">
      <div className="flex items-center gap-spacing-xs text-primary">
        <Icons.Shield className="w-spacing-md h-spacing-md" aria-hidden="true" />
        <h3 id={headingId} className="text-premium-small font-black uppercase tracking-[0.2em]">Virtudes</h3>
      </div>
      <ul className="flex flex-wrap gap-spacing-xs" role="list">
        {virtues.map((v) => (
          <li key={v}>
            <span className="inline-flex items-center px-spacing-md py-spacing-2xs bg-primary/10 text-primary text-premium-xs font-black uppercase tracking-widest rounded-premium-full border border-primary/20">
              {v}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default SaintVirtues;
