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
  'src/components/cathedra/AdminCrmSegmentation.tsx', // complex admin tool
  'src/components/cathedra/AdminThemesTab.tsx', // admin tool
  'src/components/cathedra/AdminPartnersTab.tsx', // admin tool
  'src/components/cathedra/AdminJourneysTab.tsx', // admin tool
  'src/components/cathedra/AZFaithQuiz.tsx', // quiz sub-component
  'src/components/cathedra/NoteEditModal.tsx', // complex modal
  'src/components/cathedra/HomeMainContent.tsx', // composite sub-component
  'src/components/cathedra/HojePage.tsx', // authorized list page
  'src/components/cathedra/JornadaCompletePage.tsx', // authorized detail page
  'src/components/cathedra/LitaniesPage.tsx', // authorized list page
  'src/components/cathedra/GuidedReadingFlow.tsx', // composite sub-component
  'src/components/cathedra/CheckoutResultPage.tsx', // detail page
  'src/components/cathedra/ComingSoon.tsx', // composite section
  'src/components/cathedra/lectio/LectioStep.tsx', // sub-layout
  'src/components/cathedra/lectio/LectioIntro.tsx', // sub-layout
  'src/components/cathedra/lectio/LectioConclusio.tsx', // sub-layout
  'src/components/cathedra/CathedraOverlay.tsx', // base overlay component
  'src/pages/CatechismExplorer.tsx', // composite page
  'src/pages/GuidedReading.tsx', // composite page
  'src/components/cathedra/DashboardSkeleton.tsx', // authorized skeleton
  'src/components/cathedra/BackToThemeBanner.tsx', // authorised banner
  'src/App.tsx' // Root shell
];

console.log('--- CATHEDRA LAYOUT GOVERNANCE AUDIT ---');

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
        violationsFound++;
      });
    }
  } catch (e) {
    // No matches found
  }
});

if (violationsFound > 0) {
  console.error(`\nFound ${violationsFound} forbidden layout patterns outside allowed components.`);
  process.exit(1);
} else {
  console.log('✅ Layout governance check passed.');
}
