import { Icons } from '@/constants';
import { 
  BookOpen, 
  Church, 
  Users, 
  Heart, 
  Library, 
  Route, 
  Search,
  Star,
  Shield,
  Sun,
  Flame,
  User,
  Crown
} from 'lucide-react';

export interface ShelfItem {
  label: string;
  to: string;
  icon: any;
  desc: string;
  count?: string;
  badge?: string;
}

export interface LibraryShelf {
  id: string;
  title: string;
  icon: any;
  items: ShelfItem[];
}

export const MONASTERY_SHELVES: LibraryShelf[] = [
  {
    id: 'formation',
    title: 'FORMAÇÃO',
    icon: BookOpen,
    items: [
      { label: 'Bíblia', to: '/bible', icon: Icons.Bible, desc: 'Escrituras' },
      { label: 'Catecismo', to: '/catechism', icon: Icons.BookOpen, desc: 'Doutrina' },
      { label: 'Glossário', to: '/glossary', icon: Icons.ScrollText, desc: 'Termos' },
      { label: 'Temas', to: '/buscar?q=temas', icon: Search, desc: 'Estudos' },
    ]
  },
  {
    id: 'spirituality',
    title: 'ESPIRITUALIDADE',
    icon: Heart,
    items: [
      { label: 'Santos', to: '/saints', icon: User, desc: 'Capelas' },
      { label: 'Aparições', to: '/aparicoes', icon: Star, desc: 'Maria' },
      { label: 'Orações', to: '/oracao', icon: Heart, desc: 'Devocionário' },
      { label: 'Liturgia', to: '/liturgia', icon: Sun, desc: 'Calendário' },
    ]
  },
  {
    id: 'church',
    title: 'IGREJA',
    icon: Church,
    items: [
      { label: 'Patrística', to: '/biblioteca?filter=patristica', icon: Library, desc: 'Padres' },
      { label: 'Magistério', to: '/magisterium', icon: Shield, desc: 'Documentos' },
      { label: 'Papas', to: '/papas', icon: Crown, desc: 'Sucessores' },
      { label: 'Dogmas', to: '/dogmas', icon: Shield, desc: 'Verdades' },
      { label: 'Doutores', to: '/doutores', icon: GraduationCap, desc: 'Mestres' },
      { label: 'História', to: '/timeline', icon: Icons.Clock, desc: 'Linha do Tempo' },
      { label: 'Atlas', to: '/atlas', icon: Icons.Globe, desc: 'Geografia' },
    ]
  }
];

import { GraduationCap } from 'lucide-react';
