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
  Square,
  Brain,
  Sparkles,
  User,
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
  WifiOff
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
    gold: '#C8A96A',
    light: '#FFFFFF',
    dark: '#0B1F3A'
  };

  const currentColor = colors[variant];

  return (
    <div ref={ref} className={cn("relative flex items-center justify-center group", className)}>
      <svg 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full transition-all duration-700 group-hover:scale-105"
      >
        <path 
          d="M50 20V80" 
          stroke={currentColor} 
          strokeWidth="3.5" 
          strokeLinecap="round" 
        />
        <path 
          d="M50 35C40 35 32 42 32 50C32 58 40 65 50 65" 
          stroke={currentColor} 
          strokeWidth="3.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        <path 
          d="M50 35C60 35 68 42 68 50C68 58 60 65 50 65" 
          stroke={currentColor} 
          strokeWidth="3.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        <path 
          d="M50 10L56 20L50 26L44 20L50 10Z" 
          fill={currentColor}
        />
        <path 
          d="M42 42H58" 
          stroke={currentColor} 
          strokeWidth="2" 
          strokeLinecap="round" 
        />
        <path 
          d="M42 58H58" 
          stroke={currentColor} 
          strokeWidth="2" 
          strokeLinecap="round" 
        />
        <path 
          d="M40 80H60" 
          stroke={currentColor} 
          strokeWidth="2.5" 
          strokeLinecap="round" 
        />
      </svg>
      {variant === 'gold' && (
        <div className="absolute inset-0 bg-secondary/5 blur-xl rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </div>
  );
});

Logo.displayName = 'Logo';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

const createIcon = (IconComponent: any) => 
  forwardRef<SVGSVGElement, IconProps>(({ className, strokeWidth = 1.5, size = 20, ...props }, ref) => (
    <IconComponent 
      ref={ref} 
      strokeWidth={strokeWidth} 
      size={size}
      className={cn("transition-colors duration-200 shrink-0", className)}
      {...props} 
    />
  ));

export const Icons = {
  Home: createIcon(Layout),
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
  Book: createIcon(BookOpen),
  Message: createIcon(MessageCircle),
  Handshake: createIcon(Users),
  Whatsapp: createIcon(MessageCircle),
  Google: createIcon(Sparkles),
  Apple: createIcon(Sparkles),
  Share: createIcon(Share2),
  Audio: createIcon(Volume2),
  Stop: createIcon(Square),
  BookOpen: createIcon(BookOpen),
  Cross: createIcon(Cross),
  Map: createIcon(Map),
  Users: createIcon(Users),
  Flame: createIcon(Flame),
  Sparkle: createIcon(Sparkle),
  FileText: createIcon(FileText),
  Type: createIcon(Type),
  Columns: createIcon(Columns),
  Search: createIcon(Search),
  ChevronLeft: createIcon(ChevronLeft),
  ChevronRight: createIcon(ChevronRight),
  ChevronDown: createIcon(ChevronDown),
  ChevronUp: createIcon(ChevronUp),
  Star: createIcon(Star),
  MessageCircle: createIcon(MessageCircle),
  Zap: createIcon(Zap),
  Layout: createIcon(Layout),
  Globe: createIcon(Globe),
  ExternalLink: createIcon(ExternalLink),
  Pin: createIcon(Pin),
  Heart: createIcon(Heart),
  Download: createIcon(Download),
  RotateCcw: createIcon(RotateCcw),
  Instagram: createIcon(Instagram),
  Facebook: createIcon(Facebook),
  Twitter: createIcon(Twitter),
  Youtube: createIcon(Youtube),
  Menu: createIcon(Menu),
  Feather: createIcon(Feather),
  History: createIcon(History),
  Volume2: createIcon(Volume2),
  Square: createIcon(Square),
  Brain: createIcon(Brain),
  Sparkles: createIcon(Sparkles),
  User: createIcon(User),
  ArrowDown: createIcon(ArrowDown),
  ArrowLeft: createIcon(ArrowLeft),
  Music: createIcon(Music),
  Bell: createIcon(Bell),
  Sun: createIcon(Sun),
  Moon: createIcon(Moon),
  LogOut: createIcon(LogOut),
  PenLine: createIcon(PenLine),
  Calendar: createIcon(Calendar),
  Compass: createIcon(Compass),
  Loader2: createIcon(Loader2),
  Loader: createIcon(Loader2),
  Award: createIcon(Award),
  ArrowRight: createIcon(ArrowRight),
  Quote: createIcon(Quote),
  Share2: createIcon(Share2),
  Check: createIcon(Check),
  Circle: createIcon(Circle),
  Dot: createIcon(Dot),
  X: createIcon(X),
  ShieldQuestion: createIcon(ShieldQuestion),
  MessageSquare: createIcon(MessageSquare),
  Send: createIcon(Send),
  Trophy: createIcon(Trophy),
  ShieldCheck: createIcon(ShieldCheck),
  Clock: createIcon(Clock),
  CheckCircle2: createIcon(CheckCircle2),
  CheckCircle: createIcon(CheckCircle2),
  PenTool: createIcon(PenTool),
  Copy: createIcon(Copy),
  Plus: createIcon(Plus),
  Trash2: createIcon(Trash2),
  Trash: createIcon(Trash2),
  GripVertical: createIcon(GripVertical),
  Lock: createIcon(Lock),
  HelpCircle: createIcon(HelpCircle),
  PartyPopper: createIcon(PartyPopper),
  MoreHorizontal: createIcon(MoreHorizontal),
  Coffee: createIcon(Coffee),
  Church: createIcon(Church),
  Bookmark: createIcon(Bookmark),
  Smartphone: createIcon(Smartphone),
  MonitorSmartphone: createIcon(MonitorSmartphone),
  Activity: createIcon(Activity),
  UserCog: createIcon(UserCog),
  LayoutGrid: createIcon(LayoutGrid),
  UserCheck: createIcon(UserCheck),
  Stethoscope: createIcon(Stethoscope),
  Route: createIcon(Route),
  Library: createIcon(Library),
  Hand: createIcon(Hand),
  ScrollText: createIcon(ScrollText),
  Swords: createIcon(Swords),
  Mail: createIcon(Mail),
  Settings: createIcon(Settings),
  Info: createIcon(Info),
  Maximize: createIcon(Maximize2),
  Minimize: createIcon(Minimize2),
  List: createIcon(List),
  Grid: createIcon(Grid),
  Filter: createIcon(Filter),
  Eye: createIcon(Eye),
  EyeOff: createIcon(EyeOff),
  AlertTriangle: createIcon(AlertTriangle),
  XCircle: createIcon(XCircle),
  CreditCard: createIcon(CreditCard),
  WifiOff: createIcon(WifiOff),
};
