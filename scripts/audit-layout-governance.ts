#!/usr/bin/env bun
import { execSync } from 'child_process';

/**
 * CATHEDRA LAYOUT GOVERNANCE AUDIT
 * Blocks PRs if layout utility classes are used outside the layout authority.
 */

const forbiddenWrappers = [
  'max-w-',
  'mx-auto',
  'container'
];

const exemptionPatterns = [
  // Layout Authorities
  'src/components/cathedra/ContemplativeLayout.tsx',
  'src/components/cathedra/AppHeader.tsx',
  'src/components/cathedra/ItinerariumStepPage.tsx',
  
  // Design System & Core UI
  'src/components/ui/',
  'src/lib/design-system.ts',
  'src/index.css',
  
  // Landing Pages (Separate Layout Logic)
  'src/pages/landing/',
  'src/components/landing/',
  
  // Test Infrastructure
  'test',
  '.snap',
  'node_modules',
  
  // Explicitly Audited Exceptions (Legacy or complex UI)
  'src/components/cathedra/Auth.tsx',
  'src/components/cathedra/Catechism.tsx', // Nested reader prose needs max-w-none
  'src/components/cathedra/RouteSkeletons.tsx',
  'src/components/cathedra/OfflinePage.tsx',
  'src/components/cathedra/TransactionsPage.tsx',
  'src/components/cathedra/PricingPage.tsx',
  'src/components/cathedra/UpgradePage.tsx',
  'src/components/cathedra/OnboardingPage.tsx',
  'src/components/cathedra/ResetPasswordPage.tsx',
  'src/components/cathedra/DesignSystemGuide.tsx',
  'src/components/cathedra/ViaCrucis.tsx',
  'src/components/cathedra/PrayerPage.tsx',
  'src/components/cathedra/ProShowcase.tsx',
  'src/components/cathedra/NexusBubbles.tsx',
  'src/components/cathedra/ReadingJournal.tsx',
  'src/components/cathedra/QuickModals.tsx',
  'src/components/cathedra/A11ySettingsPanel.tsx',
  'src/components/cathedra/RouteSkeletons.tsx'
];

console.log('--- CATHEDRA LAYOUT GOVERNANCE AUDIT ---');
console.log('Rules:');
console.log('1. All layout-critical utility classes (max-w-*, mx-auto, container) must reside in ContemplativeLayout.');
console.log('2. Exceptions are allowed for AppHeader (sticky positioning) and ItinerariumStepPage (portal-based full-screen).');
console.log('3. Any new exception requires explicit approval and entry in exemptionPatterns.');

let violationsFound = 0;
const violationDetails: string[] = [];

forbiddenWrappers.forEach(pattern => {
  try {
    const command = `rg -n "\\b${pattern}" src --glob "!**/*.test.tsx" --glob "!**/*.spec.ts" --glob "!**/*.snap" --glob "!node_modules/**"`;
    const output = execSync(command, { encoding: 'utf8' }).trim();
    
    if (output) {
      const lines = output.split('\n');
      lines.forEach(line => {
        const filePath = line.split(':')[0];
        if (exemptionPatterns.some(ex => filePath.includes(ex))) return;

        if (line.includes('max-w-none') || line.includes('max-w-[12px]') || line.includes('max-w-fit')) return;

        violationDetails.push(line);
        violationsFound++;
      });
    }
  } catch (e) {
    // No matches
  }
});

if (violationDetails.length > 0) {
  console.error('\n❌ VIOLATIONS DETECTED:');
  violationDetails.forEach(v => console.error(`  - ${v}`));
}

console.log('\n--- CATHEDRA LAYOUT CONSOLIDATION REPORT ---');
console.log(`- Governance Status: ${violationsFound === 0 ? '✅ PASSED' : '⚠️ FAILED'}`);
console.log(`- Active Violations: ${violationsFound}`);
console.log(`- Documented Exceptions: ${exemptionPatterns.length}`);
console.log('-------------------------------------------\n');

if (violationsFound > 0) {
  console.error('ERROR: Layout governance check failed. Please remove the prohibited classes or update exemptionPatterns in scripts/audit-layout-governance.ts if this is a valid exception.');
  process.exit(1);
} else {
  console.log('SUCCESS: All layout rules respected.');
}

