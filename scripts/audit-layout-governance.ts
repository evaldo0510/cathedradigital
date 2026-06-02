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
  'src/components/cathedra/A11ySettingsPanel.tsx', // complex side panel
  'src/components/cathedra/CatechismDebug.tsx', // debug admin tool
  'src/components/cathedra/AdminDashboard.tsx', // complex admin tool
  'src/components/cathedra/AparicoesPage.tsx', // authorized interactive page
  'src/components/cathedra/Magisterium.tsx', // authorized list page
  'src/components/cathedra/AquinasOpera.tsx', // authorized list page
  'src/components/cathedra/AchievementsPage.tsx', // authorized detail page
  'src/components/cathedra/SpiritualProfile.tsx', // authorized detail page
  'src/components/cathedra/Certamen.tsx', // authorized quiz page
  'src/components/cathedra/AZFaithPage.tsx', // authorized interactive page
  'src/pages/SEOVerificationPage.tsx', // admin tool
  'src/components/cathedra/CatechismIntegrity.tsx', // admin tool
  'src/components/cathedra/AppErrorBoundary.tsx', // error boundary layout
  'src/components/cathedra/A11yAuditPage.tsx' // internal audit tool
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
