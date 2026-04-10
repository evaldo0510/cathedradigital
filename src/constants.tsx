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
  WifiOff,
  Cloud,
  CloudRain,
  CloudSun,
  Crown,
  Dna,
  Fingerprint,
  Gift,
  Glasses,
  GraduationCap,
  Hammer,
  Key,
  Languages,
  Leaf,
  Lightbulb,
  Link,
  MapPin,
  Mic,
  MicOff,
  MousePointer2,
  Navigation,
  Paperclip,
  Phone,
  Play,
  PlayCircle,
  Printer,
  Radio,
  Save,
  Scissors,
  Settings2,
  ShoppingBag,
  ShoppingCart,
  Smile,
  Speaker,
  Table,
  Tag,
  Target,
  Terminal,
  ThumbsDown,
  ThumbsUp,
  Timer,
  ToggleLeft,
  ToggleRight,
  Trash,
  Truck,
  Umbrella,
  Unlock,
  Upload,
  UserPlus,
  UserX,
  Video,
  Volume,
  Volume1,
  VolumeX,
  Wallet,
  Watch,
  Waves,
  ZapOff,
  Wine
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
    dark: '#1A1A1A'
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
        {/* Main Vertical Staff - Foundation of Faith */}
        <path 
          d="M50 15V85" 
          stroke={currentColor} 
          strokeWidth="3" 
          strokeLinecap="round" 
          className="transition-all duration-700"
        />
        
        {/* Mandorla - The Sanctuary of the Soul */}
        <path 
          d="M50 32C35 32 30 41 30 50C30 59 35 68 50 68" 
          stroke={currentColor} 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="transition-all duration-700"
        />
        <path 
          d="M50 32C65 32 70 41 70 50C70 59 65 68 50 68" 
          stroke={currentColor} 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="transition-all duration-700"
        />
        
        {/* Top Jewel - The Divine Wisdom */}
        <path 
          d="M50 5L57 15L50 24L43 15L50 5Z" 
          fill={currentColor}
          className="transition-all duration-700"
        />
        
        {/* Horizontal Balance - Harmony of Spirit */}
        <path 
          d="M44 44H56" 
          stroke={currentColor} 
          strokeWidth="2" 
          strokeLinecap="round" 
          className="transition-all duration-700"
        />
        <path 
          d="M44 56H56" 
          stroke={currentColor} 
          strokeWidth="2" 
          strokeLinecap="round" 
          className="transition-all duration-700"
        />
        
        {/* Base Support - Firm in Tradition */}
        <path 
          d="M38 85H62" 
          stroke={currentColor} 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          className="transition-all duration-700"
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
  strokeWidth?: number;
}

const createIcon = (IconComponent: any) => 
  forwardRef<SVGSVGElement, IconProps>(({ className, strokeWidth = 1.8, size = 20, ...props }, ref) => (
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
  Home: createIcon(Layout),
  Dashboard: createIcon(LayoutGrid),
  Menu: createIcon(Menu),
  Search: createIcon(Search),
  Settings: createIcon(Settings),
  User: createIcon(User),
  UserCog: createIcon(UserCog),
  LogOut: createIcon(LogOut),
  Notifications: createIcon(Bell),
  Calendar: createIcon(Calendar),
  Clock: createIcon(Clock),
  Help: createIcon(HelpCircle),
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
  
  // Library & Study
  Bible: createIcon(BookOpen),
  HolyBible: createIcon(BookOpen),
  Book: createIcon(BookOpen),
  BookOpen: createIcon(BookOpen),
  Library: createIcon(Library),
  Catechism: createIcon(FileText),
  CatechismShield: createIcon(ShieldCheck),
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
  
  // Spiritual Life
  Liturgy: createIcon(Cross),
  DailyLiturgy: createIcon(Sun),
  Sun: createIcon(Sun),
  Moon: createIcon(Moon),
  Cross: createIcon(Cross),
  Chalice: createIcon(Wine),
  Flame: createIcon(Flame),
  Sparkle: createIcon(Sparkle),
  Sparkles: createIcon(Sparkles),
  PrayingHands: createIcon(Hand),
  Rosary: createIcon(Activity),
  ViaCrucis: createIcon(Cross),
  Church: createIcon(Church),
  Dove: createIcon(Sparkles),
  
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
  
  // Media & Controls
  Audio: createIcon(Volume2),
  Volume2: createIcon(Volume2),
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
  LayoutGrid: createIcon(LayoutGrid),
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
};
