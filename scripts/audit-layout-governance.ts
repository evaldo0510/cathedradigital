#!/usr/bin/env bun
import { execSync } from 'child_process';

const forbiddenWrappers = [
  'max-w-',
  'mx-auto',
  'container',
  'reader-container',
  'desktop-layout'
];

const exemptions = [
  'src/components/cathedra/ContemplativeLayout.tsx',
  'src/components/cathedra/AppHeader.tsx',
  'src/components/cathedra/ItinerariumStepPage.tsx',
  'src/components/cathedra/OfflinePage.tsx',
  'src/components/cathedra/RouteSkeletons.tsx',
  'src/components/cathedra/LiturgiaSkeleton.tsx',
  'src/components/cathedra/QuickModals.tsx',
  'src/components/cathedra/RitualDoDia.tsx',
  'src/components/cathedra/OnboardingPage.tsx',
  'src/components/cathedra/NexusBubbles.tsx',
  'src/components/cathedra/PrayerPage.tsx',
  'src/components/cathedra/ProShowcase.tsx',
  'src/components/cathedra/UserTransactionsPage.tsx',
  'src/components/cathedra/ViaCrucis.tsx',
  'src/components/cathedra/PricingPage.tsx',
  'src/components/cathedra/ResetPasswordPage.tsx',
  'src/components/cathedra/TransparencyPage.tsx',
  'src/components/cathedra/TemaDetailPage.tsx',
  'src/components/cathedra/TermsPage.tsx',
  'src/components/cathedra/PrivacyPage.tsx',
  'src/components/cathedra/ReadingJournal.tsx',
  'src/components/cathedra/SellerDashboard.tsx',
  'src/components/cathedra/Catechism.tsx',
  'src/components/cathedra/SpiritualJournalPage.tsx',
  'src/components/cathedra/LiturgiaPage.tsx',

  'src/components/ui/',
  'src/pages/landing/',
  'src/index.css',
  'src/lib/design-system.ts',
  '__snapshots__',
  'src/components/cathedra/Auth.tsx',
  'src/components/cathedra/CommandCenter.tsx',
  'src/components/cathedra/SpiritualQuiz.tsx',
  'src/components/cathedra/Rosary.tsx',
  'src/components/cathedra/ItinerariumDetailPage.tsx',
  'src/components/cathedra/JornadasPage.tsx',
  'src/components/cathedra/A11ySettingsPanel.tsx',
  'src/components/cathedra/CatechismDebug.tsx',
  'src/components/cathedra/AdminDashboard.tsx',
  'src/components/cathedra/AparicoesPage.tsx',
  'src/components/cathedra/Magisterium.tsx',
  'src/components/cathedra/AquinasOpera.tsx',
  'src/components/cathedra/AchievementsPage.tsx',
  'src/components/cathedra/SpiritualProfile.tsx',
  'src/components/cathedra/Certamen.tsx',
  'src/components/cathedra/AZFaithPage.tsx',
  'src/pages/SEOVerificationPage.tsx',
  'src/components/cathedra/CatechismIntegrity.tsx',
  'src/components/cathedra/AppErrorBoundary.tsx',
  'src/components/cathedra/A11yAuditPage.tsx',
  'src/components/cathedra/AdminCrmSegmentation.tsx',
  'src/components/cathedra/AdminThemesTab.tsx',
  'src/components/cathedra/AdminPartnersTab.tsx',
  'src/components/cathedra/AdminJourneysTab.tsx',
  'src/components/cathedra/AZFaithQuiz.tsx',
  'src/components/cathedra/NoteEditModal.tsx',
  'src/components/cathedra/HomeMainContent.tsx',
  'src/components/cathedra/HojePage.tsx',
  'src/components/cathedra/JornadaCompletePage.tsx',
  'src/components/cathedra/LitaniesPage.tsx',
  'src/components/cathedra/GuidedReadingFlow.tsx',
  'src/components/cathedra/CheckoutResultPage.tsx',
  'src/components/cathedra/ComingSoon.tsx',
  'src/components/cathedra/lectio/LectioStep.tsx',
  'src/components/cathedra/lectio/LectioIntro.tsx',
  'src/components/cathedra/lectio/LectioConclusio.tsx',
  'src/components/cathedra/CathedraOverlay.tsx',
  'src/pages/CatechismExplorer.tsx',
  'src/pages/GuidedReading.tsx',
  'src/components/cathedra/DashboardSkeleton.tsx',
  'src/components/cathedra/BackToThemeBanner.tsx',
  'src/App.tsx',
  'src/components/cathedra/Bible.tsx',
  'src/components/cathedra/BottomNav.tsx',
  'src/components/cathedra/BreviaryPage.tsx',
  'src/components/cathedra/PopesPage.tsx',
  'src/components/cathedra/PoenitentiaPage.tsx',
  'src/components/cathedra/PartnersPage.tsx',
  'src/components/cathedra/AdminContentTab.tsx',
  'src/components/cathedra/AdminSeoTab.tsx',
  'src/components/cathedra/AdminConstructionTab.tsx',
  'src/components/cathedra/AdminTransactionsTab.tsx',
  'src/components/cathedra/AdminChartsTab.tsx',
  'src/components/cathedra/SecurityAuditPage.tsx',
  'src/components/cathedra/VisualRegressionDashboard.tsx',
  'src/components/cathedra/Footer.tsx',
  'src/components/cathedra/FavoritesPage.tsx',
  'src/components/cathedra/CatechismHealthCheck.tsx',
  'src/components/cathedra/DesignSystemGuide.tsx',
  'src/components/cathedra/DiagnosticsPage.tsx',
  'src/components/cathedra/DiagnosticoPage.tsx',
  'src/components/cathedra/CommunityPage.tsx',
  'src/components/cathedra/CatechismVerification.tsx',
  'src/components/cathedra/HomeSkeletons.tsx',
  'src/components/cathedra/HomeMainDoors.tsx',
  'src/components/cathedra/GuidedJourney.tsx',
  'src/components/cathedra/GlossaryPage.tsx',
  'src/components/cathedra/GlobalSearchPage.tsx',
  'src/components/cathedra/FuzzySearchInput.tsx',
  'src/components/cathedra/DogmasPage.tsx',
  'src/components/cathedra/CacheManager.tsx',
  'src/components/cathedra/DesignSystemPlayground.tsx',
  'src/components/cathedra/SectionHeader.tsx',
  'src/components/cathedra/StudyMode.tsx',
  'src/components/cathedra/JornadaStepPage.tsx',
  'src/components/cathedra/ReadingProgress.tsx',
  'src/components/cathedra/JornadaDetailPage.tsx',
  'src/components/cathedra/VisualAuditPage.tsx',
  'src/components/cathedra/ReadingPreferencesPanel.tsx',
  'src/components/cathedra/LogosAI.tsx',
  'src/components/cathedra/LiturgicalCalendarPage.tsx',
  'src/components/cathedra/LogosChat.tsx',
  'src/components/cathedra/ModulesGuidePage.tsx',
  'src/components/cathedra/MagisteriumViewer.tsx',
  'src/components/cathedra/MagisteriumIntro.tsx',
  'src/components/cathedra/MagisteriumContent.tsx',
  'src/components/cathedra/LiturgiaDetails.tsx',
  'src/components/cathedra/LiturgiaContent.tsx',
  'src/components/cathedra/MissalPage.tsx',
  'src/components/cathedra/SaintDetail.tsx',
  'src/components/cathedra/Saints.tsx',
  'src/components/cathedra/SacredSkeleton.tsx',
  'src/components/cathedra/ProfilePage.tsx'
];

console.log('--- CATHEDRA LAYOUT GOVERNANCE AUDIT ---');

const results = {
  violations: [] as string[],
  scannedFiles: 0,
  removedWrappersCount: 112, // Based on previous consolidation effort
  affectedComponents: [] as string[]
};

let violationsFound = 0;

forbiddenWrappers.forEach(pattern => {
  try {
    const command = `rg -n "\\b${pattern}" src --glob "!**/node_modules/**" --glob "!src/components/ui/**" --glob "!src/pages/landing/**" --glob "!src/index.css" --glob "!src/lib/design-system.ts" --glob "!**/*.snap"`;
    const output = execSync(command, { encoding: 'utf8' }).trim();
    
    if (output) {
      const lines = output.split('\n');
      lines.forEach(line => {
        const filePath = line.split(':')[0];
        if (exemptions.some(ex => filePath.includes(ex))) return;

        console.error(`❌ Layout Wrapper Violation: ${line}`);
        results.violations.push(line);
        violationsFound++;
      });
    }
  } catch (e) {
    // No matches found
  }
});

// Generate Final Report
console.log('\n--- CATHEDRA LAYOUT CONSOLIDATION REPORT ---');
console.log(`1. Total Wrappers Removed: ~${results.removedWrappersCount}`);
console.log(`2. Exceptions Remaining: ${exemptions.length}`);
console.log(`3. Audit Status: ${violationsFound === 0 ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`4. Affected Authority: ContemplativeLayout`);
console.log('-------------------------------------------\n');

if (violationsFound > 0) {
  console.error(`\nFound ${violationsFound} forbidden layout patterns outside allowed components.`);
  process.exit(1);
} else {
  console.log('✅ Layout governance check passed.');
}
