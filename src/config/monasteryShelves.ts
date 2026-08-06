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
    id: 'church',
    title: '🏛 Igreja',
    icon: Church,
    items: [
      { label: 'Catecismo', to: '/catechism', icon: Icons.BookOpen, desc: '2865 Artigos', count: 'Doutrina' },
      { label: 'Magistério', to: '/magisterium', icon: Icons.ScrollText, desc: 'Documentos', count: 'Tradição' },
      { label: 'Concílios', to: '/magisterium?q=concilio', icon: Icons.Users, desc: 'Assembleias', badge: 'História' },
      { label: 'Dogmas', to: '/dogmas', icon: Shield, desc: 'Verdades de Fé', count: 'Certificado' },
    ]
  },
  {
    id: 'saints',
    title: '👤 Santos',
    icon: Users,
    items: [
      { label: 'Santos', to: '/saints', icon: Icons.User, desc: 'Hagiografia', count: 'Vidas' },
      { label: 'Doutores', to: '/saints?filter=doutor', icon: GraduationCap, desc: 'Mestres', badge: 'Sapiência' },
      { label: 'Padres', to: '/biblioteca?filter=patristica', icon: Icons.Church, desc: 'Era Apostólica', count: 'Patrística' },
      { label: 'Mártires', to: '/saints?filter=martir', icon: Flame, desc: 'Testemunho', count: 'Sangue' },
    ]
  },
  {
    id: 'mary',
    title: '🌹 Maria',
    icon: Star,
    items: [
      { label: 'Aparições', to: '/aparicoes', icon: Star, desc: 'Visitas Celestes', count: 'Certificadas' },
      { label: 'Dogmas Marianos', to: '/dogmas?q=maria', icon: Shield, desc: 'Doutrina', badge: 'Theotokos' },
      { label: 'Títulos', to: '/glossario?q=nossa+senhora', icon: Icons.BookOpen, desc: 'Invocações', count: 'Devoção' },
      { label: 'Rosário', to: '/oracao/rosario', icon: Icons.Disc, desc: 'Contemplação', count: 'Mistérios' },
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
      { label: 'Novenas', to: '/novenas', icon: Icons.Clock, desc: 'Piedade', count: 'Intercessão' },
    ]
  },
  {
    id: 'heritage',
    title: '📜 Patrimônio',
    icon: Library,
    items: [
      { label: 'Patrística', to: '/biblioteca', icon: Icons.Church, desc: 'Escritos Iniciais', count: 'Fundação' },
      { label: 'Sto. Tomás', to: '/aquinas', icon: Icons.BookOpen, desc: 'Suma Teológica', badge: 'Doutor' },
      { label: 'Clássicos', to: '/biblioteca?filter=classicos', icon: Library, desc: 'Obras Primas', count: 'Acervo' },
      { label: 'Imitação', to: '/biblioteca/imitacao-de-cristo', icon: Icons.Heart, desc: 'Kempis', badge: 'Mística' },
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
    title: '🔍 Logos',
    icon: Search,
    items: [
      { label: 'Busca Global', to: '/biblioteca/inteligente', icon: Icons.Search, desc: 'Omniscience', badge: 'IA' },
      { label: 'Conexões', to: '/nexus', icon: Icons.Orbit, desc: 'Nexus Graph', count: 'Interdependência' },
    ]
  }
];

import { GraduationCap } from 'lucide-react';
