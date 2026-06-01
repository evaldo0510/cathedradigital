import fs from 'fs';

const icons = [
  'Home', 'Book', 'BookOpen', 'BookText', 'Cross', 'Map', 'Users', 'Flame', 'Sparkle', 'FileText', 'Database',
  'Type', 'Columns', 'Search', 'ChevronLeft', 'ChevronRight', 'ChevronDown', 'ChevronUp', 'Star',
  'MessageCircle', 'Zap', 'Layout', 'Globe', 'ExternalLink', 'Pin', 'Heart', 'Download', 'RotateCcw',
  'Instagram', 'Facebook', 'Twitter', 'Youtube', 'Menu', 'Feather', 'History', 'Volume2', 'Volume1',
  'Volume', 'Square', 'Brain', 'Sparkles', 'User', 'Crown', 'ArrowDown', 'ArrowLeft', 'Music', 'Bell',
  'Sun', 'Moon', 'LogOut', 'PenLine', 'Calendar', 'Compass', 'Loader2', 'Award', 'ArrowRight', 'Quote',
  'Share2', 'Check', 'Circle', 'Dot', 'X', 'ShieldQuestion', 'MessageSquare', 'Send', 'Trophy',
  'ShieldCheck', 'Clock', 'CheckCircle2', 'PenTool', 'Copy', 'Plus', 'Trash2', 'GripVertical', 'Lock',
  'HelpCircle', 'PartyPopper', 'MoreHorizontal', 'Coffee', 'Church', 'Bookmark', 'Smartphone',
  'MonitorSmartphone', 'Activity', 'UserCog', 'LayoutGrid', 'UserCheck', 'Stethoscope', 'Route',
  'Library', 'Hand', 'Handshake', 'ScrollText', 'Swords', 'Mail', 'Settings', 'Info', 'Maximize2',
  'Minimize2', 'List', 'Grid', 'Filter', 'Eye', 'EyeOff', 'AlertTriangle', 'XCircle', 'CreditCard',
  'WifiOff', 'Wine', 'Play', 'Target', 'Link', 'Video', 'Tag', 'Orbit', 'Disc', 'Layers', 'Languages',
  'BookMarked', 'Wifi', 'Printer', 'UserMinus', 'Edit2', 'AlertCircle', 'Anchor', 'ArrowUpDown',
  'ArrowUpRight', 'Bird', 'CheckCircle', 'Contrast', 'CornerRightUp', 'Droplets', 'FileCode', 'FileDown',
  'FlaskConical', 'Frown', 'Headphones', 'Highlighter', 'Key', 'LayoutPanelLeft', 'Lightbulb', 'Megaphone',
  'Mountain', 'Pause', 'RefreshCcw', 'RefreshCw', 'Save', 'Settings2', 'ShieldAlert', 'Skull', 'StopCircle',
  'Store', 'TrendingUp', 'Wheat', 'Wind', 'ZapOff', 'Building2', 'DollarSign', 'Upload', 'FileSpreadsheet',
  'ArrowUp', 'Minus', 'TrendingDown', 'UserPlus', 'Palette', 'Wallet', 'Edit', 'Edit3', 'AlignLeft',
  'Timer', 'Image', 'Code', 'MapPin', 'LineChart', 'Shield', 'Stop', 'Hash', 'VolumeX', 'StopCircle', 'ShieldCheck'
];

// Deduplicate
const uniqueIcons = [...new Set(icons)];

const content = `import React, { forwardRef } from 'react';
import { 
  ${uniqueIcons.join(',\n  ')}
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
  ${uniqueIcons.map(name => `${name}: createIcon(${name})`).join(',\n  ')}
};

export const Icons = {
  ...IconsInternal,
  
  // Semantic Aliases
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
