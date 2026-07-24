/**
 * Sprint B.1 · Onda B.1.3 — "Descobrir por tema".
 *
 * Grade de temas canônicos que dispara buscas pré-formadas via `?q=`. É
 * intencionalmente estático nesta onda; na B.1.5 será alimentado por
 * `nexus_relations` + histórico do usuário.
 */
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Church,
  Cross,
  Flame,
  HeartHandshake,
  ScrollText,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Theme {
  label: string;
  query: string;
  icon: LucideIcon;
}

const THEMES: Theme[] = [
  { label: 'Trindade',    query: 'Trindade',   icon: Sparkles },
  { label: 'Sacramentos', query: 'Sacramento', icon: Cross },
  { label: 'Santos',      query: 'Santo',      icon: Users },
  { label: 'Moral',       query: 'Virtude',    icon: HeartHandshake },
  { label: 'Liturgia',    query: 'Liturgia',   icon: Church },
  { label: 'Oração',      query: 'Oração',     icon: Flame },
  { label: 'Bíblia',      query: 'Bíblia',     icon: BookOpen },
  { label: 'Magistério',  query: 'Encíclica',  icon: ScrollText },
];

export interface LibraryThemesBlockProps {
  className?: string;
  /** Rota de destino que aceita `?q=`. Default `/biblioteca?q=…`. */
  hrefBase?: string;
}

export function LibraryThemesBlock({ className, hrefBase = '/biblioteca' }: LibraryThemesBlockProps) {
  return (
    <div className={cn('grid grid-cols-2 gap-3 sm:grid-cols-4', className)}>
      {THEMES.map(({ label, query, icon: Icon }) => (
        <Link
          key={label}
          to={`${hrefBase}?q=${encodeURIComponent(query)}`}
          className="group flex flex-col items-start gap-2 rounded-lg border border-border bg-card p-4 transition hover:border-primary/40 hover:shadow-sm"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="h-4 w-4" aria-hidden />
          </span>
          <span className="text-sm font-semibold text-foreground group-hover:text-primary">
            {label}
          </span>
        </Link>
      ))}
    </div>
  );
}

export default LibraryThemesBlock;
