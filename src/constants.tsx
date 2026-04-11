import React, { forwardRef } from 'react';
import { 
  Home,
  Book,
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
  ChevronDown,
  ChevronUp,
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
  Volume1,
  Volume,
  Square,
  Brain,
  Sparkles,
  User,
  Crown,
  ArrowDown,
  ArrowLeft,
  Music,
  Bell,
  Sun,
  Moon,
  LogOut,
  PenLine,
  Calendar,
  Compass,
  Loader2,
  Award,
  ArrowRight,
  Quote,
  Share2,
  Check,
  Circle,
  Dot,
  X,
  ShieldQuestion,
  MessageSquare,
  Send,
  Trophy,
  ShieldCheck,
  Clock,
  CheckCircle2,
  PenTool,
  Copy,
  Plus,
  Trash2,
  GripVertical,
  Lock,
  HelpCircle,
  PartyPopper,
  MoreHorizontal,
  Coffee,
  Church,
  Bookmark,
  Smartphone,
  MonitorSmartphone,
  Activity,
  UserCog,
  LayoutGrid,
  UserCheck,
  Stethoscope,
  Route, 
  Library, 
  Hand,
  Handshake,
  ScrollText,
  Swords,
  Mail,
  Settings,
  Info,
  Maximize2,
  Minimize2,
  List,
  Grid,
  Filter,
  Eye,
  EyeOff,
  AlertTriangle,
  XCircle,
  CreditCard,
  WifiOff,
  Wine,
  Play,
  Target,
  Link,
  Video,
  Tag
} from 'lucide-react';
import { cn } from './lib/utils';

export const COLORS = {
  primary: '#0B1F3A',
  secondary: '#C8A96A',
  background: '#FFFFFF',
  text: '#1A1A1A',
  accent: '#C8A96A',
};

export const Logo = forwardRef<HTMLDivElement, { className?: string, variant?: 'gold' | 'light' | 'dark' }>(({ 
  className = "w-12 h-12", 
  variant = 'gold' 
}, ref) => {
  const colors = {
    gold: '#D4AF37', // Refined Metallic Gold
    light: '#FFFFFF',
    dark: '#1A1A1A'
  };

  const currentColor = colors[variant];
  const strokeColor = variant === 'gold' ? "url(#logoGradient)" : currentColor;
  const fillColor = variant === 'gold' ? "url(#logoGradient)" : currentColor;

  return (
    <div ref={ref} className={cn("relative flex items-center justify-center group", className)}>
      <svg 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full transition-all duration-700 group-hover:scale-105"
      >
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D4AF37" />
            <stop offset="50%" stopColor="#F9E076" />
            <stop offset="100%" stopColor="#AF8A2A" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Main Vertical Staff - Foundation of Faith */}
        <path 
          d="M50 12V88" 
          stroke={strokeColor} 
          strokeWidth="3.5" 
          strokeLinecap="round" 
          className="transition-all duration-700"
        />
        
        {/* Mandorla - The Sanctuary of the Soul */}
        <path 
          d="M50 30C32 30 28 41 28 50C28 59 32 70 50 70" 
          stroke={strokeColor} 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="transition-all duration-700"
        />
        <path 
          d="M50 30C68 30 72 41 72 50C72 59 68 70 50 70" 
          stroke={strokeColor} 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="transition-all duration-700"
        />
        
        {/* Top Jewel - The Divine Wisdom */}
        <path 
          d="M50 4L59 15L50 26L41 15L50 4Z" 
          fill={fillColor}
          filter={variant === 'gold' ? "url(#glow)" : undefined}
          className="transition-all duration-700"
        />
        
        {/* Horizontal Balance - Harmony of Spirit */}
        <path 
          d="M42 43H58" 
          stroke={strokeColor} 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          className="transition-all duration-700"
        />
        <path 
          d="M42 57H58" 
          stroke={strokeColor} 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          className="transition-all duration-700"
        />
        
        {/* Base Support - Firm in Tradition */}
        <path 
          d="M35 88H65" 
          stroke={strokeColor} 
          strokeWidth="3.5" 
          strokeLinecap="round" 
          className="transition-all duration-700"
        />
      </svg>
      {variant === 'gold' && (
        <div className="absolute inset-0 bg-secondary/10 blur-2xl rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      )}
    </div>
  );
});

Logo.displayName = 'Logo';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number;
}

const createIcon = (IconComponent: any) => 
  forwardRef<SVGSVGElement, IconProps>(({ className, strokeWidth = 2, size = 20, ...props }, ref) => (
    <IconComponent 
      ref={ref} 
      strokeWidth={strokeWidth} 
      size={size}
      className={cn("transition-all duration-200 shrink-0", className)}
      {...props} 
    />
  ));

export const Icons = {
  // Navigation & Core
  Home: createIcon(Home),
  Dashboard: createIcon(LayoutGrid),
  LayoutGrid: createIcon(LayoutGrid),
  Layout: createIcon(Layout),
  Menu: createIcon(Menu),
  Search: createIcon(Search),
  Settings: createIcon(Settings),
  User: createIcon(User),
  Creator: createIcon(Crown),
  UserCog: createIcon(UserCog),
  LogOut: createIcon(LogOut),
  Notifications: createIcon(Bell),
  Bell: createIcon(Bell),
  Calendar: createIcon(Calendar),
  Clock: createIcon(Clock),
  Help: createIcon(HelpCircle),
  HelpCircle: createIcon(HelpCircle),
  Info: createIcon(Info),
  Plus: createIcon(Plus),
  X: createIcon(X),
  Check: createIcon(Check),
  Circle: createIcon(Circle),
  Dot: createIcon(Dot),
  Award: createIcon(Award),
  Trophy: createIcon(Trophy),
  Star: createIcon(Star),
  Heart: createIcon(Heart),
  Zap: createIcon(Zap),
  Globe: createIcon(Globe),
  Handshake: createIcon(Handshake),
  ShieldCheck: createIcon(ShieldCheck),
  ShieldQuestion: createIcon(ShieldQuestion),
  PartyPopper: createIcon(PartyPopper),
  
  // Library & Study
  Bible: createIcon(Book),
  HolyBible: createIcon(Book),
  Book: createIcon(Book),
  BookOpen: createIcon(BookOpen),
  Library: createIcon(Library),
  Catechism: createIcon(FileText),
  CatechismShield: createIcon(ShieldCheck),
  FileText: createIcon(FileText),
  Magisterium: createIcon(Globe),
  Saints: createIcon(Users),
  SaintHalo: createIcon(Sparkles),
  Aquinas: createIcon(Columns),
  Columns: createIcon(Columns),
  Brain: createIcon(Brain),
  Feather: createIcon(Feather),
  PenLine: createIcon(PenLine),
  PenTool: createIcon(PenTool),
  Scroll: createIcon(ScrollText),
  ScrollText: createIcon(ScrollText),
  Quote: createIcon(Quote),
  Type: createIcon(Type),
  Glossary: createIcon(Type),
  History: createIcon(History),
  Bookmark: createIcon(Bookmark),
  Tag: createIcon(Tag),
  Swords: createIcon(Swords),
  
  // Spiritual Life
  Liturgy: createIcon(Cross),
  DailyLiturgy: createIcon(Sun),
  Sun: createIcon(Sun),
  Moon: createIcon(Moon),
  Cross: createIcon(Cross),
  Chalice: createIcon(Wine),
  Flame: createIcon(Flame),
  Lectio: createIcon(Flame),
  Sparkle: createIcon(Sparkle),
  Sparkles: createIcon(Sparkles),
  PrayingHands: createIcon(Hand),
  Hand: createIcon(Hand),
  Rosary: createIcon(Activity),
  ViaCrucis: createIcon(Cross),
  Church: createIcon(Church),
  Dove: createIcon(Sparkles),
  LiturgicalCalendar: createIcon(Map),
  
  // Pathways & Journeys
  Journeys: createIcon(Route),
  JourneysMap: createIcon(Map),
  Route: createIcon(Route),
  Map: createIcon(Map),
  Compass: createIcon(Compass),
  Target: createIcon(Target),
  Flag: createIcon(Award),
  Activity: createIcon(Activity),
  Stethoscope: createIcon(Stethoscope),
  
  // Community & Interaction
  Community: createIcon(Users),
  Users: createIcon(Users),
  UserCheck: createIcon(UserCheck),
  Message: createIcon(MessageCircle),
  MessageCircle: createIcon(MessageCircle),
  MessageSquare: createIcon(MessageSquare),
  Send: createIcon(Send),
  Share: createIcon(Share2),
  Share2: createIcon(Share2),
  ExternalLink: createIcon(ExternalLink),
  Link: createIcon(Link),
  Mail: createIcon(Mail),
  
  // Media & Controls
  Audio: createIcon(Volume2),
  Volume2: createIcon(Volume2),
  Volume1: createIcon(Volume1),
  Volume: createIcon(Volume),
  Play: createIcon(Play),
  Stop: createIcon(Square),
  Music: createIcon(Music),
  Download: createIcon(Download),
  RotateCcw: createIcon(RotateCcw),
  Maximize: createIcon(Maximize2),
  Minimize: createIcon(Minimize2),
  
  // Arrows & Direction
  ChevronLeft: createIcon(ChevronLeft),
  Video: createIcon(Video),
  ChevronRight: createIcon(ChevronRight),
  ChevronDown: createIcon(ChevronDown),
  ChevronUp: createIcon(ChevronUp),
  ArrowLeft: createIcon(ArrowLeft),
  ArrowRight: createIcon(ArrowRight),
  ArrowDown: createIcon(ArrowDown),
  ArrowUp: createIcon(ChevronUp),
  
  // Utilities
  Copy: createIcon(Copy),
  Trash: createIcon(Trash2),
  Trash2: createIcon(Trash2),
  GripVertical: createIcon(GripVertical),
  Lock: createIcon(Lock),
  Pin: createIcon(Pin),
  Filter: createIcon(Filter),
  List: createIcon(List),
  Grid: createIcon(Grid),
  Eye: createIcon(Eye),
  EyeOff: createIcon(EyeOff),
  AlertTriangle: createIcon(AlertTriangle),
  XCircle: createIcon(XCircle),
  CheckCircle: createIcon(CheckCircle2),
  CheckCircle2: createIcon(CheckCircle2),
  Loader: createIcon(Loader2),
  Loader2: createIcon(Loader2),
  CreditCard: createIcon(CreditCard),
  Smartphone: createIcon(Smartphone),
  MonitorSmartphone: createIcon(MonitorSmartphone),
  WifiOff: createIcon(WifiOff),
  
  // Social
  Instagram: createIcon(Instagram),
  Facebook: createIcon(Facebook),
  Twitter: createIcon(Twitter),
  Youtube: createIcon(Youtube),
  Whatsapp: createIcon(MessageCircle),
  Google: createIcon(Globe), 
  Apple: createIcon(Smartphone),
};
