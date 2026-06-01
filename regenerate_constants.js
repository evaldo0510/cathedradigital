import fs from 'fs';

const icons = [
  'Activity', 'AlertCircle', 'AlertTriangle', 'AlignLeft', 'Anchor', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 
  'ArrowUp', 'ArrowUpDown', 'ArrowUpRight', 'Award', 'Bell', 'Bird', 'Book', 'BookMarked', 'BookOpen', 
  'BookText', 'Bookmark', 'Brain', 'Building2', 'Calendar', 'Check', 'CheckCircle', 'CheckCircle2', 
  'ChevronDown', 'ChevronLeft', 'ChevronRight', 'ChevronUp', 'Church', 'Circle', 'Clock', 'Code', 'Coffee', 
  'Columns', 'Compass', 'Contrast', 'Copy', 'CornerRightUp', 'CreditCard', 'Cross', 'Crown', 'Database', 
  'Disc', 'DollarSign', 'Dot', 'Download', 'Droplets', 'Edit', 'Edit2', 'Edit3', 'ExternalLink', 'Eye', 
  'EyeOff', 'Facebook', 'Feather', 'FileCode', 'FileDown', 'FileSpreadsheet', 'FileText', 'Filter', 
  'Flame', 'FlaskConical', 'Frown', 'Globe', 'Grid', 'GripVertical', 'Hand', 'Handshake', 'Hash', 
  'Headphones', 'Heart', 'HelpCircle', 'Highlighter', 'History', 'Home', 'Image', 'Info', 'Instagram', 
  'Key', 'Languages', 'Layers', 'Layout', 'LayoutGrid', 'LayoutPanelLeft', 'Library', 'Lightbulb', 
  'LineChart', 'Link', 'List', 'Loader2', 'Lock', 'LogOut', 'Mail', 'Map', 'MapPin', 'Maximize2', 
  'Megaphone', 'Menu', 'MessageCircle', 'MessageSquare', 'Minimize2', 'Minus', 'MonitorSmartphone', 
  'Moon', 'MoreHorizontal', 'Mountain', 'Music', 'Orbit', 'Palette', 'PartyPopper', 'Pause', 'PenLine', 
  'PenTool', 'Pin', 'Play', 'Plus', 'Printer', 'Quote', 'RefreshCcw', 'RefreshCw', 'RotateCcw', 'Route', 
  'Save', 'ScrollText', 'Search', 'Send', 'Settings', 'Settings2', 'Share2', 'Shield', 'ShieldAlert', 
  'ShieldCheck', 'ShieldQuestion', 'Skull', 'Smartphone', 'Sparkle', 'Sparkles', 'Square', 'Star', 
  'Stethoscope', 'StopCircle', 'Store', 'Sun', 'Swords', 'Tag', 'Target', 'Timer', 'Trash2', 
  'TrendingDown', 'TrendingUp', 'Trophy', 'Twitter', 'Type', 'Upload', 'User', 'UserCheck', 'UserCog', 
  'UserMinus', 'UserPlus', 'Users', 'Video', 'Volume', 'Volume1', 'Volume2', 'VolumeX', 'Wallet', 
  'Wheat', 'Wifi', 'WifiOff', 'Wind', 'Wine', 'X', 'XCircle', 'Youtube', 'Zap', 'ZapOff'
];

const content = `import React, { forwardRef } from 'react';
import { 
  ${icons.join(',\n  ')}
} from 'lucide-react';

import { cn } from './lib/utils';
import { AppRoute } from './types';

export const COLORS = {
  primary: '#0F172A',
  secondary: '#D4AF37',
  background: '#F8F5EE',
  text: '#0F172A',
  accent: '#D4AF37',
};

export const NAV_ITEMS = (t: (key: string) => string, lang: string) => [
  { label: lang === 'pt' ? 'Início' : 'Home', icon: 'Home', route: '/' },
  { label: lang === 'pt' ? 'Bíblia' : 'Bible', icon: 'Bible', route: AppRoute.BIBLE },
  { label: lang === 'pt' ? 'Catecismo' : 'Catechism', icon: 'Catechism', route: AppRoute.CATECHISM },
  { label: 'Logos', icon: 'Sparkles', route: '/logos' },
  { label: t('menu') || 'Menu', icon: 'Menu', isMenu: true },
];

import cathedraLogo from './assets/cathedra-logo.png';

export const Logo = forwardRef<HTMLDivElement, { className?: string, variant?: 'gold' | 'light' | 'dark' | 'blue' }>(({ 
  className = "w-spacing-2xl h-spacing-2xl", 
  variant = 'gold' 
}, ref) => {
  return (
    <div ref={ref} className={cn(
      "relative flex items-center justify-center group overflow-hidden", 
      variant === 'blue' && "bg-primary rounded-premium-full p-spacing-xs border border-primary/10 dark:bg-primary/20",
      className
    )}>
      <img 
        src={cathedraLogo} 
        alt="Cathedra" 
        className={cn(
          "w-full h-full object-contain transition-all duration-1000 group-hover:scale-105",
          variant === 'light' && "brightness-0 invert opacity-80",
          variant === 'dark' && "brightness-0 opacity-80",
          variant === 'blue' && "brightness-0 invert"
        )}
      />
      {variant === 'gold' && (
        <div className="absolute inset-0 bg-secondary/5 rounded-premium-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
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
  forwardRef<SVGSVGElement, IconProps>(({ className, strokeWidth, size, 'aria-hidden': ariaHidden, 'aria-label': ariaLabel, ...props }, ref) => (
    <IconComponent 
      ref={ref} 
      strokeWidth={strokeWidth || 1.2} 
      size={size || 20}
      className={cn("transition-all duration-1000 shrink-0", className)}
      aria-hidden={ariaHidden ?? (ariaLabel ? undefined : "true")}
      aria-label={ariaLabel}
      role={ariaLabel ? "img" : undefined}
      {...props} 
    />
  ));

const IconsInternal = {
  Logo: Logo,
  ${icons.map(name => `${name}: createIcon(${name})`).join(',\n  ')}
};

export const Icons = {
  ...IconsInternal,
  
  // Semantic Aliases & Compatibility
  Dashboard: IconsInternal.LayoutGrid,
  Creator: IconsInternal.Crown,
  Notifications: IconsInternal.Bell,
  Help: IconsInternal.HelpCircle,
  Bible: IconsInternal.BookOpen,
  HolyBible: IconsInternal.BookOpen,
  Catechism: IconsInternal.Book,
  CatechismShield: IconsInternal.ShieldCheck,
  Magisterium: IconsInternal.ScrollText,
  MagisteriumGlobe: IconsInternal.Globe,
  Saints: IconsInternal.Flame,
  SaintHalo: IconsInternal.Flame,
  Aquinas: IconsInternal.Feather,
  Scroll: IconsInternal.ScrollText,
  Glossary: IconsInternal.BookMarked,
  AZ: IconsInternal.Languages,
  Themes: IconsInternal.Layers,
  Liturgy: IconsInternal.Wine,
  DailyLiturgy: IconsInternal.Sun,
  Chalice: IconsInternal.Wine,
  Lectio: IconsInternal.Flame,
  PrayingHands: IconsInternal.Hand,
  Rosary: IconsInternal.Orbit,
  ViaCrucis: IconsInternal.Cross,
  Church: IconsInternal.Home,
  LiturgicalCalendar: IconsInternal.Calendar,
  Oracao: IconsInternal.Hand,
  Journeys: IconsInternal.Route,
  JourneysMap: IconsInternal.Map,
  Flag: IconsInternal.Award,
  Certamen: IconsInternal.Trophy,
  Community: IconsInternal.Users,
  Message: IconsInternal.MessageCircle,
  Share: IconsInternal.Share2,
  Audio: IconsInternal.Volume2,
  Maximize: IconsInternal.Maximize2,
  Minimize: IconsInternal.Minimize2,
  Trash: IconsInternal.Trash2,
  CheckCircle: IconsInternal.CheckCircle2,
  Loader: IconsInternal.Loader2,
  Whatsapp: IconsInternal.MessageCircle,
  Google: IconsInternal.Globe,
  Apple: IconsInternal.Smartphone,
  PanelLeft: IconsInternal.Layout, 
  ImageIcon: IconsInternal.Image,
  Stop: IconsInternal.StopCircle,
  StopCircle: IconsInternal.StopCircle,
};

if (import.meta.env.DEV) {
  const iconKeys = Object.keys(Icons);
  const duplicates = iconKeys.filter((key, index) => iconKeys.indexOf(key) !== index);
  if (duplicates.length > 0) {
    console.warn('Duplicate icon keys found in constants:', duplicates);
  }
}
`;

fs.writeFileSync('src/constants.tsx', content);
console.log('Regenerated src/constants.tsx');
