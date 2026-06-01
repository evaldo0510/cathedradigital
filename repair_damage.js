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

filesToFix.forEach(filePath => {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix mistakes from previous script
  
  // 1. Fix interface Icons.Name -> interface Name
  content = content.replace(/interface\s+Icons\.([a-zA-Z0-9]+)/g, 'interface $1');
  
  // 2. Fix type usage: : Icons.Tag -> : Tag (usually if Tag was a type)
  // This is risky, but let's look for common ones like Tag, Profile, etc.
  content = content.replace(/:\s+Icons\.Tag/g, ': Tag');
  content = content.replace(/:\s+Icons\.Profile/g, ': Profile');

  // 3. Fix import { Icons.Link } from 'react-router-dom' -> import { Link }
  content = content.replace(/import\s+\{\s*Icons\.([a-zA-Z0-9]+)\s*\}\s*from/g, 'import { $1 } from');
  content = content.replace(/import\s+\{([^}]*)Icons\.([a-zA-Z0-9]+)([^}]*)\}\s*from/g, 'import {$1$2$3} from');

  // 4. Fix doubled Icons.Icons.Name
  content = content.replace(/Icons\.Icons\.([a-zA-Z0-9]+)/g, 'Icons.$1');

  // 5. Fix JSX closing tags </Icons.Link> (if they were broken)
  // The previous error showed Expected corresponding JSX closing tag for 'Icons.Link'
  // This happens if I replaced <Link> but not </Link> correctly or vice versa.
  // Actually, my regex <|{ should have caught it.
  
  // 6. Fix specific pages identified in errors
  // SecurityAuditPage: import {Link} from 'react-router-dom';
  // NexusBubbles: interface Tag
  
  fs.writeFileSync(filePath, content);
  console.log(`Damage repaired in ${filePath}`);
});
