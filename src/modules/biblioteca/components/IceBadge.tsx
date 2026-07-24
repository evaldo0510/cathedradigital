/**
 * Sprint B.1 · Onda B.1.1 — IceBadge
 *
 * Selo editorial único da Biblioteca. Deriva de `editorial_completeness`:
 *  - draft    → cinza (em elaboração)
 *  - review   → âmbar (em revisão)
 *  - complete → dourado (certificado)
 *
 * NÃO renderiza score numérico; o ICE Universal com número entra na C0.6.
 * Consome apenas tokens semânticos + `--gold` (design-system-guardian).
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, CircleDashed, Clock } from 'lucide-react';
import type { LibraryIce } from '../types';

interface IceBadgeProps {
  level: LibraryIce;
  className?: string;
}

const CONFIG: Record<LibraryIce, { label: string; icon: typeof CheckCircle2; className: string }> = {
  draft: {
    label: 'Rascunho',
    icon: CircleDashed,
    className: 'bg-muted text-muted-foreground border-border',
  },
  review: {
    label: 'Em revisão',
    icon: Clock,
    className: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
  },
  complete: {
    label: 'Certificado',
    icon: CheckCircle2,
    className: 'bg-[hsl(var(--gold))]/10 text-[hsl(var(--gold-on-dark))] border-[hsl(var(--gold))]/40',
  },
};

export const IceBadge: React.FC<IceBadgeProps> = ({ level, className }) => {
  const { label, icon: Icon, className: tone } = CONFIG[level];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
        tone,
        className,
      )}
      aria-label={`Selo editorial: ${label}`}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {label}
    </span>
  );
};

export default IceBadge;
