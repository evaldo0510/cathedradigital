/**
 * Sprint B.1 · Onda B.1.2 — Metadados canônicos por módulo (rótulo, ícone,
 * peso doutrinal). Fonte única para toda a Biblioteca: filtros, cards, chips.
 */
import {
  BookMarked,
  BookOpen,
  Church,
  Feather,
  Library,
  Route,
  Scroll,
  ScrollText,
  Sparkles,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import type { LibraryModule } from '../types';

export interface LibraryModuleMeta {
  module: LibraryModule;
  label: string;
  icon: LucideIcon;
  /** Peso doutrinal (0-15) somado ao score final. */
  doctrinalWeight: number;
}

export const LIBRARY_MODULE_META: Record<LibraryModule, LibraryModuleMeta> = {
  bible:       { module: 'bible',       label: 'Bíblia',      icon: BookOpen,   doctrinalWeight: 15 },
  catechism:   { module: 'catechism',   label: 'Catecismo',   icon: ScrollText, doctrinalWeight: 14 },
  magisterium: { module: 'magisterium', label: 'Magistério',  icon: Scroll,     doctrinalWeight: 13 },
  glossary:    { module: 'glossary',    label: 'Glossário',   icon: BookMarked, doctrinalWeight: 12 },
  liturgy:     { module: 'liturgy',     label: 'Liturgia',    icon: Church,     doctrinalWeight: 11 },
  patristics:  { module: 'patristics',  label: 'Patrística',  icon: Feather,    doctrinalWeight: 10 },
  prayers:     { module: 'prayers',     label: 'Orações',     icon: Sparkles,   doctrinalWeight: 9  },
  saints:      { module: 'saints',      label: 'Santos',      icon: UserRound,  doctrinalWeight: 8  },
  collections: { module: 'collections', label: 'Coleções',    icon: Library,    doctrinalWeight: 6  },
  journeys:    { module: 'journeys',    label: 'Jornadas',    icon: Route,      doctrinalWeight: 5  },
};

export const LIBRARY_MODULE_ORDER: LibraryModule[] = [
  'glossary', 'bible', 'catechism', 'saints',
  'prayers', 'collections', 'journeys',
  'magisterium', 'patristics', 'liturgy',
];
