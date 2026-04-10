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
  Square
} from 'lucide-react';

export const COLORS = {
  primary: '#0A192F', // Azul escuro profundo
  secondary: '#D4AF37', // Dourado suave
  background: '#F8FAFC', // Neutro claro
  accent: '#C5A02D',
};

export const Logo = forwardRef<HTMLDivElement, { className?: string }>(({ className = "w-12 h-12" }, ref) => (
  <div ref={ref} className={`relative flex items-center justify-center group ${className}`}>
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className="relative w-full h-full transition-all duration-700 group-hover:scale-110 drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]"
    >
      <path 
        d="M35 85C35 85 35 15 55 15C75 15 75 35 75 35M35 50H65M35 85H75" 
        stroke="currentColor" 
        strokeWidth="4" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="text-secondary"
      />
      <path 
        d="M30 90V10C30 10 30 5 35 5H75C80 5 80 10 80 10V90" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        className="opacity-20"
      />
      <circle cx="55" cy="15" r="4" fill="currentColor" className="text-secondary opacity-80" />
    </svg>
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
  Saints: createIcon(Sparkle),
  SaintHalo: createIcon(Sparkle),
  Catechism: createIcon(FileText),
  CatechismShield: createIcon(FileText),
  Glossary: createIcon(Type),
  Aquinas: createIcon(Columns),
  Dove: createIcon(Sparkle),
  LiturgicalCalendar: createIcon(Map),
  PrayingHands: createIcon(Sparkle),
  Rosary: createIcon(Sparkle),
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
  ArrowDown: createIcon(Search),
  ArrowLeft: createIcon(ChevronLeft),
  ChevronLeft: createIcon(ChevronLeft),
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
  Google: createIcon(Sparkle),
  Apple: createIcon(Sparkle),
};
