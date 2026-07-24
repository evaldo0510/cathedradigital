/**
 * Sprint B.1 · Onda B.1.1 — LibraryCard
 *
 * Wrapper fino do `EditorialCard` canônico. Recebe um `LibraryItem` e monta os
 * slots (`Eyebrow`, `Title`, `Description`, `References`, `CTA`) — NÃO cria
 * markup próprio de card. É o ÚNICO componente autorizado a renderizar itens
 * da Biblioteca; auditoria bloqueia usos alternativos.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { EditorialCard } from '@/components/editorial/harmony';
import { BookOpen, BookMarked, Church, Users, Sparkles, Library, Compass, ScrollText, Feather, Clock3, ArrowRight } from 'lucide-react';
import IceBadge from './IceBadge';
import type { LibraryItem, LibraryModule } from '../types';

const MODULE_ICON: Record<LibraryModule, typeof BookOpen> = {
  glossary: Feather,
  bible: BookMarked,
  catechism: BookOpen,
  saints: Users,
  prayers: Sparkles,
  collections: Library,
  journeys: Compass,
  magisterium: ScrollText,
  patristics: ScrollText,
  liturgy: Church,
};

const MODULE_LABEL: Record<LibraryModule, string> = {
  glossary: 'Glossário',
  bible: 'Bíblia',
  catechism: 'Catecismo',
  saints: 'Santos',
  prayers: 'Orações',
  collections: 'Coleções',
  journeys: 'Jornadas',
  magisterium: 'Magistério',
  patristics: 'Patrística',
  liturgy: 'Liturgia',
};

export interface LibraryCardProps {
  item: LibraryItem;
  density?: 'dense' | 'balanced' | 'minimal';
  className?: string;
}

export const LibraryCard: React.FC<LibraryCardProps> = ({ item, density, className }) => {
  const Icon = MODULE_ICON[item.module];
  const label = MODULE_LABEL[item.module];

  return (
    <EditorialCard
      density={density ?? 'dense'}
      as="div"
      className={className}
      data-library-card=""
      data-library-module={item.module}
    >
      <EditorialCard.Eyebrow>
        <span className="inline-flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          {label}
          {item.category ? <span className="text-muted-foreground">· {item.category}</span> : null}
        </span>
      </EditorialCard.Eyebrow>

      <EditorialCard.Title>
        <Link
          to={item.href}
          className="hover:underline focus-visible:underline focus-visible:outline-none"
        >
          {item.title}
        </Link>
      </EditorialCard.Title>

      {item.summary ? (
        <EditorialCard.Description>{item.summary}</EditorialCard.Description>
      ) : null}

      <EditorialCard.References>
        {item.themes?.slice(0, 2).map((theme) => (
          <span
            key={theme}
            className="rounded-full border border-border/60 px-2 py-0.5 text-xs text-muted-foreground"
          >
            {theme}
          </span>
        ))}
        {item.ice ? <IceBadge level={item.ice} /> : null}
        {typeof item.nexusCount === 'number' && item.nexusCount > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2 py-0.5 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            {item.nexusCount} nexus
          </span>
        ) : null}
        {typeof item.readingMinutes === 'number' && item.readingMinutes > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2 py-0.5 text-xs text-muted-foreground">
            <Clock3 className="h-3 w-3" aria-hidden="true" />
            {item.readingMinutes} min
          </span>
        ) : null}
      </EditorialCard.References>

      <EditorialCard.CTA>
        <Link
          to={item.href}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline focus-visible:underline focus-visible:outline-none"
        >
          Abrir
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </EditorialCard.CTA>
    </EditorialCard>
  );
};

export default LibraryCard;
