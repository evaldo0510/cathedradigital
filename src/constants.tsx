import React, { forwardRef } from 'react';
import { 
  Home,
  Book,
  BookOpen, 
  BookText,
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
  Tag,
  Orbit,
  Disc,
  Layers,
  Languages,
  BookMarked
} from 'lucide-react';
import { cn } from './lib/utils';

export const COLORS = {
  primary: '#0B1F3A',
  secondary: '#C8A96A',
  background: '#FFFFFF',
  text: '#1A1A1A',
  accent: '#C8A96A',
};

import cathedraLogo from './assets/cathedra-logo.png';

export const Logo = forwardRef<HTMLDivElement, { className?: string, variant?: 'gold' | 'light' | 'dark' | 'blue' }>(({ 
  className = "w-12 h-12", 
  variant = 'gold' 
}, ref) => {
  return (
    <div ref={ref} className={cn(
      "relative flex items-center justify-center group overflow-hidden", 
      variant === 'blue' && "bg-primary rounded-full p-2 shadow-lg border border-primary/20",
      className
    )}>
      <img 
        src={cathedraLogo} 
        alt="Cathedra" 
        className={cn(
          "w-full h-full object-contain transition-all duration-700 group-hover:scale-105",
          variant === 'light' && "brightness-0 invert",
          variant === 'dark' && "brightness-0",
          variant === 'blue' && "brightness-0 invert"
        )}
      />
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
  forwardRef<SVGSVGElement, IconProps>(({ className, strokeWidth = 1.75, size = 20, ...props }, ref) => (
    <IconComponent 
      ref={ref} 
      strokeWidth={strokeWidth} 
      size={size}
      className={cn("transition-all duration-200 shrink-0", className)}
      {...props} 
    />
  ));

export const Icons = {
  Logo: Logo,
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
  Bible: createIcon(BookText),
  HolyBible: createIcon(BookText),
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
  Glossary: createIcon(BookMarked),
  AZ: createIcon(Languages),
  History: createIcon(History),
  Bookmark: createIcon(Bookmark),
  Tag: createIcon(Tag),
  Themes: createIcon(Orbit),
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
  Rosary: createIcon(Orbit),
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
  Certamen: createIcon(Trophy),
  
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
