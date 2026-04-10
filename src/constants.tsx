import React, { forwardRef } from 'react';
import { 
  BookOpen, 
  Cross, 
  Map, 
  Users, 
  Flame, 
  Sparkle, 
  FileText, 
  Type, 
  Columns,
  Search,
  ChevronLeft,
  ChevronRight,
  Star,
  MessageCircle,
  Zap,
  Layout,
  Globe,
  ExternalLink,
  Pin,
  Heart,
  Download,
  RotateCcw,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Menu,
  Feather,
  History,
  Volume2,
  Square,
  Brain,
  Sparkles,
  User,
  ArrowDown,
  ArrowLeft,
  Music,
  Bell
} from 'lucide-react';

export const COLORS = {
  primary: '#0A192F', // Azul escuro profundo
  secondary: '#D4AF37', // Dourado suave
  background: '#F8FAFC', // Neutro claro
  accent: '#C5A02D',
};

export const Logo = forwardRef<HTMLDivElement, { className?: string }>(({ className = "w-12 h-12" }, ref) => (
  <div ref={ref} className={`relative flex items-center justify-center group ${className}`}>
    <img 
      src="/src/assets/cathedra-logo.webp" 
      alt="Cathedra" 
      className="relative w-full h-full object-contain transition-all duration-700 group-hover:scale-110 drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]"
    />
  </div>
));

Logo.displayName = 'Logo';

const createIcon = (IconComponent: any) => 
  forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>((props, ref) => (
    <IconComponent 
      ref={ref} 
      strokeWidth={1.5} 
      className={`transition-colors duration-200 ${props.className || ''}`}
      {...props} 
    />
  ));

export const Icons = {
  Bible: createIcon(BookOpen),
  HolyBible: createIcon(BookOpen),
  Liturgy: createIcon(Cross),
  Chalice: createIcon(Sparkle),
  Journeys: createIcon(Map),
  Community: createIcon(Users),
  Lectio: createIcon(Flame),
  Saints: createIcon(Sparkles),
  SaintHalo: createIcon(Sparkles),
  Catechism: createIcon(FileText),
  CatechismShield: createIcon(FileText),
  Glossary: createIcon(Type),
  Aquinas: createIcon(Columns),
  Dove: createIcon(Sparkles),
  LiturgicalCalendar: createIcon(Map),
  PrayingHands: createIcon(Sparkles),
  Rosary: createIcon(Sparkles),
  ViaCrucis: createIcon(Cross),
  Scroll: createIcon(FileText),
  Cathedral: createIcon(Columns),
  Home: createIcon(Layout),
  Book: createIcon(BookOpen),
  Search: createIcon(Search),
  Cross: createIcon(Cross),
  Feather: createIcon(Feather),
  History: createIcon(History),
  Menu: createIcon(Menu),
  Users: createIcon(Users),
  Audio: createIcon(Volume2),
  Stop: createIcon(Square),
  Layout: createIcon(Layout),
  Globe: createIcon(Globe),
  ExternalLink: createIcon(ExternalLink),
  Pin: createIcon(Pin),
  Star: createIcon(Star),
  Heart: createIcon(Heart),
  Message: createIcon(MessageCircle),
  ArrowDown: createIcon(ArrowDown),
  ArrowLeft: createIcon(ArrowLeft),
  ChevronLeft: createIcon(ChevronLeft),
  ChevronRight: createIcon(ChevronRight),
  Handshake: createIcon(Users),
  Download: createIcon(Download),
  BookOpen: createIcon(BookOpen),
  RotateCcw: createIcon(RotateCcw),
  Zap: createIcon(Zap),
  Instagram: createIcon(Instagram),
  Facebook: createIcon(Facebook),
  Twitter: createIcon(Twitter),
  Whatsapp: createIcon(MessageCircle),
  Youtube: createIcon(Youtube),
  Google: createIcon(Sparkles),
  Apple: createIcon(Sparkles),
  Brain: createIcon(Brain),
  Sparkles: createIcon(Sparkles),
  User: createIcon(User),
  Music: createIcon(Music),
  Bell: createIcon(Bell),
};
