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
    id: 'scripture',
    title: '📖 Sagrada Escritura',
    icon: BookOpen,
    items: [
      { label: 'Bíblia', to: '/bible', icon: Icons.Bible, desc: '73 Livros', count: 'Escrituras' },
      { label: 'Comentários', to: '/biblioteca/inteligente?q=comentarios', icon: Icons.BookOpen, desc: 'Exegese', badge: 'Nexus' },
      { label: 'Evangelhos', to: '/bible/gospels', icon: Crown, desc: 'Boa Nova', count: 'Vida de Cristo' },
      { label: 'Salmos', to: '/bible/psalms', icon: Icons.Music, desc: 'Oração', count: 'Harpa de Davi' },
    ]
  },
  {
    id: 'patristic',
    title: '📜 Patrística',
    icon: Library,
    items: [
      { label: 'Padres Apostólicos', to: '/biblioteca?filter=apostolicos', icon: Icons.Church, desc: 'Primeiro Século', count: 'Patrística' },
      { label: 'Padres Gregos', to: '/biblioteca?filter=gregos', icon: Icons.ScrollText, desc: 'Leste Cristão', badge: 'Patrística' },
      { label: 'Padres Latinos', to: '/biblioteca?filter=latinos', icon: Icons.ScrollText, desc: 'Oeste Cristão', badge: 'Patrística' },
      { label: 'Grandes Obras', to: '/biblioteca?filter=obras-primas', icon: Icons.BookOpen, desc: 'Tesouros da Fé', count: 'Acervo' },
    ]
  },
  {
    id: 'magisterium',
    title: '🏛 Magistério',
    icon: Church,
    items: [
      { label: 'Encíclicas', to: '/magisterium?filter=enciclicas', icon: Icons.ScrollText, desc: 'Cartas Circulares', count: 'Magistério' },
      { label: 'Documentos Conciliares', to: '/magisterium?filter=concilio', icon: Icons.Users, desc: 'Vaticano II e outros', badge: 'História' },
      { label: 'Cartas Apostólicas', to: '/magisterium?filter=cartas', icon: Icons.ScrollText, desc: 'Orientação', count: 'Doutrina' },
      { label: 'Motu Proprio', to: '/magisterium?filter=motu', icon: Icons.Shield, desc: 'Iniciativa Própria', badge: 'Legal' },
    ]
  },
  {
    id: 'saints-popes',
    title: '👤 Santos e Papas',
    icon: Users,
    items: [
      { label: 'Vidas dos Santos', to: '/saints', icon: Icons.User, desc: 'Hagiografia', count: 'Vidas' },
      { label: 'Sucessores de Pedro', to: '/papas', icon: Icons.Crown, desc: 'Pontificado', badge: 'Papas' },
      { label: 'Mártires', to: '/saints?filter=martir', icon: Flame, desc: 'Testemunho', count: 'Sangue' },
      { label: 'Aparições', to: '/aparicoes', icon: Star, desc: 'Visitas Celestes', count: 'Maria' },
    ]
  },
  {
    id: 'doctrine',
    title: '🛡 Doutrina e Dogmas',
    icon: Shield,
    items: [
      { label: 'Catecismo', to: '/catechism', icon: Icons.BookOpen, desc: '2865 Artigos', count: 'Doutrina' },
      { label: 'Doutores da Igreja', to: '/doutores', icon: GraduationCap, desc: 'Mestres', badge: 'Sapiência' },
      { label: 'Dogmas de Fé', to: '/dogmas', icon: Shield, desc: 'Verdades Eternas', count: 'Certificado' },
      { label: 'Summa Theologica', to: '/aquinas', icon: Icons.BookOpen, desc: 'Sto. Tomás', badge: 'Doutor' },
    ]
  },
  {
    id: 'spirituality',
    title: '🙏 Espiritualidade',
    icon: Heart,
    items: [
      { label: 'Orações', to: '/oracao', icon: Icons.Heart, desc: 'Livro de Preces', count: 'Devocionário' },
      { label: 'Liturgia', to: '/liturgia', icon: Icons.Sun, desc: 'Missa Diária', count: 'Calendário' },
      { label: 'Breviário', to: '/liturgia/horas', icon: Icons.Book, desc: 'Horas', count: 'Opus Dei' },
      { label: 'História da Igreja', to: '/timeline', icon: Icons.Clock, desc: 'Linha do Tempo', badge: 'Nexus' },
    ]
  },
  {
    id: 'formation',
    title: '🧭 Formação',
    icon: Route,
    items: [
      { label: 'Jornadas', to: '/jornadas', icon: Icons.Route, desc: 'Passo a Passo', count: 'Itinerários' },
      { label: 'Trilhas', to: '/biblioteca/trilhas', icon: Icons.Search, desc: 'Temáticas', count: 'Estudos' },
      { label: 'Coleções', to: '/biblioteca/colecoes', icon: Library, desc: 'Volumes', badge: 'Curadoria' },
      { label: 'Plano', to: '/profile/plano', icon: Icons.Calendar, desc: 'Diário', count: 'Progresso' },
    ]
  },
  {
    id: 'logos',
    title: '🔍 Logos & Atlas',
    icon: Search,
    items: [
      { label: 'Busca Global', to: '/biblioteca/inteligente', icon: Icons.Search, desc: 'Omniscience', badge: 'IA' },
      { label: 'Conexões', to: '/nexus', icon: Icons.Orbit, desc: 'Nexus Graph', count: 'Interdependência' },
      { label: 'Atlas Católico', to: '/atlas', icon: Icons.Globe, desc: 'Geografia Sagrada', badge: 'Novo' },
      { label: 'Mission Control', to: '/admin/acervo/audit', icon: Icons.Shield, desc: 'Saúde do Acervo', badge: 'Admin' },
    ]
  }
];

import { GraduationCap } from 'lucide-react';
