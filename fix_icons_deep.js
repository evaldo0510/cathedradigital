import fs from 'fs';
import path from 'path';

const filesToFix = [
  'src/components/landing/FeedbackWidget.tsx',
  'src/components/cathedra/AchievementsPage.tsx',
  'src/components/cathedra/Bible.tsx',
  'src/components/cathedra/AZFaithPage.tsx',
  'src/components/cathedra/A11yAuditPage.tsx',
  'src/components/cathedra/lectio/constants.ts',
  'src/components/cathedra/BackToThemeBanner.tsx',
  'src/components/cathedra/AdminDashboard.tsx',
  'src/components/cathedra/lectio/LectioStep.tsx',
  'src/components/cathedra/AdminCrmUserProfile.tsx',
  'src/components/cathedra/AdminCrmSegmentation.tsx',
  'src/components/cathedra/AdminCrmRetention.tsx',
  'src/components/cathedra/AdminPartnersTab.tsx',
  'src/components/cathedra/AdminTransactionsTab.tsx',
  'src/components/cathedra/AdminSeoTab.tsx',
  'src/components/cathedra/AZFaithQuiz.tsx',
  'src/components/cathedra/Auth.tsx',
  'src/components/cathedra/AudioContentPlayer.tsx',
  'src/components/cathedra/AdminContentTab.tsx',
  'src/components/cathedra/DeepContentSection.tsx',
  'src/components/cathedra/lectio/LectioIntro.tsx',
  'src/pages/SecurityDashboard.tsx',
  'src/pages/SEOVerificationPage.tsx',
  'src/components/cathedra/BubbleTag.tsx',
  'src/components/cathedra/lectio/LectioConclusio.tsx',
  'src/components/cathedra/BibliotecaPage.tsx',
  'src/components/cathedra/CheckoutResultPage.tsx',
  'src/components/cathedra/Certamen.tsx',
  'src/components/cathedra/Catechism.tsx',
  'src/components/cathedra/ComingSoon.tsx',
  'src/components/cathedra/AdminJourneysTab.tsx',
  'src/components/cathedra/PricingPage.tsx',
  'src/components/cathedra/PrayerPage.tsx',
  'src/components/cathedra/PopesPage.tsx',
  'src/components/cathedra/AdminConstructionTab.tsx',
  'src/components/cathedra/PWAInstallPrompt.tsx',
  'src/components/cathedra/OnboardingPage.tsx',
  'src/components/cathedra/NexusBubbles.tsx',
  'src/components/cathedra/encyclopedia/EncyclopediaTermList.tsx',
  'src/components/cathedra/MissalPage.tsx',
  'src/components/cathedra/encyclopedia/EncyclopediaTermDetail.tsx',
  'src/components/cathedra/JornadaDetailPage.tsx',
  'src/components/cathedra/ShareButton.tsx',
  'src/components/cathedra/JornadaCompletePage.tsx',
  'src/components/cathedra/FuzzySearchInput.tsx',
  'src/components/cathedra/DocumentViewer.tsx',
  'src/components/cathedra/LitaniesPage.tsx',
  'src/components/cathedra/SellerDashboard.tsx',
  'src/components/cathedra/ItinerariumStepPage.tsx',
  'src/components/cathedra/SecurityAuditPage.tsx',
  'src/components/cathedra/DiagnosticoPage.tsx',
  'src/components/cathedra/SearchResultCard.tsx',
  'src/components/cathedra/LogosChat.tsx',
  'src/components/cathedra/ItinerariumDetailPage.tsx',
  'src/components/cathedra/SearchResultCard.test.tsx',
  'src/components/cathedra/Saints.tsx',
  'src/components/cathedra/ReadingControlPanel.tsx',
  'src/components/cathedra/ReadingProgressSection.tsx',
  'src/components/cathedra/SaintOfTheDayCard.tsx',
  'src/components/cathedra/ReadingProgress.tsx',
  'src/components/cathedra/SaintDetail.tsx',
  'src/components/cathedra/ReadingPreferencesPanel.tsx',
  'src/components/cathedra/ProShowcase.tsx',
  'src/components/cathedra/RitualDoDia.tsx',
  'src/components/cathedra/JornadaStepPage.tsx',
  'src/components/cathedra/ProConversionBanner.tsx',
  'src/components/cathedra/RelevanceBadge.tsx',
  'src/components/cathedra/PrivacyPage.tsx',
  'src/components/cathedra/Rosary.tsx',
  'src/components/cathedra/ReadingJournal.tsx',
  'src/components/cathedra/TermsPage.tsx',
  'src/components/cathedra/SpiritualGoals.tsx',
  'src/components/cathedra/TemasPage.tsx',
  'src/components/cathedra/SpiritualQuiz.tsx',
  'src/components/cathedra/TemaDetailPage.tsx',
  'src/components/cathedra/GuidedJourney.tsx',
  'src/components/cathedra/ViaCrucis.tsx',
  'src/components/cathedra/GlossaryPage.tsx',
  'src/components/cathedra/SpacingDebugger.tsx',
  'src/components/cathedra/UpgradePage.tsx',
  'src/components/cathedra/TransparencyPage.tsx',
  'src/components/cathedra/TransactionsPage.tsx',
  'src/components/cathedra/VisualSilenceControls.tsx',
  'src/components/cathedra/VisualAuditPage.tsx',
  'src/components/cathedra/TextSelectionToolbar.tsx',
  'src/components/cathedra/WebhookSimulator.tsx',
  'src/components/cathedra/WhatsAppButton.tsx',
  'src/components/cathedra/StudyMode.tsx',
  'src/components/cathedra/HomeMainContent.tsx',
  'src/components/cathedra/VisualRegressionDashboard.tsx'
];

// All possible icon names (simplified list for detection)
const allIcons = [
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
  'Timer', 'Image', 'Code', 'MapPin', 'LineChart', 'ImageIcon'
];

filesToFix.forEach(filePath => {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Remove direct lucide-react imports if any remain
  const lucideImportRegex = /import\s+\{\s*([^}]+)\s*\}\s*from\s*['"]lucide-react['"];?/g;
  content = content.replace(lucideImportRegex, '');

  // 2. Ensure Icons is imported
  if (!content.includes("from '@/constants'") && !content.includes("from '../../constants'") && !content.includes("from '../constants'")) {
    content = "import { Icons } from '@/constants';\n" + content;
  }

  // 3. Replace icon usage
  allIcons.forEach(iconName => {
    // Replace JSX components: <IconName ... /> -> <Icons.IconName ... />
    const componentRegex = new RegExp(`(<|{)\\s*${iconName}\\s*(\\s|/|>|})`, 'g');
    content = content.replace(componentRegex, `$1Icons.${iconName}$2`);
    
    // Replace prop assignment: icon={IconName} -> icon={Icons.IconName}
    const propRegex = new RegExp(`icon\\s*=\\s*{\\s*${iconName}\\s*}`, 'g');
    content = content.replace(propRegex, `icon={Icons.${iconName}}`);

    // Replace standalone usage (e.g. icon: IconName)
    // Avoid replacing if it's already Icons.IconName or part of another word
    const standaloneRegex = new RegExp(`(?<=[\\s,:(\\[])${iconName}(?=[\\s,;)\\]])`, 'g');
    content = content.replace(standaloneRegex, `Icons.${iconName}`);
  });

  fs.writeFileSync(filePath, content);
  console.log(`Deep fixed ${filePath}`);
});
